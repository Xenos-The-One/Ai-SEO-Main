/**
 * Technical + on-page SEO crawler.
 *
 * Fetches a live URL, parses the HTML with cheerio, runs technical/on-page checks, does a
 * capped broken-link probe, and (when PAGESPEED_API_KEY is set) pulls Core Web Vitals from
 * Google PageSpeed Insights. Everything is real — no LLM guessing.
 */
import * as cheerio from "cheerio";
import { ENV } from "../_core/env";

export type AuditSeverity = "critical" | "warning" | "info";

export type AuditIssue = {
  severity: AuditSeverity;
  category: string;
  message: string;
  recommendation: string;
};

export type AuditMetrics = {
  statusCode: number;
  responseTimeMs: number;
  title: string | null;
  titleLength: number;
  metaDescription: string | null;
  metaDescriptionLength: number;
  canonical: string | null;
  h1Count: number;
  h2Count: number;
  wordCount: number;
  imageCount: number;
  imagesMissingAlt: number;
  internalLinks: number;
  externalLinks: number;
  hasViewport: boolean;
  hasLang: boolean;
  hasStructuredData: boolean;
  indexable: boolean;
  // Richer specifics
  h1Text: string | null;
  lang: string | null;
  ogTitle: string | null;
  ogImage: string | null;
  hasTwitterCard: boolean;
  hreflangCount: number;
  robotsTxt: boolean;
  sitemap: boolean;
  robotsDirective: string | null;
};

export type BrokenLink = { url: string; status: number | null };

export type PageSpeed = {
  performanceScore: number | null; // 0-100
  lcpMs: number | null;
  cls: number | null;
  tbtMs: number | null;
} | null;

export type AuditResult = {
  url: string;
  finalUrl: string;
  fetchedAt: string;
  score: number; // 0-100
  metrics: AuditMetrics;
  issues: AuditIssue[];
  brokenLinks: BrokenLink[];
  pageSpeed: PageSpeed;
};

const SEVERITY_WEIGHT: Record<AuditSeverity, number> = { critical: 15, warning: 7, info: 2 };

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
  method: "GET" | "HEAD" = "GET"
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "AI-SEO-Portal-Audit/1.0 (+https://example.com/bot)" },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function checkBrokenLinks(urls: string[]): Promise<BrokenLink[]> {
  const results = await Promise.all(
    urls.map(async (u): Promise<BrokenLink> => {
      try {
        let res = await fetchWithTimeout(u, 6000, "HEAD");
        // Some servers reject HEAD; retry with GET before declaring it broken.
        if (res.status === 405 || res.status === 501) {
          res = await fetchWithTimeout(u, 6000, "GET");
        }
        return { url: u, status: res.status };
      } catch {
        return { url: u, status: null };
      }
    })
  );
  return results.filter((r) => r.status === null || r.status >= 400);
}

async function fetchPageSpeed(url: string): Promise<PageSpeed> {
  if (!ENV.pageSpeedApiKey) return null;
  try {
    const api = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    api.searchParams.set("url", url);
    api.searchParams.set("strategy", "mobile");
    api.searchParams.set("category", "performance");
    api.searchParams.set("key", ENV.pageSpeedApiKey);
    const res = await fetchWithTimeout(api.toString(), 30000);
    if (!res.ok) return null;
    const json: any = await res.json();
    const lh = json?.lighthouseResult;
    const audits = lh?.audits ?? {};
    const perf = lh?.categories?.performance?.score;
    return {
      performanceScore: typeof perf === "number" ? Math.round(perf * 100) : null,
      lcpMs: audits?.["largest-contentful-paint"]?.numericValue ?? null,
      cls: audits?.["cumulative-layout-shift"]?.numericValue ?? null,
      tbtMs: audits?.["total-blocking-time"]?.numericValue ?? null,
    };
  } catch {
    return null;
  }
}

export async function auditUrl(
  rawUrl: string,
  opts: { checkLinks?: boolean } = {}
): Promise<AuditResult> {
  const checkLinks = opts.checkLinks ?? true;
  const url = normalizeUrl(rawUrl);

  const started = Date.now();
  const res = await fetchWithTimeout(url, 15000);
  const responseTimeMs = Date.now() - started;
  const finalUrl = res.url || url;
  const statusCode = res.status;
  const html = await res.text();

  const $ = cheerio.load(html);

  // --- Extract elements ---
  const title = $("head title").first().text().trim() || $("title").first().text().trim() || null;
  const metaDescription = ($('meta[name="description"]').attr("content") ?? "").trim() || null;
  const canonical = $('link[rel="canonical"]').attr("href")?.trim() || null;
  const robots = ($('meta[name="robots"]').attr("content") ?? "").toLowerCase();
  const indexable = statusCode < 400 && !/noindex/.test(robots);
  const h1Count = $("h1").length;
  const h2Count = $("h2").length;
  const hasViewport = $('meta[name="viewport"]').length > 0;
  const hasLang = Boolean($("html").attr("lang"));
  const hasStructuredData = $('script[type="application/ld+json"]').length > 0;
  const h1Text = $("h1").first().text().trim() || null;
  const lang = $("html").attr("lang")?.trim() || null;
  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim() || null;
  const ogImage = $('meta[property="og:image"]').attr("content")?.trim() || null;
  const hasTwitterCard = $('meta[name="twitter:card"]').length > 0;
  const hreflangCount = $('link[rel="alternate"][hreflang]').length;
  const robotsDirective = ($('meta[name="robots"]').attr("content") ?? "").trim() || null;

  const images = $("img");
  const imageCount = images.length;
  let imagesMissingAlt = 0;
  images.each((_, el) => {
    const alt = $(el).attr("alt");
    if (alt === undefined || alt.trim() === "") imagesMissingAlt += 1;
  });

  // Links: resolve against the final URL, classify internal vs external.
  let host = "";
  try { host = new URL(finalUrl).host; } catch { /* ignore */ }
  let internalLinks = 0;
  let externalLinks = 0;
  const internalHrefs = new Set<string>();
  $("a[href]").each((_, el) => {
    const href = ($(el).attr("href") ?? "").trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return;
    let abs: URL;
    try { abs = new URL(href, finalUrl); } catch { return; }
    if (abs.protocol !== "http:" && abs.protocol !== "https:") return;
    if (abs.host === host) {
      internalLinks += 1;
      internalHrefs.add(abs.toString());
    } else {
      externalLinks += 1;
    }
  });

  // Word count from visible body text.
  $("script, style, noscript, template").remove();
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText ? bodyText.split(" ").filter(Boolean).length : 0;

  // Site-level files (best-effort).
  let robotsTxt = false;
  let sitemap = false;
  try {
    const origin = new URL(finalUrl).origin;
    const [r, s] = await Promise.all([
      fetchWithTimeout(`${origin}/robots.txt`, 5000, "GET").then((x) => x.status).catch(() => 0),
      fetchWithTimeout(`${origin}/sitemap.xml`, 5000, "HEAD").then((x) => x.status).catch(() => 0),
    ]);
    robotsTxt = r >= 200 && r < 400;
    sitemap = s >= 200 && s < 400;
  } catch {
    /* ignore */
  }

  const metrics: AuditMetrics = {
    statusCode,
    responseTimeMs,
    title,
    titleLength: title?.length ?? 0,
    metaDescription,
    metaDescriptionLength: metaDescription?.length ?? 0,
    canonical,
    h1Count,
    h2Count,
    wordCount,
    imageCount,
    imagesMissingAlt,
    internalLinks,
    externalLinks,
    hasViewport,
    hasLang,
    hasStructuredData,
    indexable,
    h1Text,
    lang,
    ogTitle,
    ogImage,
    hasTwitterCard,
    hreflangCount,
    robotsTxt,
    sitemap,
    robotsDirective,
  };

  // --- Build issues ---
  const issues: AuditIssue[] = [];
  const add = (severity: AuditSeverity, category: string, message: string, recommendation: string) =>
    issues.push({ severity, category, message, recommendation });

  if (statusCode >= 400) {
    add("critical", "technical", `Page returned HTTP ${statusCode}`, "Fix the server error or broken URL so the page is reachable.");
  }
  if (!indexable) {
    add("critical", "indexing", "Page is set to noindex", "Remove the noindex directive if this page should appear in search results.");
  }
  if (!title) {
    add("critical", "on-page", "Missing <title> tag", "Add a unique, descriptive title of 30–60 characters.");
  } else if (metrics.titleLength > 60) {
    add("warning", "on-page", `Title is long (${metrics.titleLength} chars)`, "Keep the title under ~60 characters so it isn't truncated in search results.");
  } else if (metrics.titleLength < 30) {
    add("info", "on-page", `Title is short (${metrics.titleLength} chars)`, "Consider a more descriptive title of 30–60 characters.");
  }
  if (!metaDescription) {
    add("warning", "on-page", "Missing meta description", "Add a compelling meta description of 70–160 characters.");
  } else if (metrics.metaDescriptionLength > 160) {
    add("warning", "on-page", `Meta description is long (${metrics.metaDescriptionLength} chars)`, "Keep it under ~160 characters to avoid truncation.");
  } else if (metrics.metaDescriptionLength < 70) {
    add("info", "on-page", `Meta description is short (${metrics.metaDescriptionLength} chars)`, "Aim for 70–160 characters to use the available space.");
  }
  if (h1Count === 0) {
    add("critical", "on-page", "No H1 heading", "Add a single H1 that describes the page's main topic.");
  } else if (h1Count > 1) {
    add("warning", "on-page", `Multiple H1 headings (${h1Count})`, "Use exactly one H1 per page; demote the rest to H2/H3.");
  }
  if (imagesMissingAlt > 0) {
    add("warning", "accessibility", `${imagesMissingAlt} of ${imageCount} images missing alt text`, "Add descriptive alt text to every meaningful image.");
  }
  if (!canonical) {
    add("info", "technical", "No canonical URL", "Add a <link rel=\"canonical\"> to prevent duplicate-content issues.");
  }
  if (!hasViewport) {
    add("warning", "mobile", "No viewport meta tag", "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> for mobile-friendliness.");
  }
  if (!hasLang) {
    add("info", "accessibility", "No lang attribute on <html>", "Set the page language, e.g. <html lang=\"en\">.");
  }
  if (statusCode < 400 && wordCount < 300) {
    add("warning", "content", `Thin content (${wordCount} words)`, "Aim for substantive content; pages under ~300 words often struggle to rank.");
  }
  if (!hasStructuredData) {
    add("info", "technical", "No structured data (JSON-LD)", "Add schema.org JSON-LD to enable rich results.");
  }
  if (responseTimeMs > 2000) {
    add("warning", "performance", `Slow server response (${responseTimeMs} ms)`, "Improve TTFB via caching/CDN; aim for under ~800 ms.");
  }
  if (!ogTitle || !ogImage) {
    add("info", "social", "Missing Open Graph tags", "Add og:title and og:image so links render richly when shared on social media.");
  }
  if (!hasTwitterCard) {
    add("info", "social", "No Twitter/X Card tag", "Add a twitter:card meta tag for better X/Twitter link previews.");
  }
  if (statusCode < 400 && !robotsTxt) {
    add("warning", "technical", "No robots.txt found", "Add a robots.txt at the site root to guide crawlers.");
  }
  if (statusCode < 400 && !sitemap) {
    add("warning", "technical", "No sitemap.xml found", "Add a sitemap.xml so search engines can discover all your pages.");
  }

  // --- Broken links (capped, best-effort) ---
  let brokenLinks: BrokenLink[] = [];
  if (checkLinks && internalHrefs.size > 0) {
    const sample = Array.from(internalHrefs).slice(0, 12);
    brokenLinks = await checkBrokenLinks(sample);
    if (brokenLinks.length > 0) {
      add("warning", "links", `${brokenLinks.length} broken internal link(s) found`, "Fix or remove links that return an error or don't resolve.");
    }
  }

  const pageSpeed = await fetchPageSpeed(finalUrl);
  if (pageSpeed?.performanceScore != null && pageSpeed.performanceScore < 50) {
    add("warning", "performance", `Low PageSpeed performance score (${pageSpeed.performanceScore}/100)`, "Optimize LCP, reduce blocking time, and compress assets.");
  }

  // --- Score ---
  const penalty = issues.reduce((sum, i) => sum + SEVERITY_WEIGHT[i.severity], 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));

  return {
    url,
    finalUrl,
    fetchedAt: new Date().toISOString(),
    score,
    metrics,
    issues,
    brokenLinks,
    pageSpeed,
  };
}
