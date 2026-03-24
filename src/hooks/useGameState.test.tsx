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
    // Initial auto-question + alibi response
    expect(result.current.currentChatHistory).toHaveLength(2);
    expect(result.current.currentChatHistory[0].role).toBe("user");
    expect(result.current.currentChatHistory[1].role).toBe("assistant");

    act(() => {
      result.current.dispatch({ type: "ADD_USER_MESSAGE", content: "質問" });
    });
    expect(result.current.currentChatHistory).toHaveLength(3);
  });

  it("returns canUseHint=false when fewer than 5 questions (including auto-question)", () => {
    const result = setupGame();

    // Auto-question counts as 1, so 3 more = 4 total
    act(() => {
      for (let i = 0; i < 3; i++) {
        result.current.dispatch({ type: "ADD_USER_MESSAGE", content: `q${i}` });
      }
    });
    expect(result.current.canUseHint).toBe(false);
  });

  it("returns canUseHint=true when 5 or more questions (including auto-question)", () => {
    const result = setupGame();

    // Auto-question counts as 1, so 4 more = 5 total
    act(() => {
      for (let i = 0; i < 4; i++) {
        result.current.dispatch({ type: "ADD_USER_MESSAGE", content: `q${i}` });
      }
    });
    expect(result.current.canUseHint).toBe(true);
  });

  it("returns correct currentSuspectQuestionCount", () => {
    const result = setupGame();
    // Auto-question counts as 1
    expect(result.current.currentSuspectQuestionCount).toBe(1);

    act(() => {
      result.current.dispatch({ type: "ADD_USER_MESSAGE", content: "q1" });
      result.current.dispatch({
        type: "ADD_ASSISTANT_MESSAGE",
        content: "a1",
        triggeredAnxiety: false,
      });
      result.current.dispatch({ type: "ADD_USER_MESSAGE", content: "q2" });
    });

    // Auto-question (1) + 2 user messages = 3
    expect(result.current.currentSuspectQuestionCount).toBe(3);
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
