import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { act, renderHook } from "@testing-library/react";

import { useTypewriter } from "./useTypewriter";

describe("useTypewriter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with empty displayedText and isComplete=false", () => {
    const { result } = renderHook(() => useTypewriter("こんにちは"));

    expect(result.current.displayedText).toBe("");
    expect(result.current.isComplete).toBe(false);
  });

  it("displays one character after one interval", () => {
    const { result } = renderHook(() => useTypewriter("ABC", 50));

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(result.current.displayedText).toBe("A");
    expect(result.current.isComplete).toBe(false);
  });

  it("completes after all characters are displayed", () => {
    const { result } = renderHook(() => useTypewriter("AB", 30));

    act(() => {
      vi.advanceTimersByTime(30); // "A"
    });
    act(() => {
      vi.advanceTimersByTime(30); // "AB" -> complete
    });

    expect(result.current.displayedText).toBe("AB");
    expect(result.current.isComplete).toBe(true);
  });

  it("handles empty string with immediate completion", () => {
    const { result } = renderHook(() => useTypewriter(""));

    expect(result.current.displayedText).toBe("");
    expect(result.current.isComplete).toBe(true);
  });

  it("skip() immediately shows full text", () => {
    const { result } = renderHook(() => useTypewriter("Hello World"));

    act(() => {
      result.current.skip();
    });

    expect(result.current.displayedText).toBe("Hello World");
    expect(result.current.isComplete).toBe(true);
  });

  it("respects custom speed", () => {
    const { result } = renderHook(() => useTypewriter("AB", 100));

    act(() => {
      vi.advanceTimersByTime(50); // Not enough time
    });
    expect(result.current.displayedText).toBe("");

    act(() => {
      vi.advanceTimersByTime(50); // Now 100ms total
    });
    expect(result.current.displayedText).toBe("A");
  });

  it("resets animation when text changes", () => {
    const { result, rerender } = renderHook(({ text }) => useTypewriter(text, 30), {
      initialProps: { text: "AB" },
    });

    act(() => {
      vi.advanceTimersByTime(60); // Complete "AB"
    });
    expect(result.current.isComplete).toBe(true);

    rerender({ text: "XY" });

    expect(result.current.displayedText).toBe("");
    expect(result.current.isComplete).toBe(false);
  });

  it("clears interval on unmount", () => {
    const { result, unmount } = renderHook(() => useTypewriter("ABCDEF", 30));

    act(() => {
      vi.advanceTimersByTime(30);
    });
    expect(result.current.displayedText).toBe("A");

    unmount();

    // After unmount, no more timers should fire
    const timerCount = vi.getTimerCount();
    expect(timerCount).toBe(0);
  });

  it("handles speed=0 gracefully", () => {
    const { result } = renderHook(() => useTypewriter("AB", 0));

    act(() => {
      vi.advanceTimersByTime(0);
    });

    // With speed=0, setInterval fires immediately
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current.isComplete).toBe(true);
    expect(result.current.displayedText).toBe("AB");
  });
});
