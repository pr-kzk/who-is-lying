import { describe, expect, it } from "vite-plus/test";
import { act } from "@testing-library/react";

import { useGame } from "./GameContext";
import { testScenario } from "../test/fixtures";
import { renderHookWithGame } from "../test/helpers";

describe("GameContext", () => {
  it("GameProvider renders children", () => {
    const { result } = renderHookWithGame(() => useGame());
    expect(result.current).toBeDefined();
  });

  it("useGame returns state and dispatch", () => {
    const { result } = renderHookWithGame(() => useGame());
    expect(result.current.state).toBeDefined();
    expect(result.current.state.phase).toBe("start");
    expect(typeof result.current.dispatch).toBe("function");
  });

  it("useGame throws when used outside GameProvider", () => {
    const { renderHook } = require("@testing-library/react");
    expect(() => {
      renderHook(() => useGame());
    }).toThrow("useGame must be used within a GameProvider");
  });

  it("dispatched actions update state", () => {
    const { result } = renderHookWithGame(() => useGame());

    act(() => {
      result.current.dispatch({
        type: "START_GAME",
        scenario: testScenario,
        playerName: "テスト",
        difficulty: "normal",
      });
    });

    expect(result.current.state.phase).toBe("intro");
    expect(result.current.state.playerName).toBe("テスト");
    expect(result.current.state.scenario).toBe(testScenario);
  });
});
