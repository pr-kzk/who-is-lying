import type { ChatMessage, Difficulty, GameState, Scenario } from "../types/index";
import { DIFFICULTY_CONFIGS } from "../config/difficulty";
import { calculateScore } from "../utils/scoreCalculator";

export type GameAction =
  | { type: "START_GAME"; scenario: Scenario; playerName: string; difficulty: Difficulty }
  | { type: "START_INTERROGATION" }
  | { type: "SELECT_SUSPECT"; suspectId: string }
  | { type: "ADD_USER_MESSAGE"; content: string }
  | {
      type: "ADD_ASSISTANT_MESSAGE";
      content: string;
      triggeredAnxiety: boolean;
    }
  | { type: "USE_HINT" }
  | { type: "ACCUSE_SUSPECT"; suspectId: string }
  | { type: "RESET_GAME" };

const dummyScenario: Scenario = {
  id: "",
  title: "",
  crimeType: "",
  setting: "",
  crimeTime: "",
  introParagraphs: [],
  characters: [
    {
      id: "dummy-1",
      name: "",
      job: "",
      age: "",
      personality: "",
      personalSecret: "",
      emoji: "",
      color: "",
      guilty: false,
      alibiTruth: "",
    },
    {
      id: "dummy-2",
      name: "",
      job: "",
      age: "",
      personality: "",
      personalSecret: "",
      emoji: "",
      color: "",
      guilty: false,
      alibiTruth: "",
    },
    {
      id: "dummy-3",
      name: "",
      job: "",
      age: "",
      personality: "",
      personalSecret: "",
      emoji: "",
      color: "",
      guilty: false,
      alibiTruth: "",
    },
  ],
  guiltyCharacterId: "",
  contradictionExplanation: "",
  hintText: "",
};

export const initialGameState: GameState = {
  phase: "start",
  scenario: dummyScenario,
  currentSuspectId: "",
  chatHistories: {},
  turnsUsed: 0,
  hintsUsed: 0,
  accusedSuspectId: null,
  isCorrect: null,
  score: null,
  playerName: "",
  difficulty: "normal",
};

function createChatMessage(
  role: ChatMessage["role"],
  content: string,
  triggeredAnxiety: boolean,
): ChatMessage {
  return {
    role,
    content,
    timestamp: Date.now(),
    triggeredAnxiety,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME": {
      const chatHistories: Record<string, ChatMessage[]> = {};
      for (const character of action.scenario.characters) {
        chatHistories[character.id] = [];
      }
      return {
        ...initialGameState,
        phase: "intro",
        scenario: action.scenario,
        playerName: action.playerName,
        difficulty: action.difficulty,
        chatHistories,
      };
    }

    case "START_INTERROGATION": {
      return {
        ...state,
        phase: "interrogation",
        currentSuspectId: state.scenario.characters[0].id,
      };
    }

    case "SELECT_SUSPECT": {
      if (action.suspectId === state.currentSuspectId) {
        return state;
      }
      return {
        ...state,
        currentSuspectId: action.suspectId,
        turnsUsed: state.turnsUsed + 1,
      };
    }

    case "ADD_USER_MESSAGE": {
      const message = createChatMessage("user", action.content, false);
      const currentHistory = state.chatHistories[state.currentSuspectId] ?? [];
      return {
        ...state,
        chatHistories: {
          ...state.chatHistories,
          [state.currentSuspectId]: [...currentHistory, message],
        },
        turnsUsed: state.turnsUsed + 1,
      };
    }

    case "ADD_ASSISTANT_MESSAGE": {
      const message = createChatMessage("assistant", action.content, action.triggeredAnxiety);
      const currentHistory = state.chatHistories[state.currentSuspectId] ?? [];
      return {
        ...state,
        chatHistories: {
          ...state.chatHistories,
          [state.currentSuspectId]: [...currentHistory, message],
        },
      };
    }

    case "USE_HINT": {
      return {
        ...state,
        hintsUsed: state.hintsUsed + 1,
      };
    }

    case "ACCUSE_SUSPECT": {
      const isCorrect = action.suspectId === state.scenario.guiltyCharacterId;
      const { scoreMultiplier } = DIFFICULTY_CONFIGS[state.difficulty];
      const score = calculateScore(state.turnsUsed, state.hintsUsed, isCorrect, scoreMultiplier);
      return {
        ...state,
        phase: "result",
        accusedSuspectId: action.suspectId,
        isCorrect,
        score,
      };
    }

    case "RESET_GAME": {
      return { ...initialGameState };
    }

    default: {
      action satisfies never;
      return state;
    }
  }
}
