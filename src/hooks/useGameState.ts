import { useMemo } from "react";

import { DIFFICULTY_CONFIGS } from "../config/difficulty";
import { useGame } from "../state/GameContext";
import { calculateScore } from "../utils/scoreCalculator";

export function useGameState() {
  const { state, dispatch } = useGame();

  const difficultyConfig = DIFFICULTY_CONFIGS[state.difficulty];
  const maxTurns = difficultyConfig.maxTurns;
  const remainingTurns = maxTurns - state.turnsUsed;

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

  const canUseHint = currentSuspectQuestionCount >= difficultyConfig.hintUnlockThreshold;
  const canRevealNewHint =
    canUseHint &&
    state.hintsRevealed < state.scenario.hints.length &&
    (state.lastHintTurn === null || state.turnsUsed > state.lastHintTurn);
  const revealedHints = useMemo(
    () => state.scenario.hints.slice(0, state.hintsRevealed),
    [state.scenario.hints, state.hintsRevealed],
  );
  const canAskAll = remainingTurns >= 2;

  const estimatedScore = useMemo(
    () =>
      calculateScore(state.turnsUsed, state.hintsRevealed, true, difficultyConfig.scoreMultiplier),
    [state.turnsUsed, state.hintsRevealed, difficultyConfig.scoreMultiplier],
  );

  return {
    state,
    dispatch,
    remainingTurns,
    maxTurns,
    currentSuspect,
    currentChatHistory,
    canUseHint,
    canRevealNewHint,
    revealedHints,
    canAskAll,
    estimatedScore,
    currentSuspectQuestionCount,
  };
}
