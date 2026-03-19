import { describe, expect, it, vi } from "vite-plus/test";
import { screen, fireEvent } from "@testing-library/react";

import { StartScreen } from "./StartScreen";
import { useGameState } from "../hooks/useGameState";
import { renderWithGame } from "../test/helpers";

vi.mock("../utils/storage", () => ({
  getTopScores: vi.fn().mockReturnValue([]),
  saveScore: vi.fn(),
  clearScores: vi.fn(),
}));

import { getTopScores } from "../utils/storage";

const mockGetTopScores = vi.mocked(getTopScores);

// Helper that renders StartScreen and watches for phase changes
function StartScreenWithPhaseCheck() {
  const { state } = useGameState();
  return (
    <>
      <StartScreen />
      <div data-testid="phase">{state.phase}</div>
    </>
  );
}

describe("StartScreen", () => {
  it("renders title and subtitle", () => {
    renderWithGame(<StartScreen />);

    expect(screen.getByText(/容疑者AIの供述/)).not.toBeNull();
    expect(screen.getByText("矛盾を探せ")).not.toBeNull();
  });

  it("renders name input field", () => {
    renderWithGame(<StartScreen />);

    expect(screen.getByText("探偵名を入力")).not.toBeNull();
    expect(screen.getByPlaceholderText("あなたの名前...")).not.toBeNull();
  });

  it("start button is disabled when name is empty", () => {
    renderWithGame(<StartScreen />);

    const button = screen.getByText("ゲームスタート") as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it("start button enables when name is entered", () => {
    renderWithGame(<StartScreen />);

    const input = screen.getByPlaceholderText("あなたの名前...");
    fireEvent.change(input, { target: { value: "探偵太郎" } });

    const button = screen.getByText("ゲームスタート") as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it("clicking start dispatches START_GAME", () => {
    renderWithGame(<StartScreenWithPhaseCheck />);

    expect(screen.getByTestId("phase").textContent).toBe("start");

    const input = screen.getByPlaceholderText("あなたの名前...");
    fireEvent.change(input, { target: { value: "探偵太郎" } });
    fireEvent.click(screen.getByText("ゲームスタート"));

    expect(screen.getByTestId("phase").textContent).toBe("intro");
  });

  it("pressing Enter in input dispatches START_GAME", () => {
    renderWithGame(<StartScreenWithPhaseCheck />);

    const input = screen.getByPlaceholderText("あなたの名前...");
    fireEvent.change(input, { target: { value: "探偵太郎" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByTestId("phase").textContent).toBe("intro");
  });

  it("displays top scores when they exist", () => {
    mockGetTopScores.mockReturnValueOnce([
      {
        playerName: "名探偵",
        score: 1500,
        rank: "S",
        title: "天才探偵",
        date: "2026-03-19",
        scenarioId: "test",
        turnsUsed: 3,
      },
    ]);

    renderWithGame(<StartScreen />);

    expect(screen.getByText("Top Scores")).not.toBeNull();
    expect(screen.getByText("名探偵")).not.toBeNull();
    expect(screen.getByText("1500")).not.toBeNull();
  });
});
