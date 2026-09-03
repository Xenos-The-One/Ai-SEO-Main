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
