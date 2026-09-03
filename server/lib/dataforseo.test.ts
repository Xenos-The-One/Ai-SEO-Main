import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// DataForSEO credentials must be set before the module (env.ts) loads.
process.env.DATAFORSEO_LOGIN = "test-login";
process.env.DATAFORSEO_PASSWORD = "test-pass";

// A trimmed but shape-accurate keyword_suggestions response.
const SAMPLE_RESPONSE = {
  status_code: 20000,
  status_message: "Ok.",
  tasks: [
    {
      status_code: 20000,
      result: [
        {
          items: [
            {
              keyword: "seo tools",
              keyword_info: { search_volume: 40500, cpc: 12.3, competition_level: "HIGH" },
              keyword_properties: { keyword_difficulty: 78 },
            },
            {
              keyword: "free seo tools",
              keyword_info: { search_volume: 8100, cpc: 6.1, competition_level: "MEDIUM" },
              keyword_properties: { keyword_difficulty: 54 },
            },
            {
              keyword: "best seo tools for small business",
              keyword_info: { search_volume: 590, cpc: 9.4, competition_level: "LOW" },
              keyword_properties: { keyword_difficulty: 31 },
            },
          ],
        },
      ],
    },
  ],
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => SAMPLE_RESPONSE,
  });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DataForSEO keyword client", () => {
  it("posts a task array with Basic auth and maps items", async () => {
    const { keywordSuggestions } = await import("./dataforseo");
    const results = await keywordSuggestions("seo tools", { limit: 20 });

    // Request shape
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/dataforseo_labs/google/keyword_suggestions/live");
    expect(init.headers.authorization).toBe(
      "Basic " + Buffer.from("test-login:test-pass").toString("base64")
    );
    const body = JSON.parse(init.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body[0]).toMatchObject({ keyword: "seo tools", location_name: "United States", limit: 20 });

    // Mapping
    expect(results).toHaveLength(3);
    expect(results[0]).toEqual({
      keyword: "seo tools",
      searchVolume: 40500,
      difficulty: 78,
      cpc: 12.3,
      competition: "HIGH",
    });
  });

  it("throws on a DataForSEO error status_code", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status_code: 40401, status_message: "Unauthorized." }),
    });
    const { keywordSuggestions } = await import("./dataforseo");
    await expect(keywordSuggestions("x")).rejects.toThrow(/40401/);
  });

  it("getKeywordSuggestions returns rank-based relevance in the KeywordSuggestion shape", async () => {
    const { getKeywordSuggestions } = await import("../keywordResearch");
    const suggestions = await getKeywordSuggestions("seo tools", 3);

    expect(suggestions.map((s) => s.keyword)).toEqual([
      "seo tools",
      "free seo tools",
      "best seo tools for small business",
    ]);
    // Real metrics, not fabricated
    expect(suggestions[0]).toMatchObject({ searchVolume: 40500, difficulty: 78, relevance: 100 });
    // Relevance strictly decreases with rank
    expect(suggestions[0].relevance).toBeGreaterThan(suggestions[1].relevance);
    expect(suggestions[1].relevance).toBeGreaterThan(suggestions[2].relevance);
  });

  it("normalizeDomain strips protocol, path, and www", async () => {
    const { normalizeDomain } = await import("./dataforseo");
    expect(normalizeDomain("https://www.Example.com/blog/post")).toBe("example.com");
    expect(normalizeDomain("competitor.com")).toBe("competitor.com");
  });

  it("competitorDomains maps competitor metrics", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status_code: 20000,
        tasks: [{ status_code: 20000, result: [{ items: [
          { domain: "rival.com", intersections: 1200, metrics: { organic: { count: 8400, etv: 15000.7 } } },
        ] }] }],
      }),
    });
    const { competitorDomains } = await import("./dataforseo");
    const rows = await competitorDomains("mysite.com");
    expect(rows[0]).toEqual({ domain: "rival.com", commonKeywords: 1200, organicKeywords: 8400, organicTraffic: 15001 });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body[0].target).toBe("mysite.com");
  });

  it("checkKeywordRank finds the domain's SERP position, ignoring non-organic items", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status_code: 20000,
        tasks: [{ status_code: 20000, result: [{ items: [
          { type: "paid", domain: "ads.com", rank_absolute: 1 },
          { type: "organic", domain: "other.com", rank_absolute: 2, url: "https://other.com/a" },
          { type: "organic", domain: "www.mysite.com", rank_absolute: 5, url: "https://mysite.com/page" },
        ] }] }],
      }),
    });
    const { checkKeywordRank } = await import("./dataforseo");
    const res = await checkKeywordRank("seo audit", "https://mysite.com/", { device: "mobile" });
    expect(res).toEqual({ position: 5, url: "https://mysite.com/page" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/serp/google/organic/live/advanced");
    const body = JSON.parse(init.body);
    expect(body[0]).toMatchObject({ keyword: "seo audit", device: "mobile", location_name: "United States" });
  });

  it("checkKeywordRank returns null position when the domain isn't in the SERP", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status_code: 20000,
        tasks: [{ status_code: 20000, result: [{ items: [
          { type: "organic", domain: "other.com", rank_absolute: 1, url: "https://other.com" },
        ] }] }],
      }),
    });
    const { checkKeywordRank } = await import("./dataforseo");
    const res = await checkKeywordRank("seo audit", "mysite.com");
    expect(res).toEqual({ position: null, url: null });
  });

  it("backlinkSummary maps the profile summary", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status_code: 20000,
        tasks: [{ status_code: 20000, result: [{
          backlinks: 15234, referring_domains: 842, referring_main_domains: 790,
          rank: 512, broken_backlinks: 31, referring_domains_nofollow: 120, backlinks_spam_score: 18,
        }] }],
      }),
    });
    const { backlinkSummary } = await import("./dataforseo");
    const s = await backlinkSummary("https://www.mysite.com/");
    expect(s).toMatchObject({ target: "mysite.com", backlinks: 15234, referringDomains: 842, rank: 512, brokenBacklinks: 31, backlinksSpamScore: 18 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/backlinks/summary/live");
    expect(JSON.parse(init.body)[0].target).toBe("mysite.com");
  });

  it("referringDomains maps rows and requests backlinks-desc order", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status_code: 20000,
        tasks: [{ status_code: 20000, result: [{ items: [
          { domain: "linker.com", backlinks: 42, rank: 300, broken_backlinks: 1, backlinks_spam_score: 55, first_seen: "2023-01-02 00:00:00 +00:00", lost_date: null },
        ] }] }],
      }),
    });
    const { referringDomains } = await import("./dataforseo");
    const rows = await referringDomains("mysite.com", 50);
    expect(rows[0]).toMatchObject({ domain: "linker.com", backlinks: 42, spamScore: 55 });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body[0]).toMatchObject({ target: "mysite.com", limit: 50, order_by: ["backlinks,desc"] });
  });

  it("backlinkAnchors maps anchor rows", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status_code: 20000,
        tasks: [{ status_code: 20000, result: [{ items: [
          { anchor: "best seo tool", backlinks: 90, referring_domains: 12 },
        ] }] }],
      }),
    });
    const { backlinkAnchors } = await import("./dataforseo");
    const rows = await backlinkAnchors("mysite.com");
    expect(rows[0]).toEqual({ anchor: "best seo tool", backlinks: 90, referringDomains: 12 });
  });

  it("linkGap builds numbered targets + excludes your domain, and aggregates intersections", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status_code: 20000,
        tasks: [{ status_code: 20000, result: [{ items: [
          { domain_intersection: { "1": { target: "linker.com", rank: 410, backlinks: 5 }, "2": { target: "linker.com", rank: 410, backlinks: 0 } } },
          { domain_intersection: { "1": { target: "another.com", rank: 200, backlinks: 3 }, "2": { target: "another.com", rank: 200, backlinks: 8 } } },
        ] }] }],
      }),
    });
    const { linkGap } = await import("./dataforseo");
    const rows = await linkGap("https://mysite.com/", ["rivalA.com", "https://www.rivalB.com/"]);
    expect(rows[0]).toEqual({ referringDomain: "linker.com", rank: 410, competitorsLinked: 1, backlinks: 5 });
    expect(rows[1]).toEqual({ referringDomain: "another.com", rank: 200, competitorsLinked: 2, backlinks: 11 });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body[0].targets).toEqual({ "1": "rivala.com", "2": "rivalb.com" });
    expect(body[0].exclude_targets).toEqual(["mysite.com"]);
  });

  it("toxicBacklinks flags links at/above the threshold and builds a disavow file", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status_code: 20000,
        tasks: [{ status_code: 20000, result: [{ items: [
          { url_from: "http://spam.ru/x", domain_from: "spam.ru", anchor: "cheap", backlink_spam_score: 88, dofollow: true },
          { url_from: "http://ok.com/y", domain_from: "ok.com", anchor: "brand", backlink_spam_score: 10, dofollow: true },
          { url_from: "http://bad.cn/z", domain_from: "bad.cn", anchor: "seo", backlink_spam_score: 60, dofollow: false },
        ] }] }],
      }),
    });
    const { toxicBacklinks } = await import("./dataforseo");
    const res = await toxicBacklinks("mysite.com", 200, 50);
    expect(res.toxicCount).toBe(2); // spam.ru (88) + bad.cn (60); ok.com (10) excluded
    expect(res.avgSpamScore).toBe(53); // (88+10+60)/3 = 52.67 → 53
    expect(res.disavowText).toBe("domain:spam.ru\ndomain:bad.cn");
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body[0]).toMatchObject({ target: "mysite.com", mode: "one_per_domain" });
  });

  it("domainIntersection maps shared keywords with both ranks", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status_code: 20000,
        tasks: [{ status_code: 20000, result: [{ items: [
          {
            keyword_data: { keyword: "seo audit", keyword_info: { search_volume: 2900 }, keyword_properties: { keyword_difficulty: 62 } },
            first_domain_serp_element: { rank_absolute: 8 },
            second_domain_serp_element: { rank_absolute: 3 },
          },
        ] }] }],
      }),
    });
    const { domainIntersection } = await import("./dataforseo");
    const rows = await domainIntersection("mysite.com", "rival.com");
    expect(rows[0]).toEqual({ keyword: "seo audit", searchVolume: 2900, difficulty: 62, yourRank: 8, competitorRank: 3 });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body[0]).toMatchObject({ target1: "mysite.com", target2: "rival.com", intersections: true });
  });
});
