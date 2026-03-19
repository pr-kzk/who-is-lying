import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { screen, fireEvent, waitFor } from "@testing-library/react";

import { ResultScreen } from "./ResultScreen";
import { renderWithGameSetup, INTERROGATION_ACTIONS, createTurnActions } from "../test/helpers";
import type { GameAction } from "../state/gameReducer";

vi.mock("../utils/storage", () => ({
  saveScore: vi.fn(),
  getTopScores: vi.fn().mockReturnValue([]),
  clearScores: vi.fn(),
}));

import { saveScore } from "../utils/storage";

const mockSaveScore = vi.mocked(saveScore);

function createResultActions(accuseCorrect: boolean): GameAction[] {
  return [
    ...INTERROGATION_ACTIONS,
    ...createTurnActions(3),
    {
      type: "ACCUSE_SUSPECT",
      suspectId: accuseCorrect ? "char-b" : "char-a",
    },
  ];
}

describe("ResultScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows success message when isCorrect=true", async () => {
    renderWithGameSetup(<ResultScreen />, createResultActions(true));
    expect(await screen.findByText(/犯人を見事に暴いた/)).not.toBeNull();
  });

  it("shows failure message when isCorrect=false", async () => {
    renderWithGameSetup(<ResultScreen />, createResultActions(false));
    expect(await screen.findByText(/真犯人に逃げられた/)).not.toBeNull();
  });

  it("displays accused character card", async () => {
    renderWithGameSetup(<ResultScreen />, createResultActions(true));
    expect(await screen.findByText("あなたが告発した容疑者")).not.toBeNull();
    // B子 appears in both accused card and truth section
    const allB = screen.getAllByText("B子");
    expect(allB.length).toBeGreaterThanOrEqual(1);
  });

  it("displays score breakdown", async () => {
    renderWithGameSetup(<ResultScreen />, createResultActions(true));
    expect(await screen.findByText("スコア内訳")).not.toBeNull();
    expect(screen.getByText("基礎スコア")).not.toBeNull();
    expect(screen.getByText(/ターン消費/)).not.toBeNull();
    expect(screen.getByText(/ヒント使用/)).not.toBeNull();
    expect(screen.getByText("正解ボーナス")).not.toBeNull();
  });

  it("displays total score", async () => {
    renderWithGameSetup(<ResultScreen />, createResultActions(true));
    expect(await screen.findByText("合計")).not.toBeNull();
    // 1000 - 150 (3 turns * 50) - 0 (hints) + 500 (correct) = 1350
    expect(screen.getByText("1350")).not.toBeNull();
  });

  it("displays rank and title", async () => {
    renderWithGameSetup(<ResultScreen />, createResultActions(true));
    expect(await screen.findByText("ランク")).not.toBeNull();
    expect(screen.getByText("S")).not.toBeNull();
    expect(screen.getByText("天才探偵")).not.toBeNull();
  });

  it("displays truth section with guilty character", async () => {
    renderWithGameSetup(<ResultScreen />, createResultActions(true));
    expect(await screen.findByText("事件の真相")).not.toBeNull();
    expect(screen.getByText("真犯人")).not.toBeNull();
    expect(screen.getByText("テスト矛盾説明")).not.toBeNull();
  });

  it("saves score on mount once", async () => {
    renderWithGameSetup(<ResultScreen />, createResultActions(true));
    await screen.findByText("合計");
    await waitFor(() => {
      expect(mockSaveScore).toHaveBeenCalledTimes(1);
    });
    expect(mockSaveScore).toHaveBeenCalledWith(
      expect.objectContaining({
        playerName: "テスト",
        score: 1350,
        rank: "S",
      }),
    );
  });

  it("clicking reset dispatches RESET_GAME", async () => {
    renderWithGameSetup(<ResultScreen />, createResultActions(true));
    const button = await screen.findByText("もう一度プレイする");
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText("0")).not.toBeNull();
    });
  });
});
