/**
 * DataForSEO client — real keyword/SERP/backlink data.
 *
 * Replaces the Manus Forge data proxy. Auth is HTTP Basic (login:password from the
 * DataForSEO dashboard). Every DataForSEO endpoint takes an ARRAY of task objects and
 * returns { status_code, tasks: [{ status_code, result: [...] }] }.
 */
import { ENV } from "../_core/env";

const BASE_URL = "https://api.dataforseo.com/v3";
const DFS_SUCCESS = 20000;

function authHeader(): string {
  const { dataForSeoLogin: login, dataForSeoPassword: password } = ENV;
  if (!login || !password) {
    throw new Error(
      "DataForSEO is not configured. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in your environment."
    );
  }
  return "Basic " + Buffer.from(`${login}:${password}`).toString("base64");
}

const DFS_TASK_CREATED = 20100; // async task_post returns this on success, not 20000

export async function dataForSeoPost<T = any>(
  path: string,
  tasks: unknown[],
  opts: { okTaskCodes?: number[] } = {}
): Promise<T> {
  const okTaskCodes = opts.okTaskCodes ?? [DFS_SUCCESS];
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: authHeader(),
    },
    body: JSON.stringify(tasks),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `DataForSEO request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }

  const json = await response.json();
  if (json?.status_code && json.status_code !== DFS_SUCCESS) {
    throw new Error(`DataForSEO error ${json.status_code}: ${json.status_message ?? "unknown"}`);
  }
  const taskStatus = json?.tasks?.[0]?.status_code;
  if (taskStatus && !okTaskCodes.includes(taskStatus)) {
    throw new Error(`DataForSEO task error ${taskStatus}: ${json?.tasks?.[0]?.status_message ?? "unknown"}`);
  }
  return json as T;
}

export type DfsKeyword = {
  keyword: string;
  searchVolume: number;
  difficulty: number; // 0-100
  cpc: number | null;
  competition: string | null; // LOW | MEDIUM | HIGH
};

export type KeywordDataOptions = {
  limit?: number;
  locationName?: string;
  languageName?: string;
};

/** Real keyword suggestions for a seed term, with search volume + difficulty. */
export async function keywordSuggestions(
  seed: string,
  opts: KeywordDataOptions = {}
): Promise<DfsKeyword[]> {
  const json = await dataForSeoPost("/dataforseo_labs/google/keyword_suggestions/live", [
    {
      keyword: seed,
      location_name: opts.locationName ?? "United States",
      language_name: opts.languageName ?? "English",
      limit: opts.limit ?? 20,
      include_seed_keyword: true,
    },
  ]);

  const items: any[] = json?.tasks?.[0]?.result?.[0]?.items ?? [];
  return items
    .map((item): DfsKeyword => ({
      keyword: item?.keyword ?? "",
      searchVolume: item?.keyword_info?.search_volume ?? 0,
      difficulty: item?.keyword_properties?.keyword_difficulty ?? 0,
      cpc: item?.keyword_info?.cpc ?? null,
      competition: item?.keyword_info?.competition_level ?? null,
    }))
    .filter((k) => k.keyword);
}

/** Reduce a URL or host to the bare registrable domain DataForSEO expects (e.g. "example.com"). */
export function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "");
}

export type CompetitorDomain = {
  domain: string;
  commonKeywords: number; // keywords this domain shares with the target
  organicKeywords: number; // total organic keywords the domain ranks for
  organicTraffic: number; // estimated organic traffic value (ETV)
};

/** Find organic search competitors for a domain, ranked by keyword overlap. */
export async function competitorDomains(
  target: string,
  opts: KeywordDataOptions = {}
): Promise<CompetitorDomain[]> {
  const json = await dataForSeoPost("/dataforseo_labs/google/competitors_domain/live", [
    {
      target: normalizeDomain(target),
      location_name: opts.locationName ?? "United States",
      language_name: opts.languageName ?? "English",
      limit: opts.limit ?? 20,
      exclude_top_domains: true,
    },
  ]);

  const items: any[] = json?.tasks?.[0]?.result?.[0]?.items ?? [];
  return items
    .map((item): CompetitorDomain => {
      const metrics = item?.metrics?.organic ?? item?.full_domain_metrics?.organic ?? {};
      return {
        domain: item?.domain ?? "",
        commonKeywords: item?.intersections ?? 0,
        organicKeywords: metrics?.count ?? 0,
        organicTraffic: Math.round(metrics?.etv ?? 0),
      };
    })
    .filter((c) => c.domain);
}

export type SharedKeyword = {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  yourRank: number | null; // SERP position for your domain (null if not ranking in the pulled set)
  competitorRank: number | null; // SERP position for the competitor
};

/** Keywords both domains rank for, with each domain's SERP position (reveals where a competitor outranks you). */
export async function domainIntersection(
  yourDomain: string,
  competitorDomain: string,
  opts: KeywordDataOptions = {}
): Promise<SharedKeyword[]> {
  const json = await dataForSeoPost("/dataforseo_labs/google/domain_intersection/live", [
    {
      target1: normalizeDomain(yourDomain),
      target2: normalizeDomain(competitorDomain),
      location_name: opts.locationName ?? "United States",
      language_name: opts.languageName ?? "English",
      limit: opts.limit ?? 50,
      intersections: true,
    },
  ]);

  const items: any[] = json?.tasks?.[0]?.result?.[0]?.items ?? [];
  return items
    .map((item): SharedKeyword => ({
      keyword: item?.keyword_data?.keyword ?? "",
      searchVolume: item?.keyword_data?.keyword_info?.search_volume ?? 0,
      difficulty: item?.keyword_data?.keyword_properties?.keyword_difficulty ?? 0,
      yourRank: item?.first_domain_serp_element?.rank_absolute ?? null,
      competitorRank: item?.second_domain_serp_element?.rank_absolute ?? null,
    }))
    .filter((k) => k.keyword);
}

export type RankResult = {
  position: number | null; // rank_absolute in the live SERP, null if the domain isn't found
  url: string | null; // the ranking URL, if found
};

export type RankOptions = {
  locationName?: string;
  languageName?: string;
  device?: "desktop" | "mobile";
};

/**
 * Check where `domain` ranks for `keyword` in a live Google SERP. Pulls one real-time
 * SERP and returns the first organic result belonging to the domain (by `rank_absolute`),
 * or { position: null } when the domain isn't present in the returned results.
 */
export async function checkKeywordRank(
  keyword: string,
  domain: string,
  opts: RankOptions = {}
): Promise<RankResult> {
  const target = normalizeDomain(domain);
  const json = await dataForSeoPost("/serp/google/organic/live/advanced", [
    {
      keyword,
      location_name: opts.locationName ?? "United States",
      language_name: opts.languageName ?? "English",
      device: opts.device ?? "desktop",
    },
  ]);

  const items: any[] = json?.tasks?.[0]?.result?.[0]?.items ?? [];
  for (const item of items) {
    if (item?.type !== "organic") continue;
    const itemDomain = normalizeDomain(item?.domain ?? item?.url ?? "");
    if (itemDomain === target) {
      return {
        position: item?.rank_absolute ?? null,
        url: item?.url ?? null,
      };
    }
  }
  return { position: null, url: null };
}

// ---- Backlinks API ----

export type BacklinkSummary = {
  target: string;
  backlinks: number;
  referringDomains: number;
  referringMainDomains: number;
  rank: number; // 0-1000 domain rank
  brokenBacklinks: number;
  referringDomainsNofollow: number;
  backlinksSpamScore: number; // 0-100 average spam score of the profile
  raw: any;
};

/** Overall backlink profile for a domain. `/backlinks/summary/live`. */
export async function backlinkSummary(target: string): Promise<BacklinkSummary> {
  const domain = normalizeDomain(target);
  const json = await dataForSeoPost("/backlinks/summary/live", [
    { target: domain, internal_list_limit: 10, backlinks_status_type: "live" },
  ]);
  const r = json?.tasks?.[0]?.result?.[0] ?? {};
  return {
    target: domain,
    backlinks: r?.backlinks ?? 0,
    referringDomains: r?.referring_domains ?? 0,
    referringMainDomains: r?.referring_main_domains ?? 0,
    rank: r?.rank ?? 0,
    brokenBacklinks: r?.broken_backlinks ?? 0,
    referringDomainsNofollow: r?.referring_domains_nofollow ?? 0,
    backlinksSpamScore: r?.backlinks_spam_score ?? 0,
    raw: r,
  };
}

export type ReferringDomain = {
  domain: string;
  backlinks: number;
  rank: number;
  brokenBacklinks: number;
  spamScore: number;
  firstSeen: string | null;
  lostDate: string | null;
};

/** Referring domains for a target, richest first. `/backlinks/referring_domains/live`. */
export async function referringDomains(target: string, limit = 100): Promise<ReferringDomain[]> {
  const json = await dataForSeoPost("/backlinks/referring_domains/live", [
    { target: normalizeDomain(target), limit, order_by: ["backlinks,desc"], backlinks_status_type: "live" },
  ]);
  const items: any[] = json?.tasks?.[0]?.result?.[0]?.items ?? [];
  return items
    .map((i): ReferringDomain => ({
      domain: i?.domain ?? "",
      backlinks: i?.backlinks ?? 0,
      rank: i?.rank ?? 0,
      brokenBacklinks: i?.broken_backlinks ?? 0,
      spamScore: i?.backlinks_spam_score ?? 0,
      firstSeen: i?.first_seen ?? null,
      lostDate: i?.lost_date ?? null,
    }))
    .filter((d) => d.domain);
}

export type BacklinkAnchor = {
  anchor: string;
  backlinks: number;
  referringDomains: number;
};

/** Anchor-text distribution for a target. `/backlinks/anchors/live`. */
export async function backlinkAnchors(target: string, limit = 100): Promise<BacklinkAnchor[]> {
  const json = await dataForSeoPost("/backlinks/anchors/live", [
    { target: normalizeDomain(target), limit, order_by: ["backlinks,desc"], backlinks_status_type: "live" },
  ]);
  const items: any[] = json?.tasks?.[0]?.result?.[0]?.items ?? [];
  return items
    .map((i): BacklinkAnchor => ({
      anchor: i?.anchor ?? "",
      backlinks: i?.backlinks ?? 0,
      referringDomains: i?.referring_domains ?? 0,
    }))
    .filter((a) => a.anchor);
}

export type LinkGapRow = {
  referringDomain: string; // links to ≥1 competitor but not you — an outreach target
  rank: number;
  competitorsLinked: number; // how many of the competitors it links to
  backlinks: number; // total backlinks it sends to the competitors
};

/**
 * Competitor link gap: referring domains that link to `competitors` but NOT to `yourDomain`.
 * `/backlinks/domain_intersection/live` with `exclude_targets = [yourDomain]`.
 */
export async function linkGap(
  yourDomain: string,
  competitors: string[],
  limit = 100
): Promise<LinkGapRow[]> {
  const you = normalizeDomain(yourDomain);
  const targets: Record<string, string> = {};
  competitors
    .map((c) => normalizeDomain(c))
    .filter(Boolean)
    .slice(0, 20)
    .forEach((c, idx) => {
      targets[String(idx + 1)] = c;
    });

  const json = await dataForSeoPost("/backlinks/domain_intersection/live", [
    {
      targets,
      exclude_targets: [you],
      limit,
      order_by: ["1.rank,desc"],
      backlinks_status_type: "live",
    },
  ]);

  const items: any[] = json?.tasks?.[0]?.result?.[0]?.items ?? [];
  return items
    .map((i): LinkGapRow => {
      // Each item's `domain_intersection` is keyed by the target numbers ("1","2",…); every
      // entry describes the SAME referring (linking) domain's links to that one competitor.
      const perTarget = Object.values(i?.domain_intersection ?? {}) as any[];
      const referringDomain = perTarget.find((t) => t?.target)?.target ?? "";
      const rank = perTarget.find((t) => typeof t?.rank === "number")?.rank ?? 0;
      const competitorsLinked = perTarget.filter((t) => (t?.backlinks ?? 0) > 0).length;
      const backlinks = perTarget.reduce((sum, t) => sum + (t?.backlinks ?? 0), 0);
      return { referringDomain, rank, competitorsLinked, backlinks };
    })
    .filter((r) => r.referringDomain);
}

export type ToxicLink = {
  urlFrom: string;
  sourceDomain: string;
  anchor: string;
  spamScore: number;
  dofollow: boolean;
};

export type ToxicResult = {
  links: ToxicLink[]; // only links at/above the threshold, worst first
  toxicCount: number;
  avgSpamScore: number;
  disavowText: string; // Google disavow file: one `domain:<host>` per toxic source domain
};

/**
 * Toxic backlink analysis: pulls backlinks (one per referring domain) and flags those whose
 * `backlink_spam_score` meets `threshold`. `/backlinks/backlinks/live`.
 */
export async function toxicBacklinks(
  target: string,
  limit = 200,
  threshold = 50
): Promise<ToxicResult> {
  const json = await dataForSeoPost("/backlinks/backlinks/live", [
    {
      target: normalizeDomain(target),
      mode: "one_per_domain",
      limit,
      order_by: ["backlink_spam_score,desc"],
      backlinks_status_type: "live",
    },
  ]);

  const items: any[] = json?.tasks?.[0]?.result?.[0]?.items ?? [];
  const all: ToxicLink[] = items
    .map((i): ToxicLink => ({
      urlFrom: i?.url_from ?? "",
      sourceDomain: i?.domain_from ?? "",
      anchor: i?.anchor ?? "",
      spamScore: i?.backlink_spam_score ?? 0,
      dofollow: i?.dofollow ?? false,
    }))
    .filter((l) => l.sourceDomain);

  const links = all.filter((l) => l.spamScore >= threshold);
  const avgSpamScore = all.length
    ? Math.round(all.reduce((s, l) => s + l.spamScore, 0) / all.length)
    : 0;
  const domains = Array.from(new Set(links.map((l) => l.sourceDomain)));
  const disavowText = domains.map((d) => `domain:${d}`).join("\n");

  return { links, toxicCount: links.length, avgSpamScore, disavowText };
}
