import { useCallback, useEffect, useRef, useState } from "react";

import { callClaudeAPI } from "../api/claude";
import type { ChatMessage } from "../types/index";

export function useClaudeChat() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const sendMessage = useCallback(
    async (
      systemPrompt: string,
      chatHistory: ChatMessage[],
      userMessage: string,
    ): Promise<string> => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setError(null);

      try {
        const messages = [
          ...chatHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          { role: "user" as const, content: userMessage },
        ];

        const response = await callClaudeAPI(systemPrompt, messages, controller.signal);
        return response;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          throw err;
        }
        const message = err instanceof Error ? err.message : "An unexpected error occurred";
        setError(message);
        throw err;
      } finally {
        if (abortControllerRef.current === controller) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return { sendMessage, isLoading, error, clearError };
}
