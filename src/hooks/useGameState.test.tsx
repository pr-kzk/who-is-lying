import { describe, expect, it } from "vite-plus/test";
import { act } from "@testing-library/react";

import { testScenario } from "../test/fixtures";
import { renderHookWithGame } from "../test/helpers";
import { useGameState } from "./useGameState";

function setupGame() {
  const { result } = renderHookWithGame(() => useGameState());

  act(() => {
    result.current.dispatch({
      type: "START_GAME",
      scenario: testScenario,
      playerName: "テスト",
      difficulty: "normal",
    });
  });
  act(() => {
    result.current.dispatch({ type: "START_INTERROGATION" });
  });

  return result;
}

describe("useGameState", () => {
  it("returns maxTurns as 15", () => {
    const { result } = renderHookWithGame(() => useGameState());
    expect(result.current.maxTurns).toBe(15);
  });

  it("returns remainingTurns = 15 - turnsUsed", () => {
    const result = setupGame();
    expect(result.current.remainingTurns).toBe(15);

    act(() => {
      result.current.dispatch({ type: "ADD_USER_MESSAGE", content: "q1" });
    });
    expect(result.current.remainingTurns).toBe(14);
  });

  it("returns currentSuspect matching currentSuspectId", () => {
    const result = setupGame();
    expect(result.current.currentSuspect?.id).toBe("char-a");
    expect(result.current.currentSuspect?.name).toBe("A太郎");
  });

  it("returns currentChatHistory for the current suspect", () => {
    const result = setupGame();
    expect(result.current.currentChatHistory).toEqual([]);

    act(() => {
      result.current.dispatch({ type: "ADD_USER_MESSAGE", content: "質問" });
    });
    expect(result.current.currentChatHistory).toHaveLength(1);
  });

  it("returns canUseHint=false when fewer than 5 questions", () => {
    const result = setupGame();

    act(() => {
      for (let i = 0; i < 4; i++) {
        result.current.dispatch({ type: "ADD_USER_MESSAGE", content: `q${i}` });
      }
    });
    expect(result.current.canUseHint).toBe(false);
  });

  it("returns canUseHint=true when 5 or more questions", () => {
    const result = setupGame();

    act(() => {
      for (let i = 0; i < 5; i++) {
        result.current.dispatch({ type: "ADD_USER_MESSAGE", content: `q${i}` });
      }
    });
    expect(result.current.canUseHint).toBe(true);
  });

  it("returns correct currentSuspectQuestionCount", () => {
    const result = setupGame();
    expect(result.current.currentSuspectQuestionCount).toBe(0);

    act(() => {
      result.current.dispatch({ type: "ADD_USER_MESSAGE", content: "q1" });
      result.current.dispatch({
        type: "ADD_ASSISTANT_MESSAGE",
        content: "a1",
        triggeredAnxiety: false,
      });
      result.current.dispatch({ type: "ADD_USER_MESSAGE", content: "q2" });
    });

    // Only user messages count
    expect(result.current.currentSuspectQuestionCount).toBe(2);
  });

  it("returns estimatedScore assuming correct answer", () => {
    const result = setupGame();
    // 0 turns, 0 hints, correct → 1500
    expect(result.current.estimatedScore).toBe(1500);

    act(() => {
      result.current.dispatch({ type: "ADD_USER_MESSAGE", content: "q1" });
    });
    // 1 turn, 0 hints, correct → 1450
    expect(result.current.estimatedScore).toBe(1450);
  });

  it("currentSuspect is undefined when currentSuspectId is empty string", () => {
    const { result } = renderHookWithGame(() => useGameState());
    expect(result.current.currentSuspect).toBeUndefined();
  });

  it("currentChatHistory returns empty array for unknown suspectId", () => {
    const { result } = renderHookWithGame(() => useGameState());
    expect(result.current.currentChatHistory).toEqual([]);
  });
});
