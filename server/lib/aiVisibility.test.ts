import { describe, it, expect, beforeEach, vi } from "vitest";

const queryMock = vi.hoisted(() => vi.fn());
const invokeMock = vi.hoisted(() => vi.fn());

vi.mock("./aiProviders", () => ({
  queryProvider: queryMock,
  ALL_PROVIDERS: ["claude", "gemini", "openai", "perplexity"],
  configuredProviders: () => ["claude", "gemini"],
}));
vi.mock("../_core/llm", () => ({ invokeLLM: invokeMock }));

function analysisJson(obj: unknown) {
  return { choices: [{ message: { content: JSON.stringify(obj) } }] };
}

beforeEach(() => {
  queryMock.mockReset();
  invokeMock.mockReset();
  queryMock.mockResolvedValue("Top tools: 1) OtherCo 2) BrandX is great. CompA also.");
  invokeMock.mockResolvedValue(
    analysisJson({ mentioned: true, position: 2, sentiment: "positive", competitorsMentioned: ["CompA"], summary: "BrandX ranked #2" })
  );
});

describe("AI visibility scanning", () => {
  it("scans a prompt across providers and maps the analysis", async () => {
    const { scanPrompt } = await import("./aiVisibility");
    const res = await scanPrompt("BrandX", ["CompA"], "best tools", ["claude", "gemini"] as any);

    expect(res).toHaveLength(2);
    expect(res.map((r) => r.provider).sort()).toEqual(["claude", "gemini"]);
    expect(res[0]).toMatchObject({ mentioned: true, position: 2, sentiment: "positive", competitorsMentioned: ["CompA"] });
    expect(res[0].answerExcerpt.length).toBeGreaterThan(0);
    // one query + one analysis per provider
    expect(queryMock).toHaveBeenCalledTimes(2);
    expect(invokeMock).toHaveBeenCalledTimes(2);
  });

  it("skips a provider that errors", async () => {
    queryMock.mockImplementation((provider: string) =>
      provider === "gemini" ? Promise.reject(new Error("rate limited")) : Promise.resolve("BrandX is listed")
    );
    const { scanPrompt } = await import("./aiVisibility");
    const res = await scanPrompt("BrandX", [], "best tools", ["claude", "gemini"] as any);
    expect(res).toHaveLength(1);
    expect(res[0].provider).toBe("claude");
  });

  it("coerces a malformed analysis into safe defaults", async () => {
    invokeMock.mockResolvedValue(analysisJson({ mentioned: "yes", position: "second", sentiment: "meh", competitorsMentioned: "CompA" }));
    const { analyzeMention } = await import("./aiVisibility");
    const a = await analyzeMention("BrandX", ["CompA"], "some answer");
    expect(a.mentioned).toBe(true); // Boolean("yes")
    expect(a.position).toBeNull(); // non-number -> null
    expect(a.sentiment).toBeNull(); // invalid enum -> null
    expect(a.competitorsMentioned).toEqual([]); // non-array -> []
  });
});
