/**
 * Social posting via Zernio.
 *
 * One REST API (Bearer auth) posts to 16 networks. Accounts are connected once in Zernio and
 * referenced by id. Posting publishes on the user's behalf, so callers must gate this behind an
 * explicit approve step. This is a thin adapter — swappable for another provider without touching callers.
 */
import { ENV } from "../_core/env";

const BASE_URL = "https://zernio.com/api/v1";

function authHeader(): string {
  if (!ENV.zernioApiKey) {
    throw new Error("Social posting is not configured. Set ZERNIO_API_KEY in your environment.");
  }
  return `Bearer ${ENV.zernioApiKey}`;
}

async function zernio<T = any>(path: string, init: { method: "GET" | "POST"; body?: unknown }): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: init.method,
    headers: { authorization: authHeader(), "content-type": "application/json" },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const json: any = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = json?.message || json?.error || `${response.status} ${response.statusText}`;
    throw new Error(`Zernio request failed: ${msg}`);
  }
  return json as T;
}

export type LinkedAccount = { id: string; platform: string };

/** The social accounts connected to the Zernio workspace. */
export async function getLinkedAccounts(): Promise<LinkedAccount[]> {
  const json = await zernio<{ accounts?: Array<{ _id: string; platform: string }> }>("/accounts", { method: "GET" });
  return (json.accounts ?? []).map((a) => ({ id: a._id, platform: a.platform }));
}

export type SocialTarget = { platform: string; accountId: string };

export type SocialPostResult = {
  id: string;
  status: string; // scheduled | publishing | published | failed | partial
  postUrls: Array<{ platform: string; url: string }>;
  raw: unknown;
};

/** Publish (or schedule) a post to the selected connected accounts. */
export async function postToSocial(input: {
  content: string;
  accounts: SocialTarget[];
  publishNow?: boolean;
  scheduledFor?: string;
  timezone?: string;
}): Promise<SocialPostResult> {
  if (!input.content.trim()) throw new Error("Post text is required");
  if (!input.accounts.length) throw new Error("Select at least one account");

  const body: Record<string, unknown> = {
    content: input.content,
    platforms: input.accounts.map((a) => ({ platform: a.platform, accountId: a.accountId })),
  };
  if (input.scheduledFor) {
    body.scheduledFor = input.scheduledFor;
    body.timezone = input.timezone ?? "UTC";
  } else {
    body.publishNow = input.publishNow ?? true;
  }

  const json = await zernio<any>("/posts", { method: "POST", body });
  const post = json?.post ?? {};
  const postUrls = Array.isArray(post?.platforms)
    ? post.platforms
        .filter((p: any) => p?.platformPostUrl)
        .map((p: any) => ({ platform: p.platform, url: p.platformPostUrl }))
    : [];

  return { id: post?._id ?? "", status: post?.status ?? "unknown", postUrls, raw: json };
}
