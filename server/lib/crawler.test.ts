import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>This is a deliberately very long page title that exceeds sixty characters for testing</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <h1>Welcome</h1>
  <img src="a.png" alt="described image">
  <img src="b.png">
  <p>Short body content for the audit.</p>
  <a href="/good">Good internal link</a>
  <a href="/broken">Broken internal link</a>
  <a href="https://external.com/x">External link</a>
</body>
</html>`;

const pageResponse = {
  url: "https://example.com/",
  status: 200,
  text: async () => HTML,
  headers: { get: () => "text/html" },
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn().mockImplementation((url: string, init?: { method?: string }) => {
    const u = String(url);
    const method = init?.method ?? "GET";
    if (method === "GET" && u === "https://example.com") return Promise.resolve(pageResponse);
    if (u === "https://example.com/broken") return Promise.resolve({ status: 404 });
    return Promise.resolve({ status: 200 }); // /good and anything else
  });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("technical audit crawler", () => {
  it("extracts real on-page metrics and flags issues", async () => {
    const { auditUrl } = await import("./crawler");
    const result = await auditUrl("https://example.com");

    const m = result.metrics;
    expect(m.statusCode).toBe(200);
    expect(m.title).toContain("very long page title");
    expect(m.titleLength).toBeGreaterThan(60);
    expect(m.metaDescription).toBeNull();
    expect(m.h1Count).toBe(1);
    expect(m.imageCount).toBe(2);
    expect(m.imagesMissingAlt).toBe(1);
    expect(m.internalLinks).toBe(2);
    expect(m.externalLinks).toBe(1);
    expect(m.hasViewport).toBe(true);
    expect(m.hasLang).toBe(true);
    expect(m.hasStructuredData).toBe(false);
    expect(m.indexable).toBe(true);

    const messages = result.issues.map((i) => i.message);
    expect(messages.some((x) => /Title is long/.test(x))).toBe(true);
    expect(messages.some((x) => /Missing meta description/.test(x))).toBe(true);
    expect(messages.some((x) => /images missing alt/.test(x))).toBe(true);
    expect(messages.some((x) => /Thin content/.test(x))).toBe(true);

    // score is penalized and bounded
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThan(100);
    expect(result.pageSpeed).toBeNull(); // no PAGESPEED_API_KEY in test
  });

  it("detects broken internal links", async () => {
    const { auditUrl } = await import("./crawler");
    const result = await auditUrl("https://example.com");

    expect(result.brokenLinks).toHaveLength(1);
    expect(result.brokenLinks[0]).toMatchObject({ status: 404 });
    expect(result.brokenLinks[0].url).toContain("/broken");
    expect(result.issues.some((i) => /broken internal link/i.test(i.message))).toBe(true);
  });

  it("flags a noindex page as not indexable and critical", async () => {
    fetchMock.mockImplementation((url: string, init?: { method?: string }) => {
      const method = init?.method ?? "GET";
      if (method === "GET") {
        return Promise.resolve({
          url: "https://noindex.test/",
          status: 200,
          text: async () => `<html><head><title>x</title><meta name="robots" content="noindex"></head><body><h1>x</h1></body></html>`,
          headers: { get: () => "text/html" },
        });
      }
      return Promise.resolve({ status: 200 });
    });
    const { auditUrl } = await import("./crawler");
    const result = await auditUrl("https://noindex.test");
    expect(result.metrics.indexable).toBe(false);
    expect(result.issues.some((i) => i.severity === "critical" && /noindex/i.test(i.message))).toBe(true);
  });
});
