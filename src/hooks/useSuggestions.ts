import { useEffect, useRef, useState } from "react";

import type { CharacterData, ChatMessage, Difficulty, Scenario } from "../types";
import { generateSuggestions } from "../utils/questionSuggester";

export function useSuggestions(
  scenario: Scenario,
  character: CharacterData | undefined,
  chatHistory: ChatMessage[],
  difficulty: Difficulty,
) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Track the last assistant message count to trigger regeneration
  const assistantCount = chatHistory.filter((m) => m.role === "assistant").length;
  const characterId = character?.id;

  useEffect(() => {
    if (difficulty !== "easy" || !character) {
      setSuggestions([]);
      return;
    }

    // Abort previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setSuggestions([]);
    setIsLoading(true);

    generateSuggestions(scenario, character, chatHistory, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setSuggestions(result);
        }
      })
      .catch(() => {
        // Abort or network error — ignore
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
    // Regenerate when suspect changes or after a new assistant response
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, characterId, assistantCount]);

  return { suggestions, isLoadingSuggestions: isLoading };
}
