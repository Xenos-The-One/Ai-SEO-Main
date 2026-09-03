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

export async function dataForSeoPost<T = any>(path: string, tasks: unknown[]): Promise<T> {
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
  if (taskStatus && taskStatus !== DFS_SUCCESS) {
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
