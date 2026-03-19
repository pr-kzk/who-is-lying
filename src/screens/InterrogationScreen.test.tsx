import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { screen } from "@testing-library/react";

import { InterrogationScreen } from "./InterrogationScreen";
import { renderWithGameSetup, INTERROGATION_ACTIONS, createTurnActions } from "../test/helpers";

vi.mock("../hooks/useClaudeChat", () => ({
  useClaudeChat: vi.fn().mockReturnValue({
    sendMessage: vi.fn().mockResolvedValue("回答です"),
    isLoading: false,
    error: null,
    clearError: vi.fn(),
  }),
}));

vi.mock("../utils/anxietyDetector", () => ({
  detectAnxiety: vi.fn().mockReturnValue(false),
}));

vi.mock("../utils/promptBuilder", () => ({
  buildSystemPrompt: vi.fn().mockReturnValue("system prompt"),
}));

import { useClaudeChat } from "../hooks/useClaudeChat";

describe("InterrogationScreen", () => {
  beforeEach(() => {
    vi.mocked(useClaudeChat).mockReturnValue({
      sendMessage: vi.fn().mockResolvedValue("回答です"),
      isLoading: false,
      error: null,
      clearError: vi.fn(),
    });
  });

  it("renders ScoreBoard with remaining turns", async () => {
    renderWithGameSetup(<InterrogationScreen />, INTERROGATION_ACTIONS);
    expect(await screen.findByText("残り質問回数")).not.toBeNull();
  });

  it("renders SuspectSelector with character names", async () => {
    renderWithGameSetup(<InterrogationScreen />, INTERROGATION_ACTIONS);
    await screen.findByText("残り質問回数");
    // A太郎 appears in both SuspectSelector and CharacterPanel
    const allA = screen.getAllByText("A太郎");
    expect(allA.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("B子")).not.toBeNull();
    expect(screen.getByText("C太")).not.toBeNull();
  });

  it("renders CharacterPanel with current suspect", async () => {
    renderWithGameSetup(<InterrogationScreen />, INTERROGATION_ACTIONS);
    expect(await screen.findByText("会計士")).not.toBeNull();
  });

  it("renders AccuseButton", async () => {
    renderWithGameSetup(<InterrogationScreen />, INTERROGATION_ACTIONS);
    expect(await screen.findByText(/犯人を指名する/)).not.toBeNull();
  });

  it("renders chat placeholder for current suspect", async () => {
    renderWithGameSetup(<InterrogationScreen />, INTERROGATION_ACTIONS);
    expect(await screen.findByText("A太郎 に質問してみましょう")).not.toBeNull();
  });

  it("disables input when remainingTurns <= 0", async () => {
    renderWithGameSetup(<InterrogationScreen />, [
      ...INTERROGATION_ACTIONS,
      ...createTurnActions(15),
    ]);

    const textarea = await screen.findByPlaceholderText("質問できません");
    expect((textarea as HTMLTextAreaElement).disabled).toBe(true);
  });

  it("shows error toast when error occurs", async () => {
    vi.mocked(useClaudeChat).mockReturnValue({
      sendMessage: vi.fn().mockResolvedValue(""),
      isLoading: false,
      error: "API接続エラー",
      clearError: vi.fn(),
    });

    renderWithGameSetup(<InterrogationScreen />, INTERROGATION_ACTIONS);

    expect(await screen.findByText("API接続エラー")).not.toBeNull();
  });

  it("renders score display", async () => {
    renderWithGameSetup(<InterrogationScreen />, INTERROGATION_ACTIONS);
    expect(await screen.findByText("スコア推定値")).not.toBeNull();
  });
});
