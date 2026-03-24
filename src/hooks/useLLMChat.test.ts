import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { act, renderHook } from "@testing-library/react";

import { useLLMChat } from "./useLLMChat";

vi.mock("../api/llm", () => ({
  streamLLM: vi.fn(),
}));

import { streamLLM } from "../api/llm";

const mockStreamLLM = vi.mocked(streamLLM);

describe("useLLMChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("isLoading starts as false", () => {
    const { result } = renderHook(() => useLLMChat());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.streamingContent).toBeNull();
  });

  it("isLoading becomes true during sendMessage and false after", async () => {
    let resolvePromise: (value: string) => void;
    const promise = new Promise<string>((resolve) => {
      resolvePromise = resolve;
    });
    mockStreamLLM.mockReturnValueOnce(promise);

    const { result } = renderHook(() => useLLMChat());

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
    mockStreamLLM.mockResolvedValueOnce("回答です");

    const { result } = renderHook(() => useLLMChat());

    let response: string;
    await act(async () => {
      response = await result.current.sendMessage("prompt", [], "質問");
    });

    expect(response!).toBe("回答です");
  });

  it("sets error state on API failure", async () => {
    mockStreamLLM.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useLLMChat());

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
    mockStreamLLM.mockRejectedValueOnce(new Error("error"));

    const { result } = renderHook(() => useLLMChat());

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
    mockStreamLLM.mockRejectedValueOnce(new DOMException("aborted", "AbortError"));

    const { result } = renderHook(() => useLLMChat());

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
    mockStreamLLM.mockReturnValueOnce(firstPromise);
    mockStreamLLM.mockResolvedValueOnce("second response");

    const { result } = renderHook(() => useLLMChat());

    // Send first request
    act(() => {
      void result.current.sendMessage("prompt", [], "first");
    });

    // Verify that the abort signal was passed to streamLLM
    const firstSignal = mockStreamLLM.mock.calls[0][3] as AbortSignal;

    // Send second request (should abort first)
    await act(async () => {
      await result.current.sendMessage("prompt", [], "second");
    });

    expect(firstSignal.aborted).toBe(true);
  });

  it("cleans up abort controller on unmount", () => {
    mockStreamLLM.mockReturnValueOnce(new Promise<string>(() => {}));

    const { result, unmount } = renderHook(() => useLLMChat());

    act(() => {
      void result.current.sendMessage("prompt", [], "q");
    });

    const signal = mockStreamLLM.mock.calls[0][3] as AbortSignal;
    expect(signal.aborted).toBe(false);

    unmount();

    expect(signal.aborted).toBe(true);
  });
});
