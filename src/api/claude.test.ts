import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { callClaudeAPI } from "./claude";

describe("callClaudeAPI", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockResponse(body: unknown, ok = true, status = 200) {
    mockFetch.mockResolvedValueOnce({
      ok,
      status,
      json: () => Promise.resolve(body),
    });
  }

  it("sends POST to /api/chat with correct body", async () => {
    mockResponse({ content: [{ type: "text", text: "response" }] });

    await callClaudeAPI("system prompt", [{ role: "user", content: "hello" }]);

    expect(mockFetch).toHaveBeenCalledWith("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        system: "system prompt",
        messages: [{ role: "user", content: "hello" }],
      }),
      signal: undefined,
    });
  });

  it("returns text from first content block", async () => {
    mockResponse({ content: [{ type: "text", text: "回答です" }] });

    const result = await callClaudeAPI("prompt", []);
    expect(result).toBe("回答です");
  });

  it("returns empty string when content array is empty", async () => {
    mockResponse({ content: [] });

    const result = await callClaudeAPI("prompt", []);
    expect(result).toBe("");
  });

  it("throws Error with status code on non-ok response", async () => {
    mockResponse({}, false, 429);

    await expect(callClaudeAPI("prompt", [])).rejects.toThrow("API error: 429");
  });

  it("passes abort signal to fetch", async () => {
    mockResponse({ content: [{ type: "text", text: "ok" }] });
    const controller = new AbortController();

    await callClaudeAPI("prompt", [], controller.signal);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it("throws when fetch rejects", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network failure"));

    await expect(callClaudeAPI("prompt", [])).rejects.toThrow("network failure");
  });
});
