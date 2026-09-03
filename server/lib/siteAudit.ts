/**
 * Full-site audit via the DataForSEO On-Page API.
 *
 * The On-Page crawl is asynchronous: `startSiteAudit` posts a crawl task and returns its
 * id; the caller then polls `getSiteAuditSummary` until `crawlProgress === "finished"`,
 * and finally pulls per-page results with `getSiteAuditPages`. All three ride on the
 * shared `dataForSeoPost` helper (array-of-tasks body, Basic auth).
 */
import { dataForSeoPost, normalizeDomain } from "./dataforseo";

/** Site-wide check counts DataForSEO reports in the summary's page_metrics.checks map. */
export type SiteAuditChecks = Record<string, number>;

export type SiteAuditSummary = {
  crawlProgress: string; // "in_progress" | "finished"
  pagesCrawled: number;
  pagesInQueue: number;
  onpageScore: number | null; // 0-100 average
  checks: SiteAuditChecks;
};

export type SiteAuditPageResult = {
  url: string;
  statusCode: number | null;
  onpageScore: number | null;
  issues: string[]; // human-readable failing checks for this page
};

/** Checks that represent serious problems (weighted as "critical" in our aggregate). */
const CRITICAL_CHECKS = new Set([
  "broken_links",
  "broken_resources",
  "duplicate_title_tag",
  "duplicate_meta_tags",
  "duplicate_content",
  "no_title",
  "no_h1_tag",
  "is_4xx_code",
  "is_5xx_code",
  "is_broken",
  "canonical_chain",
  "redirect_loop",
]);

/**
 * Per-page On-Page checks are boolean flags with MIXED polarity — some mean "problem
 * present" (true = bad, e.g. `no_title`), others "feature present" (true = good, e.g.
 * `is_https`). Only the negative ones below count as page issues; a `true` on anything
 * not listed here (a positive signal) is ignored.
 */
const PROBLEM_CHECKS = new Set([
  ...Array.from(CRITICAL_CHECKS),
  "no_description",
  "no_image_alt",
  "no_favicon",
  "no_doctype",
  "no_encoding_meta",
  "no_content_encoding",
  "high_loading_time",
  "low_content_rate",
  "small_page_size",
  "title_too_long",
  "title_too_short",
  "no_title_tag",
  "deprecated_html_tags",
  "low_readability_rate",
  "irrelevant_description",
  "irrelevant_title",
  "irrelevant_meta_keywords",
  "is_http", // served over plain HTTP (true = bad); note `is_https` true = good, so it's absent here
  "canonical_to_broken",
  "canonical_to_redirect",
  "recursive_canonical",
  "has_render_blocking_resources",
  "is_orphan_page",
  "is_link_relation_conflict",
]);

/** Start an On-Page crawl. Returns the DataForSEO task id to poll. */
export async function startSiteAudit(
  target: string,
  opts: { maxPages?: number } = {}
): Promise<{ taskId: string }> {
  const maxPages = Math.min(Math.max(opts.maxPages ?? 100, 1), 1000);
  const json = await dataForSeoPost(
    "/on_page/task_post",
    [
      {
        target: normalizeDomain(target),
        max_crawl_pages: maxPages,
        load_resources: false,
        enable_javascript: false,
        respect_sitemap: true,
      },
    ],
    { okTaskCodes: [20000, 20100] } // 20100 "Task Created" is success for the async crawl
  );
  const taskId: string | undefined = json?.tasks?.[0]?.id;
  if (!taskId) throw new Error("DataForSEO did not return an On-Page task id");
  return { taskId };
}

/** Poll a crawl's progress + site-wide aggregates. */
export async function getSiteAuditSummary(taskId: string): Promise<SiteAuditSummary> {
  const json = await dataForSeoPost("/on_page/summary", [{ id: taskId }]);
  const result = json?.tasks?.[0]?.result?.[0] ?? {};
  const metrics = result?.page_metrics ?? {};
  // The site-wide checks map has the same mixed polarity as per-page checks, so keep only
  // problem checks — a positive signal count (e.g. is_https) must not read as a warning.
  const rawChecks = (metrics?.checks ?? {}) as SiteAuditChecks;
  const checks: SiteAuditChecks = {};
  for (const [name, count] of Object.entries(rawChecks)) {
    if (PROBLEM_CHECKS.has(name)) checks[name] = count;
  }
  return {
    crawlProgress: result?.crawl_progress ?? "in_progress",
    pagesCrawled: result?.crawl_status?.pages_crawled ?? 0,
    pagesInQueue: result?.crawl_status?.pages_in_queue ?? 0,
    onpageScore: typeof metrics?.onpage_score === "number" ? Math.round(metrics.onpage_score) : null,
    checks,
  };
}

/** Number of site-wide checks that fall in the CRITICAL_CHECKS set with a non-zero count. */
export function countCritical(checks: SiteAuditChecks): number {
  let n = 0;
  for (const [name, count] of Object.entries(checks)) {
    if (CRITICAL_CHECKS.has(name) && count > 0) n += count;
  }
  return n;
}

/** Total non-zero checks that are NOT critical (treated as warnings). */
export function countWarnings(checks: SiteAuditChecks): number {
  let n = 0;
  for (const [name, count] of Object.entries(checks)) {
    if (!CRITICAL_CHECKS.has(name) && count > 0) n += count;
  }
  return n;
}

/** Fetch per-page results for a finished (or in-progress) crawl. */
export async function getSiteAuditPages(
  taskId: string,
  limit = 100
): Promise<SiteAuditPageResult[]> {
  const json = await dataForSeoPost("/on_page/pages", [{ id: taskId, limit }]);
  const items: any[] = json?.tasks?.[0]?.result?.[0]?.items ?? [];
  return items.map((item): SiteAuditPageResult => {
    const checks = (item?.checks ?? {}) as Record<string, boolean>;
    // Only `true` flags that are known PROBLEM checks are issues — positive signals
    // (e.g. is_https, canonical) are also `true` but must not be counted.
    const issues = Object.entries(checks)
      .filter(([name, failed]) => failed === true && PROBLEM_CHECKS.has(name))
      .map(([name]) => name);
    return {
      url: item?.url ?? "",
      statusCode: item?.status_code ?? null,
      onpageScore: typeof item?.onpage_score === "number" ? Math.round(item.onpage_score) : null,
      issues,
    };
  });
}
