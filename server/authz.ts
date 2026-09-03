import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import {
  abTests,
  aiBrands,
  aiPrompts,
  clientPortalUsers,
  clients,
  content,
  contentBriefs,
  contentComments,
  contentRepurposed,
  contentRevisions,
  contentTemplates,
  designStandards,
  googleAnalyticsConnections,
  recurringPlans,
  webhookConfigs,
  wordpressConnections,
} from "../drizzle/schema";

/**
 * Object-level authorization guards. Every resource is owned by the agency user who
 * created it (directly via `createdBy`, or transitively through its parent client /
 * content / brand). Each guard throws FORBIDDEN unless the row exists AND belongs to
 * `userId`, closing the IDOR where any logged-in user could act on any row by id.
 *
 * Call these in tRPC resolvers before reading, mutating, or deleting a resource that
 * is addressed by a client-supplied id.
 */

function deny(): never {
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "You do not have access to this resource.",
  });
}

async function requireDb() {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  }
  return db;
}

/** Tables owned directly via a `createdBy` column referencing users.id. */
const OWNED_TABLES = {
  client: clients,
  content,
  template: contentTemplates,
  webhook: webhookConfigs,
  recurringPlan: recurringPlans,
  designStandard: designStandards,
  abTest: abTests,
  wordpressConnection: wordpressConnections,
  gaConnection: googleAnalyticsConnections,
  brand: aiBrands,
  aiPrompt: aiPrompts,
} as const;

type OwnedKind = keyof typeof OWNED_TABLES;

async function assertOwned(kind: OwnedKind, id: number, userId: number): Promise<void> {
  const table = OWNED_TABLES[kind] as any;
  const db = await requireDb();
  const rows = await db
    .select({ id: table.id })
    .from(table)
    .where(and(eq(table.id, id), eq(table.createdBy, userId)))
    .limit(1);
  if (rows.length === 0) deny();
}

// --- Directly-owned resources ---
export const assertClient = (userId: number, id: number) => assertOwned("client", id, userId);
export const assertContent = (userId: number, id: number) => assertOwned("content", id, userId);
export const assertTemplate = (userId: number, id: number) => assertOwned("template", id, userId);
export const assertWebhook = (userId: number, id: number) => assertOwned("webhook", id, userId);
export const assertRecurringPlan = (userId: number, id: number) =>
  assertOwned("recurringPlan", id, userId);
export const assertDesignStandard = (userId: number, id: number) =>
  assertOwned("designStandard", id, userId);
export const assertABTest = (userId: number, id: number) => assertOwned("abTest", id, userId);
export const assertWordpressConnection = (userId: number, id: number) =>
  assertOwned("wordpressConnection", id, userId);
export const assertGaConnection = (userId: number, id: number) =>
  assertOwned("gaConnection", id, userId);
export const assertBrand = (userId: number, id: number) => assertOwned("brand", id, userId);
export const assertAiPrompt = (userId: number, id: number) => assertOwned("aiPrompt", id, userId);

// --- Resources owned transitively through a parent ---

/** A content comment is owned by whoever owns its parent content. */
export async function assertContentComment(userId: number, commentId: number): Promise<void> {
  const db = await requireDb();
  const rows = await db
    .select({ id: contentComments.id })
    .from(contentComments)
    .innerJoin(content, eq(contentComments.contentId, content.id))
    .where(and(eq(contentComments.id, commentId), eq(content.createdBy, userId)))
    .limit(1);
  if (rows.length === 0) deny();
}

/** A repurposed item is owned by whoever owns its parent content. */
export async function assertRepurposed(userId: number, repurposedId: number): Promise<void> {
  const db = await requireDb();
  const rows = await db
    .select({ id: contentRepurposed.id })
    .from(contentRepurposed)
    .innerJoin(content, eq(contentRepurposed.contentId, content.id))
    .where(and(eq(contentRepurposed.id, repurposedId), eq(content.createdBy, userId)))
    .limit(1);
  if (rows.length === 0) deny();
}

/** A content revision is owned by whoever owns its parent content. */
export async function assertRevision(userId: number, revisionId: number): Promise<void> {
  const db = await requireDb();
  const rows = await db
    .select({ id: contentRevisions.id })
    .from(contentRevisions)
    .innerJoin(content, eq(contentRevisions.contentId, content.id))
    .where(and(eq(contentRevisions.id, revisionId), eq(content.createdBy, userId)))
    .limit(1);
  if (rows.length === 0) deny();
}

/** A content brief is owned by whoever owns its client. */
export async function assertBrief(userId: number, briefId: number): Promise<void> {
  const db = await requireDb();
  const rows = await db
    .select({ id: contentBriefs.id })
    .from(contentBriefs)
    .innerJoin(clients, eq(contentBriefs.clientId, clients.id))
    .where(and(eq(contentBriefs.id, briefId), eq(clients.createdBy, userId)))
    .limit(1);
  if (rows.length === 0) deny();
}

/** A client-portal user is owned by whoever owns its client. */
export async function assertPortalUser(userId: number, portalUserId: number): Promise<void> {
  const db = await requireDb();
  const rows = await db
    .select({ id: clientPortalUsers.id })
    .from(clientPortalUsers)
    .innerJoin(clients, eq(clientPortalUsers.clientId, clients.id))
    .where(and(eq(clientPortalUsers.id, portalUserId), eq(clients.createdBy, userId)))
    .limit(1);
  if (rows.length === 0) deny();
}
