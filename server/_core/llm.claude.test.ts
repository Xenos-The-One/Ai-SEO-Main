import { describe, it, expect, beforeEach } from "vitest";
import { vi } from "vitest";

// Mock the Anthropic SDK so the adapter is exercised without any network / API key spend.
const createMock = vi.hoisted(() => vi.fn());
vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    messages = { create: createMock };
    constructor(_opts?: unknown) {}
  }
  return { default: MockAnthropic };
});

// Must be set before the module (and its env.ts) is imported.
process.env.ANTHROPIC_API_KEY = "test-key";

async function loadInvoke() {
  const mod = await import("./llm");
  return mod.invokeLLM;
}

beforeEach(() => {
  createMock.mockReset();
});

describe("Claude llm adapter", () => {
  it("separates system, adds adaptive thinking, and maps content + usage", async () => {
    createMock.mockResolvedValue({
      id: "msg_1",
      model: "claude-opus-5",
      stop_reason: "end_turn",
      content: [{ type: "text", text: "Hello world" }],
      usage: { input_tokens: 10, output_tokens: 5 },
    });

    const invokeLLM = await loadInvoke();
    const res = await invokeLLM({
      messages: [
        { role: "system", content: "You are helpful" },
        { role: "user", content: "Hi" },
      ],
    });

    expect(res.choices[0].message.content).toBe("Hello world");
    expect(res.usage).toEqual({ prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 });

    const req = createMock.mock.calls[0][0];
    expect(req.model).toBe("claude-opus-5");
    expect(req.system).toBe("You are helpful");
    expect(req.thinking).toEqual({ type: "adaptive" });
    expect(req.messages).toEqual([{ role: "user", content: [{ type: "text", text: "Hi" }] }]);
  });

  it("maps legacy model names and strips JSON out of fenced output", async () => {
    createMock.mockResolvedValue({
      id: "msg_2",
      model: "claude-sonnet-5",
      stop_reason: "end_turn",
      content: [{ type: "text", text: 'Here is the result:\n```json\n{"a":1}\n```' }],
      usage: { input_tokens: 1, output_tokens: 1 },
    });

    const invokeLLM = await loadInvoke();
    const res = await invokeLLM({
      model: "gemini-2.5-flash",
      messages: [{ role: "user", content: "give json" }],
      response_format: { type: "json_schema", json_schema: { name: "x", schema: { type: "object" } } },
    });

    expect(res.choices[0].message.content).toBe('{"a":1}');
    expect(JSON.parse(res.choices[0].message.content as string)).toEqual({ a: 1 });

    const req = createMock.mock.calls[0][0];
    expect(req.model).toBe("claude-sonnet-5"); // flash -> sonnet
    expect(req.system).toContain("valid JSON");
  });

  it("maps tool_use blocks back to OpenAI-style tool_calls and omits thinking when forced", async () => {
    createMock.mockResolvedValue({
      id: "msg_3",
      model: "claude-opus-5",
      stop_reason: "tool_use",
      content: [{ type: "tool_use", id: "t1", name: "foo", input: { x: 1 } }],
      usage: { input_tokens: 2, output_tokens: 2 },
    });

    const invokeLLM = await loadInvoke();
    const res = await invokeLLM({
      messages: [{ role: "user", content: "go" }],
      tools: [{ type: "function", function: { name: "foo", parameters: { type: "object" } } }],
      tool_choice: "required",
    });

    expect(res.choices[0].message.tool_calls).toEqual([
      { id: "t1", type: "function", function: { name: "foo", arguments: '{"x":1}' } },
    ]);

    const req = createMock.mock.calls[0][0];
    expect(req.tools[0].name).toBe("foo");
    expect(req.tool_choice).toEqual({ type: "any" });
    expect(req.thinking).toBeUndefined(); // forced tool use => no thinking
  });
});
