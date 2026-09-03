/**
 * AI answer-engine providers for GEO / AI-visibility scans.
 *
 * Each provider is only active when its key is configured. Claude and Gemini work with the
 * keys already in the app; OpenAI and Perplexity activate when their keys are added.
 */
import { ENV } from "../_core/env";

export const ALL_PROVIDERS = ["claude", "gemini", "openai", "perplexity"] as const;
export type AiProvider = (typeof ALL_PROVIDERS)[number];

/** Which providers have a key configured. */
export function configuredProviders(): AiProvider[] {
  const list: AiProvider[] = [];
  if (ENV.anthropicApiKey) list.push("claude");
  if (ENV.geminiApiKey) list.push("gemini");
  if (ENV.openaiApiKey) list.push("openai");
  if (ENV.perplexityApiKey) list.push("perplexity");
  return list;
}

async function queryClaude(prompt: string): Promise<string> {
  const { invokeLLM } = await import("../_core/llm");
  const res = await invokeLLM({ messages: [{ role: "user", content: prompt }], maxTokens: 1024 });
  const content = res.choices[0]?.message?.content;
  return typeof content === "string" ? content : "";
}

async function queryGemini(prompt: string): Promise<string> {
  const model = process.env.GEMINI_TEXT_MODEL || "gemini-3.6-flash";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": ENV.geminiApiKey },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) throw new Error(`Gemini query failed (${res.status})`);
  const json: any = await res.json();
  const parts: any[] = json?.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p) => p?.text ?? "").join("").trim();
}

/** OpenAI + Perplexity share the OpenAI chat-completions shape. */
async function queryOpenAiCompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], max_tokens: 1024 }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`${baseUrl} query failed (${res.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`);
  }
  const json: any = await res.json();
  return json?.choices?.[0]?.message?.content ?? "";
}

/** Ask a provider the prompt and return its answer text. */
export async function queryProvider(provider: AiProvider, prompt: string): Promise<string> {
  switch (provider) {
    case "claude":
      return queryClaude(prompt);
    case "gemini":
      return queryGemini(prompt);
    case "openai":
      return queryOpenAiCompatible(
        "https://api.openai.com/v1",
        ENV.openaiApiKey,
        process.env.OPENAI_MODEL || "gpt-4o-mini",
        prompt
      );
    case "perplexity":
      return queryOpenAiCompatible(
        "https://api.perplexity.ai",
        ENV.perplexityApiKey,
        process.env.PERPLEXITY_MODEL || "sonar",
        prompt
      );
  }
}
