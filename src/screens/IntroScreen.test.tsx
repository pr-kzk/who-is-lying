import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { act, screen, fireEvent } from "@testing-library/react";

import { IntroScreen } from "./IntroScreen";
import { renderWithGameSetup, testScenario, INTRO_ACTIONS } from "../test/helpers";

describe("IntroScreen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function renderIntro() {
    renderWithGameSetup(<IntroScreen />, INTRO_ACTIONS);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
  }

  it("renders first paragraph with typewriter effect", async () => {
    await renderIntro();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(25);
    });

    expect(screen.getByText("段")).not.toBeNull();
  });

  it("clicking during typing skips to full text", async () => {
    await renderIntro();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(25);
    });

    const content = document.querySelector('[class*="cursor-pointer"]')!;
    fireEvent.click(content);

    expect(screen.getByText("段落1")).not.toBeNull();
  });

  it("clicking advances to next paragraph when typing complete", async () => {
    await renderIntro();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(25);
    });

    const content = document.querySelector('[class*="cursor-pointer"]')!;
    fireEvent.click(content); // Skip typewriter
    fireEvent.click(content); // Advance to next paragraph

    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(screen.getByText("段落1")).not.toBeNull();
  });

  it("skip button skips all paragraphs", async () => {
    await renderIntro();

    fireEvent.click(screen.getByText("スキップ"));

    expect(screen.getByText("容疑者")).not.toBeNull();
  });

  it("shows suspect cards after all paragraphs done", async () => {
    await renderIntro();

    fireEvent.click(screen.getByText("スキップ"));

    for (const char of testScenario.characters) {
      expect(screen.getByText(char.name)).not.toBeNull();
    }
  });

  it("suspect cards show character info", async () => {
    await renderIntro();

    fireEvent.click(screen.getByText("スキップ"));

    expect(screen.getByText("A太郎")).not.toBeNull();
    expect(screen.getByText(/会計士/)).not.toBeNull();
  });

  it("proceed button is rendered after skipping", async () => {
    await renderIntro();

    fireEvent.click(screen.getByText("スキップ"));

    expect(screen.getByText("尋問を開始する")).not.toBeNull();
  });

  it("shows click to continue hint when typing complete", async () => {
    await renderIntro();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(25);
    });

    const content = document.querySelector('[class*="cursor-pointer"]')!;
    fireEvent.click(content);

    expect(screen.getByText("クリックして続ける")).not.toBeNull();
  });
});
