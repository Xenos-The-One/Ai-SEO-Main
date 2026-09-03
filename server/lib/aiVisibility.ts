/**
 * GEO / AI-visibility analysis.
 *
 * For each prompt we ask every configured AI engine, then use Claude (structured JSON) to parse
 * whether/how the brand appears in each answer.
 */
import { AiProvider, queryProvider } from "./aiProviders";
import { invokeLLM } from "../_core/llm";

export type MentionAnalysis = {
  mentioned: boolean;
  position: number | null; // rank in a listed answer, if any
  sentiment: "positive" | "neutral" | "negative" | null;
  competitorsMentioned: string[];
  summary: string;
};

const VALID_SENTIMENT = ["positive", "neutral", "negative"];

/** Use Claude to analyze one AI answer for how the brand appears. */
export async function analyzeMention(
  brand: string,
  competitors: string[],
  answer: string
): Promise<MentionAnalysis> {
  const res = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You analyze an AI assistant's answer to determine how a specific brand appears in it. Be precise and return only JSON.",
      },
      {
        role: "user",
        content:
          `Brand: ${brand}\n` +
          `Known competitors: ${competitors.length ? competitors.join(", ") : "(none provided)"}\n\n` +
          `AI answer:\n"""${answer.slice(0, 6000)}"""\n\n` +
          `Determine: is the brand mentioned? If the answer is a ranked/numbered list, the brand's 1-based position (else null). ` +
          `Overall sentiment toward the brand (positive/neutral/negative, or null if not mentioned). ` +
          `Which competitors or other notable brands are mentioned. A one-sentence summary.`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "mention_analysis",
        schema: {
          type: "object",
          properties: {
            mentioned: { type: "boolean" },
            position: { type: ["number", "null"] },
            sentiment: { type: ["string", "null"], enum: ["positive", "neutral", "negative", null] },
            competitorsMentioned: { type: "array", items: { type: "string" } },
            summary: { type: "string" },
          },
          required: ["mentioned", "position", "sentiment", "competitorsMentioned", "summary"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = res.choices[0]?.message?.content;
  let parsed: any = {};
  try {
    parsed = JSON.parse(typeof content === "string" ? content : "{}");
  } catch {
    parsed = {};
  }

  return {
    mentioned: Boolean(parsed.mentioned),
    position: typeof parsed.position === "number" ? parsed.position : null,
    sentiment: VALID_SENTIMENT.includes(parsed.sentiment) ? parsed.sentiment : null,
    competitorsMentioned: Array.isArray(parsed.competitorsMentioned)
      ? parsed.competitorsMentioned.filter((c: unknown) => typeof c === "string")
      : [],
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
  };
}

export type ProviderResult = MentionAnalysis & { provider: AiProvider; answerExcerpt: string };

/** Run one prompt across the given providers; skips providers that error. */
export async function scanPrompt(
  brand: string,
  competitors: string[],
  prompt: string,
  providers: AiProvider[]
): Promise<ProviderResult[]> {
  const settled = await Promise.all(
    providers.map(async (provider): Promise<ProviderResult | null> => {
      try {
        const answer = await queryProvider(provider, prompt);
        if (!answer.trim()) return null;
        const analysis = await analyzeMention(brand, competitors, answer);
        return { provider, answerExcerpt: answer.slice(0, 500), ...analysis };
      } catch (error) {
        console.error(`[ai-visibility] ${provider} failed:`, error);
        return null;
      }
    })
  );
  return settled.filter((r): r is ProviderResult => r !== null);
}
