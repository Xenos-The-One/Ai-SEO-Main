import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users, clients, InsertClient, content, InsertContent, contentTemplates, InsertContentTemplate, contentComments, contentRevisions, contentAnalytics, contentRepurposed, contentQualityScores, webhookConfigs, publishLogs, contentBriefs } from "../drizzle/schema";
import { ENV } from './_core/env';
import { decryptSecret, encryptSecret } from './_core/crypto';

/** Decrypt the stored website password on a client row before returning it. */
function decryptClient<T extends { websitePassword?: string | null }>(row: T | undefined): T | undefined {
  if (!row) return row;
  return { ...row, websitePassword: decryptSecret(row.websitePassword) };
}

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // `prepare: false` keeps us compatible with Supabase's transaction pooler (pgbouncer).
      const client = postgres(process.env.DATABASE_URL, { prepare: false });
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(data: InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(users).values(data).returning();
  return result[0];
}

/**
 * Whether `userId` is an agency admin. Admins may read and manage the whole agency's
 * data; non-admins are limited to rows they created. Used by the read helpers below and
 * by the authorization guards in ./authz. One indexed lookup by primary key.
 */
export async function isAgencyAdmin(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  return rows[0]?.role === "admin";
}

/** Revoke every outstanding session for a user by bumping their token version. */
export async function incrementUserTokenVersion(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [row] = await db
    .update(users)
    .set({ tokenVersion: sql`${users.tokenVersion} + 1` })
    .where(eq(users.id, userId))
    .returning({ tokenVersion: users.tokenVersion });
  return row.tokenVersion;
}

// Client management queries

/** Route segments under /portal that a client slug must never collide with. */
const RESERVED_PORTAL_SLUGS = new Set([
  "login",
  "logout",
  "dashboard",
  "content",
  "calendar",
  "performance",
  "approvals",
  "accept-invitation",
  "portal",
  "admin",
  "api",
]);

/** Turn a client name into a URL-safe slug base (lowercase, hyphenated, ASCII). */
export function slugify(input: string): string {
  const base = input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "client";
}

/** Generate a slug from `name` that is unique across clients and avoids reserved words. */
export async function generateUniqueClientSlug(name: string): Promise<string> {
  const db = await getDb();
  const base = slugify(name);
  let candidate = RESERVED_PORTAL_SLUGS.has(base) ? `${base}-portal` : base;
  if (!db) return candidate;
  for (let i = 0; i < 50; i++) {
    const existing = await db.select({ id: clients.id }).from(clients).where(eq(clients.slug, candidate)).limit(1);
    if (existing.length === 0) return candidate;
    candidate = `${base}-${i + 2}`;
  }
  // Extremely unlikely fallback: suffix with a short random token.
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function getClientBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clients).where(eq(clients.slug, slug)).limit(1);
  return decryptClient(result[0]);
}

/** Ensure a client has a portal slug, generating and persisting one if missing. Returns the slug. */
export async function ensureClientSlug(id: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getClientById(id);
  if (existing?.slug) return existing.slug;
  const slug = await generateUniqueClientSlug(existing?.name ?? "client");
  await db.update(clients).set({ slug, updatedAt: new Date() }).where(eq(clients.id, id));
  return slug;
}

/** Public (unauthenticated) portal branding lookup used by the branded login page. */
export async function getPublicBrandingBySlug(slug: string) {
  const client = await getClientBySlug(slug);
  if (!client) return null;
  const branding = await getPortalBranding(client.id);
  return {
    slug: client.slug,
    clientName: client.name,
    portalName: branding?.portalName || null,
    logoUrl: branding?.logoUrl || null,
    primaryColor: branding?.primaryColor || null,
    secondaryColor: branding?.secondaryColor || null,
    welcomeMessage: branding?.welcomeMessage || null,
  };
}

export async function createClient(client: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const slug = client.slug || (await generateUniqueClientSlug(client.name));
  const values = { ...client, slug, websitePassword: encryptSecret(client.websitePassword) };
  const result = await db.insert(clients).values(values).returning({ id: clients.id });
  return result[0].id;
}

export async function getClientsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  // Admins see every client; non-admins only their own.
  const admin = await isAgencyAdmin(userId);
  const rows = await db.select().from(clients).where(admin ? undefined : eq(clients.createdBy, userId));
  return rows.map((row) => decryptClient(row)!);
}

export async function getClientById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return decryptClient(result[0]);
}

export async function updateClient(id: number, updates: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const values: Partial<InsertClient> = { ...updates, updatedAt: new Date() };
  if ("websitePassword" in updates) {
    values.websitePassword = encryptSecret(updates.websitePassword);
  }
  await db.update(clients).set(values).where(eq(clients.id, id));
}

export async function deleteClient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(clients).where(eq(clients.id, id));
}

// Content management queries
export async function createContent(contentData: InsertContent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(content).values(contentData).returning({ id: content.id });
  return result[0].id;
}

export async function getContentByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const admin = await isAgencyAdmin(userId);
  return db.select().from(content).where(admin ? undefined : eq(content.createdBy, userId)).orderBy(content.createdAt);
}

export async function getContentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(content).where(eq(content.id, id)).limit(1);
  return result[0];
}

export async function updateContent(id: number, updates: Partial<InsertContent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(content).set({ ...updates, updatedAt: new Date() }).where(eq(content.id, id));
}

export async function deleteContent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(content).where(eq(content.id, id));
}

export async function getContentByClient(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(content).where(eq(content.clientId, clientId)).orderBy(content.createdAt);
}

export async function getContentWithClient(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const admin = await isAgencyAdmin(userId);
  const rows = await db
    .select({
      content: content,
      client: clients,
    })
    .from(content)
    .leftJoin(clients, eq(content.clientId, clients.id))
    .where(admin ? undefined : eq(content.createdBy, userId))
    .orderBy(content.createdAt);
  // Never surface stored client credentials through the content list.
  return rows.map((row) => ({
    ...row,
    client: row.client ? { ...row.client, websitePassword: null } : row.client,
  }));
}


// Template functions
export async function createTemplate(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contentTemplates).values(data);
  return result[0];
}

export async function getTemplatesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const admin = await isAgencyAdmin(userId);
  return db
    .select()
    .from(contentTemplates)
    .where(admin ? undefined : eq(contentTemplates.createdBy, userId))
    .orderBy(contentTemplates.createdAt);
}

export async function getPublicTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(contentTemplates)
    .where(eq(contentTemplates.isPublic, 1))
    .orderBy(contentTemplates.createdAt);
}

export async function getTemplateById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(contentTemplates)
    .where(eq(contentTemplates.id, id))
    .limit(1);
  return result[0] || null;
}

export async function updateTemplate(id: number, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contentTemplates).set(updates).where(eq(contentTemplates.id, id));
}

export async function deleteTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(contentTemplates).where(eq(contentTemplates.id, id));
}


// Collaboration functions
export async function addComment(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contentComments).values(data);
  return result[0];
}

export async function getContentComments(contentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(contentComments)
    .where(eq(contentComments.contentId, contentId))
    .orderBy(contentComments.createdAt);
}

export async function updateCommentStatus(id: number, isResolved: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contentComments).set({ isResolved }).where(eq(contentComments.id, id));
}

export async function createRevision(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contentRevisions).values(data);
  return result[0];
}

export async function getContentRevisions(contentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(contentRevisions)
    .where(eq(contentRevisions.contentId, contentId))
    .orderBy(contentRevisions.revisionNumber);
}

// Analytics functions
export async function recordAnalytics(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contentAnalytics).values(data);
  return result[0];
}

export async function getContentAnalytics(contentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(contentAnalytics)
    .where(eq(contentAnalytics.contentId, contentId))
    .orderBy(contentAnalytics.recordedAt);
}

export async function updateAnalytics(contentId: number, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contentAnalytics).set(updates).where(eq(contentAnalytics.contentId, contentId));
}

// Repurposing functions
export async function createRepurposedContent(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contentRepurposed).values(data);
  return result[0];
}

export async function getRepurposedContent(contentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(contentRepurposed)
    .where(eq(contentRepurposed.contentId, contentId))
    .orderBy(contentRepurposed.createdAt);
}

export async function deleteRepurposedContent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(contentRepurposed).where(eq(contentRepurposed.id, id));
}


// Quality Score functions
export async function saveQualityScore(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete existing score for this content first
  await db.delete(contentQualityScores).where(eq(contentQualityScores.contentId, data.contentId));
  const result = await db.insert(contentQualityScores).values(data);
  return result[0];
}

export async function getQualityScore(contentId: number) {
  const db = await getDb();
  if (!db) return null;
  const results = await db
    .select()
    .from(contentQualityScores)
    .where(eq(contentQualityScores.contentId, contentId))
    .limit(1);
  return results.length > 0 ? results[0] : null;
}


// Webhook Config functions
export async function createWebhookConfig(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(webhookConfigs).values(data).returning({ id: webhookConfigs.id });
  return result[0].id;
}

export async function getWebhooksByClient(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(webhookConfigs).where(eq(webhookConfigs.clientId, clientId));
}

export async function getAllWebhooks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const admin = await isAgencyAdmin(userId);
  return db.select().from(webhookConfigs).where(admin ? undefined : eq(webhookConfigs.createdBy, userId));
}

export async function getWebhookById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(webhookConfigs).where(eq(webhookConfigs.id, id)).limit(1);
  return result[0] || null;
}

export async function updateWebhookConfig(id: number, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(webhookConfigs).set({ ...updates, updatedAt: new Date() }).where(eq(webhookConfigs.id, id));
}

export async function deleteWebhookConfig(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(webhookConfigs).where(eq(webhookConfigs.id, id));
}

// Publish Log functions
export async function createPublishLog(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(publishLogs).values(data).returning({ id: publishLogs.id });
  return result[0].id;
}

export async function getPublishLogs(contentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(publishLogs).where(eq(publishLogs.contentId, contentId)).orderBy(publishLogs.publishedAt);
}

export async function updatePublishLog(id: number, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(publishLogs).set(updates).where(eq(publishLogs.id, id));
}

// Content Brief functions
export async function createContentBrief(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contentBriefs).values(data).returning({ id: contentBriefs.id });
  return result[0].id;
}

export async function getContentBriefs(clientId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (clientId) {
    return db.select().from(contentBriefs).where(eq(contentBriefs.clientId, clientId)).orderBy(contentBriefs.createdAt);
  }
  return db.select().from(contentBriefs).orderBy(contentBriefs.createdAt);
}

/** Briefs across every client owned by a given agency user. */
export async function getContentBriefsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const admin = await isAgencyAdmin(userId);
  const rows = await db
    .select({ brief: contentBriefs })
    .from(contentBriefs)
    .innerJoin(clients, eq(contentBriefs.clientId, clients.id))
    .where(admin ? undefined : eq(clients.createdBy, userId))
    .orderBy(contentBriefs.createdAt);
  return rows.map((r) => r.brief);
}

export async function getContentBriefByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(contentBriefs).where(eq(contentBriefs.shareToken, token)).limit(1);
  return result[0] || null;
}

export async function getContentBriefById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(contentBriefs).where(eq(contentBriefs.id, id)).limit(1);
  return result[0] || null;
}

export async function updateContentBrief(id: number, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contentBriefs).set({ ...updates, updatedAt: new Date() }).where(eq(contentBriefs.id, id));
}

export async function deleteContentBrief(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(contentBriefs).where(eq(contentBriefs.id, id));
}

// Portal Branding functions
export async function getPortalBranding(clientId: number) {
  const db = await getDb();
  if (!db) return null;
  const { portalBranding } = await import("../drizzle/schema");
  const result = await db.select().from(portalBranding).where(eq(portalBranding.clientId, clientId)).limit(1);
  return result[0] || null;
}

export async function upsertPortalBranding(data: {
  clientId: number;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  portalName?: string;
  welcomeMessage?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { portalBranding } = await import("../drizzle/schema");
  
  // Check if branding exists
  const existing = await getPortalBranding(data.clientId);
  
  if (existing) {
    // Update existing
    await db.update(portalBranding)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(portalBranding.clientId, data.clientId));
    return { ...existing, ...data };
  } else {
    // Insert new
    const result = await db.insert(portalBranding).values(data).returning({ id: portalBranding.id });
    return { id: result[0].id, ...data };
  }
}
