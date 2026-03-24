import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { streamLLM } from "./llm";

function createSSEStream(events: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const text = events.join("\n") + "\n";
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

describe("streamLLM", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  function mockStreamResponse(events: string[], ok = true, status = 200) {
    mockFetch.mockResolvedValueOnce({
      ok,
      status,
      body: createSSEStream(events),
    });
  }

  describe("local provider (default)", () => {
    it("sends POST to /api/local with stream: true", async () => {
      mockStreamResponse(['data: {"choices":[{"delta":{"content":"hello"}}]}', "data: [DONE]"]);

      await streamLLM("system prompt", [{ role: "user", content: "hello" }], vi.fn());

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/local",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"stream":true'),
        }),
      );
    });

    it("calls onChunk for each delta and returns full text", async () => {
      mockStreamResponse([
        'data: {"choices":[{"delta":{"content":"こん"}}]}',
        'data: {"choices":[{"delta":{"content":"にちは"}}]}',
        "data: [DONE]",
      ]);

      const chunks: string[] = [];
      const result = await streamLLM("prompt", [], (chunk) => chunks.push(chunk));

      expect(chunks).toEqual(["こん", "にちは"]);
      expect(result).toBe("こんにちは");
    });

    it("returns empty string when no content deltas", async () => {
      mockStreamResponse(["data: [DONE]"]);

      const result = await streamLLM("prompt", [], vi.fn());
      expect(result).toBe("");
    });
  });

  describe("claude provider", () => {
    beforeEach(() => {
      vi.stubEnv("VITE_LLM_PROVIDER", "claude");
    });

    it("sends POST to /api/claude with stream: true", async () => {
      mockStreamResponse([
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"hello"}}',
        "data: [DONE]",
      ]);

      await streamLLM("system prompt", [{ role: "user", content: "hello" }], vi.fn());

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/claude",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"stream":true'),
        }),
      );
    });

    it("calls onChunk for each content_block_delta and returns full text", async () => {
      mockStreamResponse([
        'data: {"type":"message_start","message":{}}',
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"回答"}}',
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"です"}}',
        'data: {"type":"message_stop"}',
        "data: [DONE]",
      ]);

      const chunks: string[] = [];
      const result = await streamLLM("prompt", [], (chunk) => chunks.push(chunk));

      expect(chunks).toEqual(["回答", "です"]);
      expect(result).toBe("回答です");
    });
  });

  it("throws Error with status code on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 429 });

    await expect(streamLLM("prompt", [], vi.fn())).rejects.toThrow("API error: 429");
  });

  it("throws when fetch rejects", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network failure"));

    await expect(streamLLM("prompt", [], vi.fn())).rejects.toThrow("network failure");
  });

  it("falls back to local for unknown provider value", async () => {
    vi.stubEnv("VITE_LLM_PROVIDER", "typo");
    mockStreamResponse(['data: {"choices":[{"delta":{"content":"ok"}}]}', "data: [DONE]"]);

    await streamLLM("prompt", [], vi.fn());

    expect(mockFetch).toHaveBeenCalledWith("/api/local", expect.anything());
  });
});
