import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "./env";

/**
 * Claude-backed LLM gateway.
 *
 * This module keeps the OpenAI-style `invokeLLM(params) -> InvokeResult` contract that the
 * rest of the app was written against (Manus Forge), but routes every call to the Anthropic
 * Messages API. Callers keep reading `result.choices[0].message.content` and
 * `result.usage.{prompt_tokens,completion_tokens}` unchanged.
 */

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4";
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  model?: string;
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

// ---------------------------------------------------------------------------
// Model mapping
// ---------------------------------------------------------------------------

/**
 * The app was seeded with Gemini/OpenAI-style model names. Map those legacy names onto Claude
 * models, pass real `claude-*` ids straight through, and default to Opus 5.
 */
function mapModel(model?: string): string {
  if (!model) return "claude-opus-5";
  const m = model.toLowerCase();
  if (m.startsWith("claude-")) return model;
  if (m.includes("haiku")) return "claude-haiku-4-5";
  if (m.includes("flash") || m.includes("mini") || m.includes("lite") || m.includes("nano") || m.includes("small")) {
    return "claude-sonnet-5";
  }
  return "claude-opus-5";
}

// ---------------------------------------------------------------------------
// Message conversion (OpenAI-style -> Anthropic)
// ---------------------------------------------------------------------------

const asArray = (value: MessageContent | MessageContent[]): MessageContent[] =>
  Array.isArray(value) ? value : [value];

function collectText(content: MessageContent | MessageContent[]): string {
  return asArray(content)
    .map(part => {
      if (typeof part === "string") return part;
      if (part.type === "text") return part.text;
      if (part.type === "image_url") return `[image: ${part.image_url.url}]`;
      if (part.type === "file_url") return `[file: ${part.file_url.url}]`;
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

function toContentBlocks(
  content: MessageContent | MessageContent[]
): Anthropic.ContentBlockParam[] {
  const blocks: Anthropic.ContentBlockParam[] = [];
  for (const part of asArray(content)) {
    if (typeof part === "string") {
      if (part) blocks.push({ type: "text", text: part });
    } else if (part.type === "text") {
      if (part.text) blocks.push({ type: "text", text: part.text });
    } else if (part.type === "image_url") {
      blocks.push({ type: "image", source: { type: "url", url: part.image_url.url } });
    } else if (part.type === "file_url") {
      // Documents/audio aren't used by the text-generation routers; degrade to a reference.
      blocks.push({ type: "text", text: `[file: ${part.file_url.url}]` });
    }
  }
  if (blocks.length === 0) blocks.push({ type: "text", text: "" });
  return blocks;
}

function toAnthropicMessages(messages: Message[]): {
  system?: string;
  messages: Anthropic.MessageParam[];
} {
  const systemParts: string[] = [];
  const converted: Anthropic.MessageParam[] = [];

  for (const message of messages) {
    if (message.role === "system") {
      const text = collectText(message.content);
      if (text) systemParts.push(text);
      continue;
    }
    // Anthropic has no tool/function role in the input; fold any such content into a user turn.
    if (message.role === "tool" || message.role === "function") {
      converted.push({ role: "user", content: collectText(message.content) });
      continue;
    }
    const role: "user" | "assistant" = message.role === "assistant" ? "assistant" : "user";
    converted.push({ role, content: toContentBlocks(message.content) });
  }

  return {
    system: systemParts.length ? systemParts.join("\n\n") : undefined,
    messages: converted,
  };
}

function toAnthropicTools(tools?: Tool[]): Anthropic.Tool[] | undefined {
  if (!tools || tools.length === 0) return undefined;
  return tools.map(tool => ({
    name: tool.function.name,
    description: tool.function.description,
    input_schema: (tool.function.parameters ?? { type: "object", properties: {} }) as Anthropic.Tool.InputSchema,
  }));
}

type AnthropicToolChoice =
  | { type: "auto" }
  | { type: "any" }
  | { type: "none" }
  | { type: "tool"; name: string };

function toAnthropicToolChoice(
  toolChoice: ToolChoice | undefined
): AnthropicToolChoice | undefined {
  if (!toolChoice) return undefined;
  if (toolChoice === "none") return { type: "none" };
  if (toolChoice === "auto") return { type: "auto" };
  if (toolChoice === "required") return { type: "any" };
  if ("name" in toolChoice) return { type: "tool", name: toolChoice.name };
  if ("function" in toolChoice) return { type: "tool", name: toolChoice.function.name };
  return undefined;
}

// ---------------------------------------------------------------------------
// Structured-output helpers
// ---------------------------------------------------------------------------

function resolveSchema(params: InvokeParams): JsonSchema | undefined {
  const explicit =
    params.responseFormat?.type === "json_schema"
      ? params.responseFormat.json_schema
      : params.response_format?.type === "json_schema"
        ? params.response_format.json_schema
        : undefined;
  return params.outputSchema || params.output_schema || explicit;
}

function wantsJson(params: InvokeParams): boolean {
  const fmt = params.responseFormat || params.response_format;
  return Boolean(fmt || params.outputSchema || params.output_schema);
}

/** Pull the JSON value out of a model reply that may include prose or code fences. */
function extractJson(text: string): string {
  let t = text.trim();
  const fenced = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) t = fenced[1].trim();

  const firstObj = t.indexOf("{");
  const firstArr = t.indexOf("[");
  let start = -1;
  if (firstObj === -1) start = firstArr;
  else if (firstArr === -1) start = firstObj;
  else start = Math.min(firstObj, firstArr);
  if (start === -1) return t;

  const end = Math.max(t.lastIndexOf("}"), t.lastIndexOf("]"));
  if (end === -1 || end < start) return t;
  return t.slice(start, end + 1);
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!ENV.anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  if (!_client) {
    _client = new Anthropic({ apiKey: ENV.anthropicApiKey });
  }
  return _client;
}

const DEFAULT_MAX_TOKENS = 16000;

async function invokeClaude(params: InvokeParams): Promise<InvokeResult> {
  const client = getClient();

  const { system, messages } = toAnthropicMessages(params.messages);
  const tools = toAnthropicTools(params.tools);
  const toolChoice = toAnthropicToolChoice(params.toolChoice || params.tool_choice);
  const forcedTool = toolChoice?.type === "any" || toolChoice?.type === "tool";

  const jsonRequested = wantsJson(params);
  let finalSystem = system;
  if (jsonRequested) {
    const schema = resolveSchema(params);
    let instruction =
      "Respond with a single valid JSON value only — no prose, no explanations, no markdown code fences.";
    if (schema?.schema) {
      instruction += ` The JSON must conform to this JSON Schema:\n${JSON.stringify(schema.schema)}`;
    }
    finalSystem = [system, instruction].filter(Boolean).join("\n\n");
  }

  const request: Record<string, unknown> = {
    model: mapModel(params.model),
    max_tokens: params.maxTokens ?? params.max_tokens ?? DEFAULT_MAX_TOKENS,
    messages,
  };
  if (finalSystem) request.system = finalSystem;
  if (tools) request.tools = tools;
  if (toolChoice) request.tool_choice = toolChoice;
  // Adaptive thinking lifts quality on generation/analysis; skip it when a tool call is forced
  // (forced tool use is incompatible with thinking). Thinking blocks are separate from the text
  // block, so they never pollute JSON output.
  if (!forcedTool) request.thinking = { type: "adaptive" };

  const message = await client.messages.create(
    request as unknown as Anthropic.MessageCreateParamsNonStreaming
  );

  let text = "";
  const toolCalls: ToolCall[] = [];
  for (const block of message.content) {
    if (block.type === "text") {
      text += block.text;
    } else if (block.type === "tool_use") {
      toolCalls.push({
        id: block.id,
        type: "function",
        function: { name: block.name, arguments: JSON.stringify(block.input) },
      });
    }
  }

  if (jsonRequested && text) {
    text = extractJson(text);
  }

  return {
    id: message.id,
    created: Math.floor(Date.now() / 1000),
    model: message.model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: text,
          ...(toolCalls.length ? { tool_calls: toolCalls } : {}),
        },
        finish_reason: message.stop_reason ?? null,
      },
    ],
    usage: message.usage
      ? {
          prompt_tokens: message.usage.input_tokens,
          completion_tokens: message.usage.output_tokens,
          total_tokens: message.usage.input_tokens + message.usage.output_tokens,
        }
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// Gemini path (Google Generative Language API)
// ---------------------------------------------------------------------------

/** Current default text model. Callers should use this instead of hardcoding retired ids. */
export const DEFAULT_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-3.6-flash";

function geminiModelName(model?: string): string {
  // Allow an explicit override, else use a known-current model. The app's dropdown still carries
  // legacy ids like "gemini-2.5-flash" (retired), so only trust explicitly current gemini-3.x ids.
  if (process.env.GEMINI_TEXT_MODEL) return process.env.GEMINI_TEXT_MODEL;
  const m = (model || "").toLowerCase();
  if (/gemini-3[.-]/.test(m)) return model as string;
  return DEFAULT_TEXT_MODEL;
}

function toGeminiParts(content: MessageContent | MessageContent[]): Array<{ text: string }> {
  const parts: Array<{ text: string }> = [];
  for (const part of asArray(content)) {
    if (typeof part === "string") {
      if (part) parts.push({ text: part });
    } else if (part.type === "text") {
      if (part.text) parts.push({ text: part.text });
    }
    // images are not sent on the text-generation path
  }
  if (parts.length === 0) parts.push({ text: "" });
  return parts;
}

async function invokeGemini(params: InvokeParams): Promise<InvokeResult> {
  if (!ENV.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  const model = geminiModelName(params.model);

  const systemParts: string[] = [];
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
  for (const message of params.messages) {
    if (message.role === "system") {
      const t = collectText(message.content);
      if (t) systemParts.push(t);
      continue;
    }
    if (message.role === "tool" || message.role === "function") {
      contents.push({ role: "user", parts: [{ text: collectText(message.content) }] });
      continue;
    }
    contents.push({ role: message.role === "assistant" ? "model" : "user", parts: toGeminiParts(message.content) });
  }

  const jsonRequested = wantsJson(params);
  let systemInstruction = systemParts.length ? systemParts.join("\n\n") : undefined;
  if (jsonRequested) {
    const schema = resolveSchema(params);
    let instruction = "Respond with a single valid JSON value only — no prose, no markdown code fences.";
    if (schema?.schema) instruction += ` The JSON must conform to this JSON Schema:\n${JSON.stringify(schema.schema)}`;
    systemInstruction = [systemInstruction, instruction].filter(Boolean).join("\n\n");
  }

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: params.maxTokens ?? params.max_tokens ?? 8192,
      ...(jsonRequested ? { responseMimeType: "application/json" } : {}),
    },
  };
  if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction }] };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": ENV.geminiApiKey },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Gemini generateContent failed (${response.status})${detail ? `: ${detail.slice(0, 300)}` : ""}`);
  }

  const json: any = await response.json();
  const parts: any[] = json?.candidates?.[0]?.content?.parts ?? [];
  let text = parts.map((p) => p?.text ?? "").join("");
  if (jsonRequested && text) text = extractJson(text);

  const usage = json?.usageMetadata ?? {};
  const promptTokens = usage.promptTokenCount ?? 0;
  const completionTokens = usage.candidatesTokenCount ?? 0;

  return {
    id: json?.responseId ?? "gemini",
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: text },
        finish_reason: json?.candidates?.[0]?.finishReason ?? null,
      },
    ],
    usage: { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: promptTokens + completionTokens },
  };
}

// ---------------------------------------------------------------------------
// Provider dispatch
// ---------------------------------------------------------------------------

type LlmProvider = "claude" | "gemini" | "openai";

function resolveProvider(model?: string): LlmProvider {
  const m = (model || "").toLowerCase();
  if (m.includes("gemini")) return "gemini";
  if (m.includes("gpt") || m.includes("openai")) return "openai";
  if (m.includes("claude")) return "claude";
  // No provider named in the model → use whichever key is configured.
  if (ENV.anthropicApiKey) return "claude";
  if (ENV.geminiApiKey) return "gemini";
  return "claude";
}

/**
 * Route an LLM request to the provider implied by the model, falling back to whichever
 * provider actually has a key configured. This is what makes the app's model dropdown meaningful.
 */
export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  let provider = resolveProvider(params.model);

  // Fall back to an available provider when the preferred one has no key.
  if (provider === "claude" && !ENV.anthropicApiKey && ENV.geminiApiKey) provider = "gemini";
  else if (provider === "gemini" && !ENV.geminiApiKey && ENV.anthropicApiKey) provider = "claude";
  else if (provider === "openai") provider = ENV.geminiApiKey ? "gemini" : "claude"; // no OpenAI text path yet

  return provider === "gemini" ? invokeGemini(params) : invokeClaude(params);
}
