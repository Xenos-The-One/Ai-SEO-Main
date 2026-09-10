import { getDb } from "./db";
import { googleAnalyticsConnections, content, contentAnalytics } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { decryptSecret } from "./_core/crypto";

/**
 * Google Analytics 4 Data API integration.
 *
 * Auth uses a service account: the client pastes the JSON key (client_email + private_key)
 * in the Analytics tab, grants that email Viewer access on their GA4 property, and we mint a
 * short-lived OAuth token (signed JWT → token endpoint) to call the GA4 Data API server-side.
 */

interface GAMetrics {
  sessions: number;
  pageviews: number;
  users: number;
  bounceRate: number;
  avgSessionDuration: number;
}

interface GAPageMetrics {
  pagePath: string;
  pageviews: number;
  users: number;
  avgTimeOnPage: number;
  engagementRate: number; // 0-1
}

const GA_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

/** GA4 property id as the API wants it: bare numeric id (strips a "properties/" prefix). */
function normalizePropertyId(propertyId: string): string {
  return propertyId.trim().replace(/^properties\//, "");
}

export async function getGAConnection(clientId: number) {
  const db = await getDb();
  if (!db) return null;
  const connections = await db
    .select()
    .from(googleAnalyticsConnections)
    .where(
      and(
        eq(googleAnalyticsConnections.clientId, clientId),
        eq(googleAnalyticsConnections.isActive, 1)
      )
    )
    .limit(1);
  const connection = connections[0] || null;
  // Decrypt the service-account key for use (stored encrypted at rest; legacy plaintext
  // is returned unchanged and gets encrypted on the next save).
  if (connection?.serviceAccountKey) {
    connection.serviceAccountKey = decryptSecret(connection.serviceAccountKey);
  }
  return connection;
}

/** Exchange a service-account key for a short-lived GA read-only access token. */
async function getAccessToken(serviceAccountKey: string): Promise<string> {
  let parsed: { client_email?: string; private_key?: string };
  try {
    parsed = JSON.parse(serviceAccountKey);
  } catch {
    throw new Error("Service account key is not valid JSON. Paste the full JSON key file.");
  }
  const { client_email, private_key } = parsed;
  if (!client_email || !private_key) {
    throw new Error("Service account key is missing client_email or private_key.");
  }

  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    { scope: GA_SCOPE, aud: TOKEN_URL, iss: client_email, iat: now, exp: now + 3600 },
    private_key,
    { algorithm: "RS256" }
  );

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google token exchange failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("Google token response had no access_token.");
  return json.access_token;
}

async function runReport(propertyId: string, accessToken: string, body: unknown): Promise<any> {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${normalizePropertyId(propertyId)}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GA4 runReport failed (${res.status}): ${text.slice(0, 300)}`);
  }
  return res.json();
}

function num(v: string | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Overall traffic metrics for the property over a date range. */
export async function fetchGAMetrics(
  clientId: number,
  startDate: string,
  endDate: string
): Promise<GAMetrics | null> {
  const connection = await getGAConnection(clientId);
  if (!connection?.propertyId || !connection.serviceAccountKey) return null;

  const token = await getAccessToken(connection.serviceAccountKey);
  const data = await runReport(connection.propertyId, token, {
    dateRanges: [{ startDate, endDate }],
    metrics: [
      { name: "sessions" },
      { name: "screenPageViews" },
      { name: "totalUsers" },
      { name: "bounceRate" },
      { name: "averageSessionDuration" },
    ],
  });
  const row = data.rows?.[0];
  const m = (i: number) => num(row?.metricValues?.[i]?.value);
  return {
    sessions: m(0),
    pageviews: m(1),
    users: m(2),
    bounceRate: m(3),
    avgSessionDuration: m(4),
  };
}

/** Per-page metrics, ordered by pageviews desc. */
export async function fetchGAPageMetrics(
  clientId: number,
  startDate: string,
  endDate: string,
  limit: number = 10
): Promise<GAPageMetrics[]> {
  const connection = await getGAConnection(clientId);
  if (!connection?.propertyId || !connection.serviceAccountKey) return [];

  const token = await getAccessToken(connection.serviceAccountKey);
  const data = await runReport(connection.propertyId, token, {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: "pagePath" }],
    metrics: [
      { name: "screenPageViews" },
      { name: "totalUsers" },
      { name: "averageSessionDuration" },
      { name: "engagementRate" },
    ],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit,
  });

  return (data.rows ?? []).map((r: any) => ({
    pagePath: r.dimensionValues?.[0]?.value ?? "",
    pageviews: num(r.metricValues?.[0]?.value),
    users: num(r.metricValues?.[1]?.value),
    avgTimeOnPage: num(r.metricValues?.[2]?.value),
    engagementRate: num(r.metricValues?.[3]?.value),
  }));
}

/**
 * Keyword/query data comes from the Search Console API (not GA4) and isn't wired up.
 * Returns empty rather than fabricated data.
 */
export async function fetchKeywordData(
  _clientId: number,
  _startDate: string,
  _endDate: string,
  _limit: number = 20
): Promise<[]> {
  return [];
}

/** Turn a title into a URL-ish slug for best-effort page matching. */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Path portion of a URL (or the input if it's already a path). */
function pathOf(url: string): string {
  try {
    return new URL(url).pathname.replace(/\/+$/, "").toLowerCase() || "/";
  } catch {
    return url.replace(/\/+$/, "").toLowerCase();
  }
}

/**
 * Pick the GA page that best matches a content piece: exact path from its publishedUrl when
 * set, otherwise a page whose path contains the slugified title. Returns null if no match.
 */
export function matchPage(
  item: { title: string; publishedUrl: string | null },
  pages: GAPageMetrics[]
): GAPageMetrics | null {
  if (item.publishedUrl) {
    const target = pathOf(item.publishedUrl);
    const exact = pages.find((p) => pathOf(p.pagePath) === target);
    if (exact) return exact;
  }
  const slug = slugify(item.title);
  if (slug.length >= 3) {
    const bySlug = pages.find((p) => p.pagePath.toLowerCase().includes(slug));
    if (bySlug) return bySlug;
  }
  return null;
}

/**
 * Pull page metrics from GA and write a fresh `contentAnalytics` snapshot for each content
 * piece we can match to a page. Snapshots are append-only; readers take the latest per piece.
 */
export async function syncContentPerformance(clientId: number) {
  const connection = await getGAConnection(clientId);
  if (!connection) return { success: false, message: "No GA connection found" };
  if (!connection.serviceAccountKey) {
    return { success: false, message: "This connection has no service account key. Add the JSON key and save." };
  }

  const db = await getDb();
  if (!db) return { success: false, message: "Database not available" };

  const clientContent = await db
    .select({ id: content.id, title: content.title, publishedUrl: content.publishedUrl })
    .from(content)
    .where(eq(content.clientId, clientId));

  if (clientContent.length === 0) {
    return { success: false, message: "This client has no content to sync." };
  }

  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  let pages: GAPageMetrics[];
  try {
    pages = await fetchGAPageMetrics(clientId, startDate, endDate, 500);
  } catch (error: any) {
    return { success: false, message: error?.message || "Failed to fetch GA page metrics" };
  }

  let matched = 0;
  const now = new Date();
  for (const item of clientContent) {
    const page = matchPage(item, pages);
    if (!page) continue;
    matched += 1;
    await db.insert(contentAnalytics).values({
      contentId: item.id,
      views: Math.round(page.pageviews),
      clicks: 0,
      shares: 0,
      engagementRate: Math.round(page.engagementRate * 100),
      avgTimeOnPage: Math.round(page.avgTimeOnPage),
      conversions: 0,
      recordedAt: now,
    });
  }

  await db
    .update(googleAnalyticsConnections)
    .set({ lastSyncedAt: now })
    .where(eq(googleAnalyticsConnections.id, connection.id));

  return {
    success: true,
    matched,
    totalContent: clientContent.length,
    totalPages: pages.length,
    message:
      matched === 0
        ? `Fetched ${pages.length} GA pages but matched none to content. Set each piece's Published URL to match its live page.`
        : `Synced GA performance for ${matched} of ${clientContent.length} content pieces.`,
  };
}
