import { useMemo } from "react";

import { useGame } from "../state/GameContext";
import { calculateScore } from "../utils/scoreCalculator";

const MAX_TURNS = 15;

export function useGameState() {
  const { state, dispatch } = useGame();

  const remainingTurns = MAX_TURNS - state.turnsUsed;

  const currentSuspect = useMemo(
    () => state.scenario.characters.find((c) => c.id === state.currentSuspectId),
    [state.scenario.characters, state.currentSuspectId],
  );

  const currentChatHistory = useMemo(
    () => state.chatHistories[state.currentSuspectId] ?? [],
    [state.chatHistories, state.currentSuspectId],
  );

  const currentSuspectQuestionCount = useMemo(
    () => currentChatHistory.filter((m) => m.role === "user").length,
    [currentChatHistory],
  );

  const canUseHint = currentSuspectQuestionCount >= 5;

  const estimatedScore = useMemo(
    () => calculateScore(state.turnsUsed, state.hintsUsed, true),
    [state.turnsUsed, state.hintsUsed],
  );

  return {
    state,
    dispatch,
    remainingTurns,
    maxTurns: MAX_TURNS,
    currentSuspect,
    currentChatHistory,
    canUseHint,
    estimatedScore,
    currentSuspectQuestionCount,
  };
}
