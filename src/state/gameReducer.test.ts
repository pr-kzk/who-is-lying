import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { testScenario } from "../test/fixtures";
import { calculateScore } from "../utils/scoreCalculator";
import { gameReducer, initialGameState } from "./gameReducer";

function getInterrogationState() {
  let state = gameReducer(initialGameState, {
    type: "START_GAME",
    scenario: testScenario,
    playerName: "P",
    difficulty: "normal",
  });
  return gameReducer(state, { type: "START_INTERROGATION" });
}

describe("initialGameState", () => {
  it("has correct default values", () => {
    expect(initialGameState.phase).toBe("start");
    expect(initialGameState.turnsUsed).toBe(0);
    expect(initialGameState.hintsRevealed).toBe(0);
    expect(initialGameState.accusedSuspectId).toBeNull();
    expect(initialGameState.isCorrect).toBeNull();
    expect(initialGameState.score).toBeNull();
    expect(initialGameState.playerName).toBe("");
  });
});

describe("gameReducer", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(1000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("START_GAME", () => {
    it("sets phase to intro and initializes game", () => {
      const state = gameReducer(initialGameState, {
        type: "START_GAME",
        scenario: testScenario,
        playerName: "テストプレイヤー",
        difficulty: "normal",
      });

      expect(state.phase).toBe("intro");
      expect(state.scenario).toBe(testScenario);
      expect(state.playerName).toBe("テストプレイヤー");
      expect(state.turnsUsed).toBe(0);
      expect(state.hintsRevealed).toBe(0);
    });

    it("initializes empty chat histories for each character", () => {
      const state = gameReducer(initialGameState, {
        type: "START_GAME",
        scenario: testScenario,
        playerName: "P",
        difficulty: "normal",
      });

      expect(Object.keys(state.chatHistories)).toHaveLength(3);
      expect(state.chatHistories["char-a"]).toEqual([]);
      expect(state.chatHistories["char-b"]).toEqual([]);
      expect(state.chatHistories["char-c"]).toEqual([]);
    });
  });

  describe("START_INTERROGATION", () => {
    it("sets phase and selects first character", () => {
      const gameStarted = gameReducer(initialGameState, {
        type: "START_GAME",
        scenario: testScenario,
        playerName: "P",
        difficulty: "normal",
      });
      const state = gameReducer(gameStarted, { type: "START_INTERROGATION" });

      expect(state.phase).toBe("interrogation");
      expect(state.currentSuspectId).toBe("char-a");
    });

    it("populates chat histories with initial alibi messages", () => {
      const gameStarted = gameReducer(initialGameState, {
        type: "START_GAME",
        scenario: testScenario,
        playerName: "P",
        difficulty: "normal",
      });
      const state = gameReducer(gameStarted, { type: "START_INTERROGATION" });

      // Each character should have user question + assistant alibi
      for (const id of ["char-a", "char-b", "char-c"]) {
        expect(state.chatHistories[id]).toHaveLength(2);
        expect(state.chatHistories[id][0].role).toBe("user");
        expect(state.chatHistories[id][0].content).toBe("犯行時刻は何をしていましたか？");
        expect(state.chatHistories[id][1].role).toBe("assistant");
      }
      expect(state.chatHistories["char-a"][1].content).toBe("自宅にいた");
      expect(state.chatHistories["char-b"][1].content).toBe("レストランにいた");
      expect(state.chatHistories["char-c"][1].content).toBe("ハッカソンに参加");

      // Turns should not be consumed
      expect(state.turnsUsed).toBe(0);
    });
  });

  describe("SELECT_SUSPECT", () => {
    it("does not increment turnsUsed when switching to a different suspect", () => {
      const state = getInterrogationState();
      const next = gameReducer(state, { type: "SELECT_SUSPECT", suspectId: "char-b" });

      expect(next.currentSuspectId).toBe("char-b");
      expect(next.turnsUsed).toBe(state.turnsUsed);
    });

    it("returns same state reference when selecting current suspect", () => {
      const state = getInterrogationState();
      const next = gameReducer(state, { type: "SELECT_SUSPECT", suspectId: "char-a" });

      expect(next).toBe(state);
    });
  });

  describe("ADD_USER_MESSAGE", () => {
    it("appends user message and increments turn", () => {
      const state = getInterrogationState();
      const next = gameReducer(state, {
        type: "ADD_USER_MESSAGE",
        content: "アリバイを教えてください",
      });

      expect(next.turnsUsed).toBe(state.turnsUsed + 1);
      const history = next.chatHistories["char-a"];
      expect(history).toHaveLength(3);
      expect(history[2].role).toBe("user");
      expect(history[2].content).toBe("アリバイを教えてください");
      expect(history[2].triggeredAnxiety).toBe(false);
      expect(history[2].timestamp).toBe(1000);
    });
  });

  describe("ADD_ASSISTANT_MESSAGE", () => {
    function getStateWithUserMessage() {
      const state = getInterrogationState();
      return gameReducer(state, { type: "ADD_USER_MESSAGE", content: "質問" });
    }

    it("appends assistant message without incrementing turn", () => {
      const state = getStateWithUserMessage();
      const next = gameReducer(state, {
        type: "ADD_ASSISTANT_MESSAGE",
        content: "回答です",
        triggeredAnxiety: false,
      });

      expect(next.turnsUsed).toBe(state.turnsUsed);
      const history = next.chatHistories["char-a"];
      expect(history).toHaveLength(4);
      expect(history[3].role).toBe("assistant");
      expect(history[3].content).toBe("回答です");
    });

    it("passes triggeredAnxiety flag correctly", () => {
      const state = getStateWithUserMessage();
      const next = gameReducer(state, {
        type: "ADD_ASSISTANT_MESSAGE",
        content: "それは…",
        triggeredAnxiety: true,
      });

      const history = next.chatHistories["char-a"];
      expect(history[3].triggeredAnxiety).toBe(true);
    });
  });

  describe("ADD_USER_MESSAGE_TO_ALL", () => {
    it("appends user message to all suspect histories and increments turns by 2", () => {
      const state = getInterrogationState();
      const next = gameReducer(state, {
        type: "ADD_USER_MESSAGE_TO_ALL",
        content: "犯行時刻にどこにいましたか？",
      });

      expect(next.turnsUsed).toBe(state.turnsUsed + 2);
      for (const id of ["char-a", "char-b", "char-c"]) {
        const history = next.chatHistories[id];
        expect(history).toHaveLength(3);
        expect(history[2].role).toBe("user");
        expect(history[2].content).toBe("犯行時刻にどこにいましたか？");
      }
    });

    it("preserves existing messages in each history", () => {
      let state = getInterrogationState();
      // Add a message to char-a first
      state = gameReducer(state, { type: "ADD_USER_MESSAGE", content: "最初の質問" });

      const next = gameReducer(state, {
        type: "ADD_USER_MESSAGE_TO_ALL",
        content: "全員への質問",
      });

      expect(next.chatHistories["char-a"]).toHaveLength(4);
      expect(next.chatHistories["char-a"][2].content).toBe("最初の質問");
      expect(next.chatHistories["char-a"][3].content).toBe("全員への質問");
      expect(next.chatHistories["char-b"]).toHaveLength(3);
      expect(next.chatHistories["char-c"]).toHaveLength(3);
    });
  });

  describe("ADD_ASSISTANT_MESSAGE_FOR_SUSPECT", () => {
    it("appends assistant message to specified suspect only", () => {
      let state = getInterrogationState();
      state = gameReducer(state, {
        type: "ADD_USER_MESSAGE_TO_ALL",
        content: "質問",
      });

      const next = gameReducer(state, {
        type: "ADD_ASSISTANT_MESSAGE_FOR_SUSPECT",
        suspectId: "char-b",
        content: "char-bの回答",
        triggeredAnxiety: false,
      });

      expect(next.chatHistories["char-b"]).toHaveLength(4);
      expect(next.chatHistories["char-b"][3].role).toBe("assistant");
      expect(next.chatHistories["char-b"][3].content).toBe("char-bの回答");
      // Other suspects should not have the assistant message
      expect(next.chatHistories["char-a"]).toHaveLength(3);
      expect(next.chatHistories["char-c"]).toHaveLength(3);
    });

    it("does not increment turnsUsed", () => {
      const state = getInterrogationState();
      const next = gameReducer(state, {
        type: "ADD_ASSISTANT_MESSAGE_FOR_SUSPECT",
        suspectId: "char-a",
        content: "回答",
        triggeredAnxiety: true,
      });

      expect(next.turnsUsed).toBe(state.turnsUsed);
    });

    it("passes triggeredAnxiety flag correctly", () => {
      const state = getInterrogationState();
      const next = gameReducer(state, {
        type: "ADD_ASSISTANT_MESSAGE_FOR_SUSPECT",
        suspectId: "char-c",
        content: "それは…",
        triggeredAnxiety: true,
      });

      const history = next.chatHistories["char-c"];
      expect(history[2].triggeredAnxiety).toBe(true);
    });
  });

  describe("USE_HINT", () => {
    it("increments hintsRevealed and sets lastHintTurn", () => {
      const state = getInterrogationState();
      const next = gameReducer(state, { type: "USE_HINT" });

      expect(next.hintsRevealed).toBe(1);
      expect(next.lastHintTurn).toBe(state.turnsUsed);
      expect(next.turnsUsed).toBe(state.turnsUsed);
    });

    it("tracks lastHintTurn correctly after turns advance", () => {
      let state = getInterrogationState();
      state = gameReducer(state, { type: "ADD_USER_MESSAGE", content: "q1" });
      state = gameReducer(state, { type: "USE_HINT" });

      expect(state.hintsRevealed).toBe(1);
      expect(state.lastHintTurn).toBe(1);
    });
  });

  describe("ACCUSE_SUSPECT", () => {
    function getGameState(turnsUsed: number, hintsRevealed: number) {
      let state = getInterrogationState();
      for (let i = 0; i < turnsUsed; i++) {
        state = gameReducer(state, { type: "ADD_USER_MESSAGE", content: `q${i}` });
      }
      for (let i = 0; i < hintsRevealed; i++) {
        state = gameReducer(state, { type: "USE_HINT" });
      }
      return state;
    }

    it("correct accusation sets isCorrect=true and calculates score", () => {
      const state = getGameState(3, 1);
      const next = gameReducer(state, { type: "ACCUSE_SUSPECT", suspectId: "char-b" });

      expect(next.phase).toBe("result");
      expect(next.isCorrect).toBe(true);
      expect(next.accusedSuspectId).toBe("char-b");
      expect(next.score).toBe(calculateScore(3, 1, true));
    });

    it("wrong accusation sets isCorrect=false", () => {
      const state = getGameState(5, 0);
      const next = gameReducer(state, { type: "ACCUSE_SUSPECT", suspectId: "char-a" });

      expect(next.phase).toBe("result");
      expect(next.isCorrect).toBe(false);
      expect(next.accusedSuspectId).toBe("char-a");
      expect(next.score).toBe(calculateScore(5, 0, false));
    });
  });

  describe("RESET_GAME", () => {
    it("returns to initial state", () => {
      let state = getInterrogationState();
      const reset = gameReducer(state, { type: "RESET_GAME" });

      expect(reset.phase).toBe("start");
      expect(reset.turnsUsed).toBe(0);
      expect(reset.hintsRevealed).toBe(0);
      expect(reset.accusedSuspectId).toBeNull();
      expect(reset.isCorrect).toBeNull();
      expect(reset.score).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("SELECT_SUSPECT with non-existent id still updates state", () => {
      const state = getInterrogationState();
      const next = gameReducer(state, { type: "SELECT_SUSPECT", suspectId: "non-existent" });

      expect(next.currentSuspectId).toBe("non-existent");
      expect(next.turnsUsed).toBe(state.turnsUsed);
    });

    it("state immutability: original state is not mutated", () => {
      const state = gameReducer(initialGameState, {
        type: "START_GAME",
        scenario: testScenario,
        playerName: "P",
        difficulty: "normal",
      });

      const originalPhase = state.phase;
      const originalTurns = state.turnsUsed;
      const originalHistories = { ...state.chatHistories };

      const next = gameReducer(state, { type: "START_INTERROGATION" });
      gameReducer(next, { type: "ADD_USER_MESSAGE", content: "test" });

      expect(state.phase).toBe(originalPhase);
      expect(state.turnsUsed).toBe(originalTurns);
      expect(state.chatHistories).toEqual(originalHistories);
    });

    it("ADD_USER_MESSAGE works when chatHistories has no entry for suspect", () => {
      let state = getInterrogationState();
      state = { ...state, currentSuspectId: "unknown-suspect", chatHistories: {} };

      const next = gameReducer(state, { type: "ADD_USER_MESSAGE", content: "hello" });
      expect(next.chatHistories["unknown-suspect"]).toHaveLength(1);
      expect(next.chatHistories["unknown-suspect"][0].content).toBe("hello");
    });

    it("unknown action type returns same state", () => {
      const state = gameReducer(initialGameState, {
        type: "START_GAME",
        scenario: testScenario,
        playerName: "P",
        difficulty: "normal",
      });

      // @ts-expect-error Testing unknown action type
      const next = gameReducer(state, { type: "UNKNOWN_ACTION" });
      expect(next).toBe(state);
    });
  });
});
