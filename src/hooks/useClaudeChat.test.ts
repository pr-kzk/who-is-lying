import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { act, renderHook } from "@testing-library/react";

import { useClaudeChat } from "./useClaudeChat";

vi.mock("../api/claude", () => ({
  callClaudeAPI: vi.fn(),
}));

import { callClaudeAPI } from "../api/claude";

const mockCallClaudeAPI = vi.mocked(callClaudeAPI);

describe("useClaudeChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("isLoading starts as false", () => {
    const { result } = renderHook(() => useClaudeChat());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("isLoading becomes true during sendMessage and false after", async () => {
    let resolvePromise: (value: string) => void;
    const promise = new Promise<string>((resolve) => {
      resolvePromise = resolve;
    });
    mockCallClaudeAPI.mockReturnValueOnce(promise);

    const { result } = renderHook(() => useClaudeChat());

    let sendPromise: Promise<string>;
    act(() => {
      sendPromise = result.current.sendMessage("prompt", [], "hello");
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolvePromise!("response");
      await sendPromise;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("returns response string on success", async () => {
    mockCallClaudeAPI.mockResolvedValueOnce("回答です");

    const { result } = renderHook(() => useClaudeChat());

    let response: string;
    await act(async () => {
      response = await result.current.sendMessage("prompt", [], "質問");
    });

    expect(response!).toBe("回答です");
  });

  it("sets error state on API failure", async () => {
    mockCallClaudeAPI.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useClaudeChat());

    await act(async () => {
      try {
        await result.current.sendMessage("prompt", [], "質問");
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.isLoading).toBe(false);
  });

  it("clearError resets error to null", async () => {
    mockCallClaudeAPI.mockRejectedValueOnce(new Error("error"));

    const { result } = renderHook(() => useClaudeChat());

    await act(async () => {
      try {
        await result.current.sendMessage("prompt", [], "q");
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBe("error");

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it("does not set error for AbortError", async () => {
    mockCallClaudeAPI.mockRejectedValueOnce(new DOMException("aborted", "AbortError"));

    const { result } = renderHook(() => useClaudeChat());

    await act(async () => {
      try {
        await result.current.sendMessage("prompt", [], "q");
      } catch {
        // expected AbortError re-thrown
      }
    });

    expect(result.current.error).toBeNull();
  });

  it("aborts previous request when sending new one", async () => {
    const firstPromise = new Promise<string>(() => {});
    mockCallClaudeAPI.mockReturnValueOnce(firstPromise);
    mockCallClaudeAPI.mockResolvedValueOnce("second response");

    const { result } = renderHook(() => useClaudeChat());

    // Send first request
    act(() => {
      void result.current.sendMessage("prompt", [], "first");
    });

    // Verify that the abort signal was passed to callClaudeAPI
    const firstSignal = mockCallClaudeAPI.mock.calls[0][2] as AbortSignal;

    // Send second request (should abort first)
    await act(async () => {
      await result.current.sendMessage("prompt", [], "second");
    });

    expect(firstSignal.aborted).toBe(true);
  });

  it("cleans up abort controller on unmount", () => {
    mockCallClaudeAPI.mockReturnValueOnce(new Promise<string>(() => {}));

    const { result, unmount } = renderHook(() => useClaudeChat());

    act(() => {
      void result.current.sendMessage("prompt", [], "q");
    });

    const signal = mockCallClaudeAPI.mock.calls[0][2] as AbortSignal;
    expect(signal.aborted).toBe(false);

    unmount();

    expect(signal.aborted).toBe(true);
  });
});
