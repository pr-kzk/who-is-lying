import { useCallback, useEffect, useRef, useState } from "react";

import { streamLLM } from "../api/llm";
import type { ChatMessage } from "../types/index";

export function useLLMChat() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
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
      setStreamingContent(null);

      try {
        const messages = [
          ...chatHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          { role: "user" as const, content: userMessage },
        ];

        let accumulated = "";
        const response = await streamLLM(
          systemPrompt,
          messages,
          (chunk) => {
            accumulated += chunk;
            setStreamingContent(accumulated);
          },
          controller.signal,
        );
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
          setStreamingContent(null);
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

  return { sendMessage, isLoading, error, clearError, streamingContent };
}
