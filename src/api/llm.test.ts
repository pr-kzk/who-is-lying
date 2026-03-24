import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { callLLM } from "./llm";

describe("callLLM", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  function mockResponse(body: unknown, ok = true, status = 200) {
    mockFetch.mockResolvedValueOnce({
      ok,
      status,
      json: () => Promise.resolve(body),
    });
  }

  describe("local provider (default)", () => {
    it("sends POST to /api/local with OpenAI format", async () => {
      mockResponse({ choices: [{ message: { content: "response" } }] });

      await callLLM("system prompt", [{ role: "user", content: "hello" }]);

      expect(mockFetch).toHaveBeenCalledWith("/api/local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "qwen3.5-9b",
          max_tokens: 500,
          messages: [
            { role: "system", content: "system prompt" },
            { role: "user", content: "hello" },
          ],
        }),
        signal: undefined,
      });
    });

    it("returns text from choices", async () => {
      mockResponse({ choices: [{ message: { content: "回答です" } }] });

      const result = await callLLM("prompt", []);
      expect(result).toBe("回答です");
    });

    it("returns empty string when choices is empty", async () => {
      mockResponse({ choices: [] });

      const result = await callLLM("prompt", []);
      expect(result).toBe("");
    });

    it("passes abort signal to fetch", async () => {
      mockResponse({ choices: [{ message: { content: "ok" } }] });
      const controller = new AbortController();

      await callLLM("prompt", [], controller.signal);

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/local",
        expect.objectContaining({ signal: controller.signal }),
      );
    });
  });

  describe("claude provider", () => {
    beforeEach(() => {
      vi.stubEnv("VITE_LLM_PROVIDER", "claude");
    });

    it("sends POST to /api/claude with Anthropic format", async () => {
      mockResponse({ content: [{ type: "text", text: "response" }] });

      await callLLM("system prompt", [{ role: "user", content: "hello" }]);

      expect(mockFetch).toHaveBeenCalledWith("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-opus-4-6",
          max_tokens: 500,
          system: "system prompt",
          messages: [{ role: "user", content: "hello" }],
        }),
        signal: undefined,
      });
    });

    it("returns text from first content block", async () => {
      mockResponse({ content: [{ type: "text", text: "回答です" }] });

      const result = await callLLM("prompt", []);
      expect(result).toBe("回答です");
    });

    it("returns empty string when content array is empty", async () => {
      mockResponse({ content: [] });

      const result = await callLLM("prompt", []);
      expect(result).toBe("");
    });

    it("passes abort signal to fetch", async () => {
      mockResponse({ content: [{ type: "text", text: "ok" }] });
      const controller = new AbortController();

      await callLLM("prompt", [], controller.signal);

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/claude",
        expect.objectContaining({ signal: controller.signal }),
      );
    });
  });

  it("throws Error with status code on non-ok response", async () => {
    mockResponse({}, false, 429);

    await expect(callLLM("prompt", [])).rejects.toThrow("API error: 429");
  });

  it("throws when fetch rejects", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network failure"));

    await expect(callLLM("prompt", [])).rejects.toThrow("network failure");
  });

  it("falls back to local for unknown provider value", async () => {
    vi.stubEnv("VITE_LLM_PROVIDER", "typo");
    mockResponse({ choices: [{ message: { content: "ok" } }] });

    await callLLM("prompt", []);

    expect(mockFetch).toHaveBeenCalledWith("/api/local", expect.anything());
  });
});
