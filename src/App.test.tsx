import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { cleanup, render, screen } from "@testing-library/react";

import { App } from "./App";

afterEach(() => {
  cleanup();
});

vi.mock("./utils/storage", () => ({
  saveScore: vi.fn(),
  getTopScores: vi.fn().mockReturnValue([]),
  clearScores: vi.fn(),
}));

describe("App", () => {
  it("renders without crashing", () => {
    render(<App />);
    expect(screen.getByText(/容疑者AIの供述/)).not.toBeNull();
  });

  it("renders the start screen by default", () => {
    render(<App />);
    expect(screen.getByPlaceholderText("あなたの名前...")).not.toBeNull();
    expect(screen.getByText("ゲームスタート")).not.toBeNull();
  });

  it("wraps content in Layout", () => {
    const { container } = render(<App />);
    const layoutDiv = container.querySelector(".min-h-screen");
    expect(layoutDiv).not.toBeNull();
  });
});
