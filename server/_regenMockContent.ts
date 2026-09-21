/**
 * Rewrites the seeded demo-client content in place: long-form article bodies from the hand-written
 * library in `_mockContent/`, and a hero image per article that actually matches the topic (via the
 * Gemini -> Supabase Storage pipeline the product already uses).
 *
 * The original seeds produced ~370-900 word templated bodies and random `picsum.photos` heroes.
 * This pass updates `content` rows only - ids, dates, status, published URLs and the analytics
 * history are all preserved.
 *
 * Generated image URLs are cached on disk and keyed by scene, so a re-run reuses images already
 * paid for instead of regenerating them.
 *
 * Run (Git Bash):  NODE_ENV=development npx tsx server/_regenMockContent.ts
 * Env: ONLY=31,32   LIMIT=4   SKIP_IMAGES=1   DRY=1
 */
import "dotenv/config";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "./db";
import { generateImage } from "./_core/imageGeneration";
import { clients, content as contentTable } from "../drizzle/schema";
import { LOCALES } from "./_mockContent/mortgageLocales";
import { findPiece } from "./_mockContent/mortgageIndex";
import type { Ctx } from "./_mockContent/mortgageBlogs";
import { findGiancarloPiece, GIANCARLO_STYLE } from "./_mockContent/giancarloIndex";
import { findPeakflowPiece, PEAKFLOW_STYLE } from "./_mockContent/peakflowIndex";

const MORTGAGE_CLIENT_IDS = [31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45];
const GIANCARLO_CLIENT_ID = 6;
const PEAKFLOW_CLIENT_ID = 5;
const TARGET_CLIENT_IDS = [PEAKFLOW_CLIENT_ID, GIANCARLO_CLIENT_ID, ...MORTGAGE_CLIENT_IDS];

const ONLY = (process.env.ONLY || "").split(",").map((s) => Number(s.trim())).filter(Boolean);
const LIMIT = Number(process.env.LIMIT || 0);
const SKIP_IMAGES = process.env.SKIP_IMAGES === "1";
const DRY = process.env.DRY === "1";
const IMAGE_CONCURRENCY = Number(process.env.IMAGE_CONCURRENCY || 4);

const CACHE_DIR = process.env.REGEN_CACHE_DIR || path.join(os.tmpdir(), "mock-content-regen");
const IMAGE_CACHE = path.join(CACHE_DIR, "images.json");

const STATE_NAMES: Record<string, string> = {
  AZ: "Arizona", CA: "California", CO: "Colorado", FL: "Florida", GA: "Georgia", IA: "Iowa",
  IL: "Illinois", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MO: "Missouri",
  NC: "North Carolina", NV: "Nevada", NY: "New York", OH: "Ohio", OR: "Oregon",
  PA: "Pennsylvania", TN: "Tennessee", TX: "Texas", UT: "Utah", VA: "Virginia",
  WA: "Washington", WI: "Wisconsin",
};

/** Style treatments, one per client variant group, so neighbouring clients look distinct. */
const VARIANT_STYLES = [
  "Editorial photograph, natural daylight, shallow depth of field, honest documentary framing.",
  "Bright lifestyle photograph, warm golden tones, candid unposed moment, airy composition.",
  "Clean modern photograph, soft diffused window light, muted contemporary palette, calm composition.",
];

type Cache = Record<string, { url: string; prompt: string }>;
function loadCache(file: string): Cache {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return {}; }
}
function saveCache(file: string, data: Cache) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

const wordCountOf = (md: string) =>
  md.replace(/[#>*_`\-]/g, " ").split(/\s+/).filter(Boolean).length;

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function pool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) await fn(items[next++]);
    })
  );
}

async function withRetry<T>(label: string, fn: () => Promise<T>, tries = 3): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      console.warn(`  retry ${attempt}/${tries} - ${label}: ${String((err as Error).message).slice(0, 140)}`);
      if (attempt < tries) await new Promise((r) => setTimeout(r, 4000 * 2 ** (attempt - 1)));
    }
  }
  throw lastErr;
}

function buildImagePrompt(scene: string, style: string): string {
  return `${scene}. ${style} Wide 16:9 hero crop, photorealistic, high detail, real people with natural expressions. Absolutely no text, lettering, captions, signage copy, logos or watermarks anywhere in the image.`;
}

async function main() {
  const db = await getDb();
  if (!db) throw new Error("No DATABASE_URL - cannot run.");

  const ids = ONLY.length ? TARGET_CLIENT_IDS.filter((id) => ONLY.includes(id)) : TARGET_CLIENT_IDS;
  const clientRows = await db.select().from(clients).where(inArray(clients.id, ids));

  const known = new Set(clientRows.map((r) => r.id));
  const ctxOf = new Map<number, Ctx>();
  for (const r of clientRows) {
    const locale = LOCALES[r.id];
    if (!locale) continue;
    const state = r.state || "";
    ctxOf.set(r.id, {
      first: r.name.split(" ")[0],
      name: r.name,
      company: r.businessName || r.company || r.name,
      city: r.city || "",
      stateFull: STATE_NAMES[state] || state,
      website: r.businessWebsite || r.websiteUrl || "",
      L: locale,
    });
  }
  // Fixed variant per client so no two adjacent clients share a hero image.
  const variantOf = new Map<number, number>();
  MORTGAGE_CLIENT_IDS.forEach((id, i) => variantOf.set(id, i % VARIANT_STYLES.length));

  let rows = await db
    .select({
      id: contentTable.id,
      clientId: contentTable.clientId,
      title: contentTable.title,
      topic: contentTable.topic,
      contentType: contentTable.contentType,
    })
    .from(contentTable)
    .where(inArray(contentTable.clientId, ids));
  rows = rows
    .filter((r) => known.has(r.clientId))
    .sort((a, b) => a.clientId - b.clientId || a.id - b.id);
  if (LIMIT) rows = rows.slice(0, LIMIT);

  console.log(`${rows.length} content rows across ${known.size} clients | cache=${CACHE_DIR}`);

  // ---- Render bodies ----
  type Job = {
    id: number;
    title: string;
    topic: string;
    body: string;
    imageKey: string;
    scene: string;
    style: string;
  };
  const jobs: Job[] = [];
  const unmatched: string[] = [];
  for (const row of rows) {
    if (row.clientId === PEAKFLOW_CLIENT_ID) {
      const piece = findPeakflowPiece(row.title);
      if (!piece) { unmatched.push(`#${row.id} ${row.title}`); continue; }
      jobs.push({
        id: row.id,
        title: row.title,
        topic: row.topic || "",
        body: piece.render(),
        imageKey: `peakflow::${slug(piece.match)}`,
        scene: piece.scene,
        style: PEAKFLOW_STYLE,
      });
      continue;
    }
    if (row.clientId === GIANCARLO_CLIENT_ID) {
      const piece = findGiancarloPiece(row.title);
      if (!piece) { unmatched.push(`#${row.id} ${row.title}`); continue; }
      jobs.push({
        id: row.id,
        title: row.title,
        topic: row.topic || "",
        body: piece.render(),
        imageKey: `giancarlo::${slug(piece.match)}`,
        scene: piece.scene,
        style: GIANCARLO_STYLE,
      });
      continue;
    }
    const c = ctxOf.get(row.clientId);
    const piece = c && findPiece(row.title);
    if (!c || !piece) { unmatched.push(`#${row.id} ${row.title}`); continue; }
    const variant = variantOf.get(row.clientId) ?? 0;
    jobs.push({
      id: row.id,
      title: row.title,
      topic: (row.topic || "").replace(/\{state\}/gi, c.stateFull).replace(/\{city\}/gi, c.city),
      body: piece.render(c),
      imageKey: `mortgage::${slug(piece.match)}::v${variant}`,
      scene: piece.scenes[variant],
      style: VARIANT_STYLES[variant],
    });
  }
  if (unmatched.length) {
    console.warn(`No library match for ${unmatched.length} rows (left untouched):`);
    unmatched.slice(0, 10).forEach((u) => console.warn(`  ${u}`));
  }
  if (!jobs.length) throw new Error("Nothing matched the content library.");
  const words = jobs.map((j) => wordCountOf(j.body));
  console.log(
    `Rendered ${jobs.length} bodies | words min ${Math.min(...words)} / avg ${Math.round(
      words.reduce((a, b) => a + b, 0) / words.length
    )} / max ${Math.max(...words)}`
  );

  // ---- Images ----
  const images = loadCache(IMAGE_CACHE);
  if (!SKIP_IMAGES) {
    const wanted = new Map<string, string>();
    for (const j of jobs) {
      if (images[j.imageKey] || wanted.has(j.imageKey)) continue;
      wanted.set(j.imageKey, buildImagePrompt(j.scene, j.style));
    }
    const list = Array.from(wanted.entries());
    console.log(`Images: ${list.length} to generate, ${Object.keys(images).length} already cached.`);
    let done = 0;
    await pool(list, IMAGE_CONCURRENCY, async ([key, prompt]) => {
      try {
        const r = await withRetry(`image ${key}`, () => generateImage({ prompt, aspectRatio: "16:9" }));
        if (r.url) {
          images[key] = { url: r.url, prompt };
          saveCache(IMAGE_CACHE, images);
        }
      } catch (err) {
        console.warn(`  image failed (existing hero kept): ${key} - ${String((err as Error).message).slice(0, 120)}`);
      }
      done++;
      if (done % 5 === 0 || done === list.length) console.log(`  images: ${done}/${list.length}`);
    });
  }

  // ---- Write back ----
  let updated = 0;
  for (const j of jobs) {
    const img = images[j.imageKey];
    const patch: Record<string, unknown> = {
      content: j.body,
      topic: j.topic,
      wordCount: wordCountOf(j.body),
      updatedAt: new Date(),
    };
    if (img?.url) {
      patch.imageUrl = img.url;
      patch.imagePrompt = img.prompt;
    }
    if (DRY) {
      console.log(`DRY #${j.id} ${wordCountOf(j.body)}w img=${img?.url ? "yes" : "no"} ${j.title}`);
      continue;
    }
    await db.update(contentTable).set(patch).where(eq(contentTable.id, j.id));
    updated++;
  }
  console.log(`Done. ${updated} rows updated${DRY ? " (dry run - nothing written)" : ""}.`);
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
