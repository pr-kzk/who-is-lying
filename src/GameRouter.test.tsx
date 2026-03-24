import { describe, expect, it, vi } from "vite-plus/test";
import { screen } from "@testing-library/react";

import { GameRouter } from "./GameRouter";
import {
  renderWithGame,
  renderWithGameSetup,
  testScenario,
  INTERROGATION_ACTIONS,
} from "./test/helpers";

vi.mock("./hooks/useClaudeChat", () => ({
  useClaudeChat: vi.fn().mockReturnValue({
    sendMessage: vi.fn().mockResolvedValue(""),
    isLoading: false,
    error: null,
    clearError: vi.fn(),
  }),
}));

vi.mock("./utils/storage", () => ({
  saveScore: vi.fn(),
  getTopScores: vi.fn().mockReturnValue([]),
  clearScores: vi.fn(),
}));

vi.mock("./utils/anxietyDetector", () => ({
  detectAnxiety: vi.fn().mockReturnValue(false),
}));

vi.mock("./utils/promptBuilder", () => ({
  buildSystemPrompt: vi.fn().mockReturnValue("system prompt"),
}));

describe("GameRouter", () => {
  it("renders StartScreen when phase=start", () => {
    renderWithGame(<GameRouter />);
    expect(screen.getByText(/容疑者AIの供述/)).not.toBeNull();
  });

  it("renders IntroScreen when phase=intro", async () => {
    renderWithGameSetup(<GameRouter />, [
      { type: "START_GAME", scenario: testScenario, playerName: "テスト", difficulty: "normal" },
    ]);
    expect(await screen.findByText("スキップ")).not.toBeNull();
  });

  it("renders InterrogationScreen when phase=interrogation", async () => {
    renderWithGameSetup(<GameRouter />, INTERROGATION_ACTIONS);
    expect(await screen.findByText("残り質問回数")).not.toBeNull();
  });

  it("renders ResultScreen when phase=result", async () => {
    renderWithGameSetup(<GameRouter />, [
      ...INTERROGATION_ACTIONS,
      { type: "ACCUSE_SUSPECT", suspectId: "char-b" },
    ]);
    expect(await screen.findByText(/犯人を見事に暴いた/)).not.toBeNull();
  });
});
