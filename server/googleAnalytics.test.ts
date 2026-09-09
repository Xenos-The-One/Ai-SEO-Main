import { describe, it, expect } from "vitest";
import { slugify, matchPage } from "./googleAnalytics";

const pages = [
  { pagePath: "/blog/5-things-to-know-before-your-first-home-purchase", pageviews: 3915, users: 3000, avgTimeOnPage: 120, engagementRate: 0.71 },
  { pagePath: "/newsletter/monthly-market-pulse", pageviews: 3776, users: 2800, avgTimeOnPage: 90, engagementRate: 0.84 },
  { pagePath: "/about", pageviews: 50, users: 40, avgTimeOnPage: 20, engagementRate: 0.3 },
];

describe("googleAnalytics matching", () => {
  it("slugifies titles", () => {
    expect(slugify("5 Things to Know Before Your First Home Purchase!")).toBe(
      "5-things-to-know-before-your-first-home-purchase"
    );
  });

  it("matches by exact publishedUrl path", () => {
    const m = matchPage(
      { title: "Anything", publishedUrl: "https://client.com/newsletter/monthly-market-pulse/" },
      pages
    );
    expect(m?.pagePath).toBe("/newsletter/monthly-market-pulse");
  });

  it("falls back to slugified-title match when no publishedUrl", () => {
    const m = matchPage(
      { title: "5 Things to Know Before Your First Home Purchase", publishedUrl: null },
      pages
    );
    expect(m?.pageviews).toBe(3915);
  });

  it("returns null when nothing matches", () => {
    const m = matchPage({ title: "Totally Unrelated Topic XYZ", publishedUrl: null }, pages);
    expect(m).toBeNull();
  });
});
