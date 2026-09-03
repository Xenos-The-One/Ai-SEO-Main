import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// DataForSEO credentials must be set before the module (env.ts) loads.
process.env.DATAFORSEO_LOGIN = "test-login";
process.env.DATAFORSEO_PASSWORD = "test-pass";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("siteAudit lib", () => {
  it("startSiteAudit posts an On-Page task and returns the task id", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status_code: 20000, tasks: [{ status_code: 20000, id: "task-123" }] }),
    });
    const { startSiteAudit } = await import("./siteAudit");
    const { taskId } = await startSiteAudit("https://www.example.com/", { maxPages: 50 });
    expect(taskId).toBe("task-123");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/on_page/task_post");
    const body = JSON.parse(init.body);
    expect(body[0]).toMatchObject({ target: "example.com", max_crawl_pages: 50, respect_sitemap: true });
  });

  it("startSiteAudit clamps maxPages to [1, 1000]", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ status_code: 20000, tasks: [{ status_code: 20000, id: "t" }] }),
    });
    const { startSiteAudit } = await import("./siteAudit");
    await startSiteAudit("example.com", { maxPages: 99999 });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)[0].max_crawl_pages).toBe(1000);
  });

  it("getSiteAuditSummary parses crawl progress + checks", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status_code: 20000,
        tasks: [{ status_code: 20000, result: [{
          crawl_progress: "finished",
          crawl_status: { pages_crawled: 42, pages_in_queue: 0 },
          page_metrics: { onpage_score: 87.4, checks: { broken_links: 3, no_h1_tag: 1, no_image_alt: 12 } },
        }] }],
      }),
    });
    const { getSiteAuditSummary, countCritical, countWarnings } = await import("./siteAudit");
    const summary = await getSiteAuditSummary("task-123");
    expect(summary.crawlProgress).toBe("finished");
    expect(summary.pagesCrawled).toBe(42);
    expect(summary.onpageScore).toBe(87);
    // broken_links + no_h1_tag are critical; no_image_alt is a warning.
    expect(countCritical(summary.checks)).toBe(4);
    expect(countWarnings(summary.checks)).toBe(12);
  });

  it("getSiteAuditPages maps failing checks into an issue list", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status_code: 20000,
        tasks: [{ status_code: 20000, result: [{ items: [
          { url: "https://example.com/a", status_code: 200, onpage_score: 91.2, checks: { no_title: true, no_image_alt: true, no_h1_tag: false, is_https: true } },
        ] }] }],
      }),
    });
    const { getSiteAuditPages } = await import("./siteAudit");
    const pages = await getSiteAuditPages("task-123", 100);
    expect(pages[0].url).toBe("https://example.com/a");
    expect(pages[0].onpageScore).toBe(91);
    // Only `true` PROBLEM checks count; `is_https` (true = good) and false flags are ignored.
    expect(pages[0].issues).toEqual(["no_title", "no_image_alt"]);
  });
});
