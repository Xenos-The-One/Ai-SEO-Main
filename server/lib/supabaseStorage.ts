/**
 * Supabase Storage uploads (server-side, service_role key).
 *
 * Uploads bytes to a public bucket via the Storage REST API and returns the public URL.
 * Uses the service_role key so uploads bypass RLS; the bucket is public so reads need no auth.
 */
import { ENV } from "../_core/env";

export type UploadedFile = { path: string; url: string };

function baseUrl(): string {
  if (!ENV.supabaseUrl) throw new Error("SUPABASE_URL is not configured");
  if (!ENV.supabaseServiceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  return ENV.supabaseUrl.replace(/\/$/, "");
}

export function extensionForMime(mimeType: string): string {
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";
  if (mimeType.includes("webp")) return "webp";
  return "png";
}

/** Upload base64-encoded bytes to Supabase Storage and return the public URL. */
export async function uploadImage(
  base64: string,
  mimeType: string,
  path: string
): Promise<UploadedFile> {
  const root = baseUrl();
  const bucket = ENV.supabaseStorageBucket;
  const bytes = Buffer.from(base64, "base64");

  const response = await fetch(`${root}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${ENV.supabaseServiceRoleKey}`,
      "content-type": mimeType,
      "x-upsert": "true",
      "cache-control": "public, max-age=31536000, immutable",
    },
    body: bytes,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Supabase storage upload failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`);
  }

  return {
    path,
    url: `${root}/storage/v1/object/public/${bucket}/${path}`,
  };
}
