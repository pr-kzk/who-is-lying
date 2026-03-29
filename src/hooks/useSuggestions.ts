import { useEffect, useRef, useState } from "react";

import type { CharacterData, ChatMessage, Difficulty, Scenario } from "../types";
import { generateSuggestions } from "../utils/questionSuggester";

type CacheEntry = { suggestions: string[]; assistantCount: number };
type PendingEntry = { controller: AbortController; assistantCount: number };

export function useSuggestions(
  scenario: Scenario,
  character: CharacterData | undefined,
  chatHistory: ChatMessage[],
  difficulty: Difficulty,
) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const cacheRef = useRef<Record<string, CacheEntry>>({});
  const pendingRef = useRef<Record<string, PendingEntry>>({});
  // Always reflects the currently displayed character
  const currentCharIdRef = useRef<string | undefined>(undefined);

  // Track the last assistant message count to trigger regeneration
  const assistantCount = chatHistory.filter((m) => m.role === "assistant").length;
  const characterId = character?.id;

  useEffect(() => {
    currentCharIdRef.current = characterId;
  });

  useEffect(() => {
    if (difficulty !== "easy" || !character || !characterId) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    // Use cache if suggestions were already generated for this character at this assistantCount
    const cached = cacheRef.current[characterId];
    if (cached && cached.assistantCount === assistantCount) {
      setSuggestions(cached.suggestions);
      setIsLoading(false);
      return;
    }

    // If a request is already in flight for this character at this assistantCount, just show loading
    const existing = pendingRef.current[characterId];
    if (
      existing &&
      !existing.controller.signal.aborted &&
      existing.assistantCount === assistantCount
    ) {
      setSuggestions([]);
      setIsLoading(true);
      return;
    }

    // Abort stale pending request for this character (different assistantCount)
    existing?.controller.abort();
    delete pendingRef.current[characterId];

    const controller = new AbortController();
    pendingRef.current[characterId] = { controller, assistantCount };

    setSuggestions([]);
    setIsLoading(true);

    const capturedCharId = characterId;
    generateSuggestions(scenario, character, chatHistory, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          cacheRef.current[capturedCharId] = { suggestions: result, assistantCount };
          delete pendingRef.current[capturedCharId];
          // Only update UI if this character is still the active tab
          if (currentCharIdRef.current === capturedCharId) {
            setSuggestions(result);
            setIsLoading(false);
          }
        }
      })
      .catch(() => {
        if (!controller.signal.aborted && currentCharIdRef.current === capturedCharId) {
          setIsLoading(false);
        }
      });

    return () => {
      // Do not abort on tab switch — let the request complete in the background and cache the result
    };
    // Regenerate only after a new assistant response; use cache on tab switch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, characterId, assistantCount]);

  return { suggestions, isLoadingSuggestions: isLoading };
}
