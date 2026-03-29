import { useCallback, useEffect, useRef, useState } from "react";

import { streamLLM } from "../api/llm";
import { AccuseButton } from "../components/AccuseButton";
import { CharacterPanel } from "../components/CharacterPanel";
import { ChatInterface } from "../components/ChatInterface";
import { HintButton } from "../components/HintButton";
import { Layout } from "../components/Layout";
import { ScoreBoard } from "../components/ScoreBoard";
import { SuspectSelector } from "../components/SuspectSelector";
import { useLLMChat } from "../hooks/useLLMChat";
import { useGameState } from "../hooks/useGameState";
import { useSuggestions } from "../hooks/useSuggestions";
import { detectAnxiety } from "../utils/anxietyDetector";
import { buildSystemPrompt } from "../utils/promptBuilder";

export function InterrogationScreen() {
  const {
    state,
    dispatch,
    remainingTurns,
    currentSuspect,
    currentChatHistory,
    canUseHint,
    canRevealNewHint,
    revealedHints,
    canAskAll,
  } = useGameState();
  const { sendMessage, isLoading, error, clearError, streamingContent } = useLLMChat();
  const { suggestions, isLoadingSuggestions } = useSuggestions(
    state.scenario,
    currentSuspect,
    currentChatHistory,
    state.difficulty,
  );

  const streamingSuspectIdRef = useRef<string | null>(null);
  const [loadingSuspectId, setLoadingSuspectId] = useState<string | null>(null);

  const [isAnxious, setIsAnxious] = useState(false);
  const anxietyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [showBackground, setShowBackground] = useState(false);
  const errorToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ask-all state
  const [askAllMode, setAskAllMode] = useState(false);
  const [askAllLoading, setAskAllLoading] = useState<Record<string, boolean>>({});
  const askAllAbortControllersRef = useRef<AbortController[]>([]);
  const [askAllStreaming, setAskAllStreaming] = useState<Record<string, string>>({});

  const isAskAllActive = Object.values(askAllLoading).some(Boolean);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (anxietyTimeoutRef.current) clearTimeout(anxietyTimeoutRef.current);
      if (errorToastTimeoutRef.current) clearTimeout(errorToastTimeoutRef.current);
      for (const controller of askAllAbortControllersRef.current) {
        controller.abort();
      }
    };
  }, []);

  // Show error toast when error changes
  useEffect(() => {
    if (error) {
      setErrorToast(error);
      clearError();
      if (errorToastTimeoutRef.current) clearTimeout(errorToastTimeoutRef.current);
      errorToastTimeoutRef.current = setTimeout(() => {
        setErrorToast(null);
      }, 4000);
    }
  }, [error, clearError]);

  // Turn off askAllMode when canAskAll becomes false
  useEffect(() => {
    if (!canAskAll) setAskAllMode(false);
  }, [canAskAll]);

  const handleSendToAll = useCallback(
    async (userMessage: string) => {
      if (remainingTurns < 2) return;

      // Capture current histories before dispatching
      const capturedHistories = state.chatHistories;
      const characters = state.scenario.characters;

      dispatch({ type: "ADD_USER_MESSAGE_TO_ALL", content: userMessage });

      const loadingState: Record<string, boolean> = {};
      for (const c of characters) {
        loadingState[c.id] = true;
      }
      setAskAllLoading(loadingState);
      setAskAllStreaming({});

      const controllers: AbortController[] = [];
      askAllAbortControllersRef.current = controllers;

      const promises = characters.map(async (character) => {
        const controller = new AbortController();
        controllers.push(controller);

        const systemPrompt = buildSystemPrompt(character, state.scenario, state.difficulty);
        const history = capturedHistories[character.id] ?? [];
        const messages = [
          ...history.map((m) => ({ role: m.role, content: m.content })),
          { role: "user" as const, content: userMessage },
        ];

        let accumulated = "";
        try {
          const response = await streamLLM(
            systemPrompt,
            messages,
            (chunk) => {
              accumulated += chunk;
              setAskAllStreaming((prev) => ({ ...prev, [character.id]: accumulated }));
            },
            controller.signal,
          );

          const triggeredAnxiety = detectAnxiety(response);
          dispatch({
            type: "ADD_ASSISTANT_MESSAGE_FOR_SUSPECT",
            suspectId: character.id,
            content: response,
            triggeredAnxiety,
          });

          if (triggeredAnxiety && character.id === state.currentSuspectId) {
            setIsAnxious(true);
            if (anxietyTimeoutRef.current) clearTimeout(anxietyTimeoutRef.current);
            anxietyTimeoutRef.current = setTimeout(() => {
              setIsAnxious(false);
            }, 1500);
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") return;
          const message = err instanceof Error ? err.message : "エラーが発生しました";
          setErrorToast(`${character.name}: ${message}`);
          if (errorToastTimeoutRef.current) clearTimeout(errorToastTimeoutRef.current);
          errorToastTimeoutRef.current = setTimeout(() => {
            setErrorToast(null);
          }, 4000);
        } finally {
          setAskAllLoading((prev) => ({ ...prev, [character.id]: false }));
        }
      });

      await Promise.allSettled(promises);
      setAskAllStreaming({});
      setAskAllMode(false);
      askAllAbortControllersRef.current = [];
    },
    [remainingTurns, state, dispatch],
  );

  const handleSendMessage = useCallback(
    async (userMessage: string) => {
      if (askAllMode) {
        return handleSendToAll(userMessage);
      }

      if (!currentSuspect || remainingTurns <= 0) return;

      // Capture suspectId before async operation to avoid using stale currentSuspectId
      // if the user switches tabs while waiting for the response
      const suspectId = currentSuspect.id;
      streamingSuspectIdRef.current = suspectId;
      setLoadingSuspectId(suspectId);

      dispatch({ type: "ADD_USER_MESSAGE", content: userMessage });

      const systemPrompt = buildSystemPrompt(currentSuspect, state.scenario, state.difficulty);

      try {
        // Pass currentChatHistory (without the new message) because
        // useLLMChat.sendMessage appends userMessage itself
        const response = await sendMessage(systemPrompt, currentChatHistory, userMessage);
        const triggeredAnxiety = detectAnxiety(response);

        dispatch({
          type: "ADD_ASSISTANT_MESSAGE_FOR_SUSPECT",
          suspectId,
          content: response,
          triggeredAnxiety,
        });

        if (triggeredAnxiety) {
          setIsAnxious(true);
          if (anxietyTimeoutRef.current) clearTimeout(anxietyTimeoutRef.current);
          anxietyTimeoutRef.current = setTimeout(() => {
            setIsAnxious(false);
          }, 1500);
        }
      } catch (err) {
        // AbortError is expected when switching suspects during a request
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Error is already captured by useLLMChat and shown via toast
      } finally {
        setLoadingSuspectId(null);
      }
    },
    [
      askAllMode,
      handleSendToAll,
      currentSuspect,
      remainingTurns,
      dispatch,
      state.scenario,
      state.difficulty,
      currentChatHistory,
      sendMessage,
    ],
  );

  const handleAccuse = useCallback(
    (suspectId: string) => {
      dispatch({ type: "ACCUSE_SUSPECT", suspectId });
    },
    [dispatch],
  );

  const handleUseHint = useCallback(() => {
    dispatch({ type: "USE_HINT" });
  }, [dispatch]);

  const handleToggleAskAll = useCallback(() => {
    setAskAllMode((prev) => !prev);
  }, []);

  if (!currentSuspect) return null;

  // Disable input whenever ANY LLM request is active to prevent aborting in-flight responses
  const inputDisabled = remainingTurns <= 0 || isLoading || isAskAllActive;
  const currentSuspectAskAllLoading = askAllLoading[state.currentSuspectId] ?? false;
  // Typing indicator is only shown for the suspect whose response is being generated
  const effectiveIsLoading =
    (isLoading && streamingSuspectIdRef.current === state.currentSuspectId) ||
    currentSuspectAskAllLoading;
  const effectiveStreamingContent =
    (streamingContent && streamingSuspectIdRef.current === state.currentSuspectId
      ? streamingContent
      : null) ??
    (currentSuspectAskAllLoading ? (askAllStreaming[state.currentSuspectId] ?? null) : null);

  return (
    <Layout>
      <div className="flex-1 flex flex-col bg-gray-950 overflow-hidden">
        {/* Score board */}
        <ScoreBoard />

        {/* Suspect selector */}
        <SuspectSelector askAllLoading={askAllLoading} loadingSuspectId={loadingSuspectId} />

        {/* Main content area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Character panel */}
          <div className="md:w-1/3 shrink-0 border-b md:border-b-0 md:border-r border-gray-800">
            <CharacterPanel character={currentSuspect} isAnxious={isAnxious} />
          </div>

          {/* Chat interface */}
          <div className="flex-1 min-h-0 flex flex-col">
            <ChatInterface
              messages={currentChatHistory}
              onSend={handleSendMessage}
              isLoading={effectiveIsLoading}
              disabled={inputDisabled}
              suspectName={currentSuspect.name}
              streamingContent={effectiveStreamingContent}
              askAllMode={askAllMode}
              onToggleAskAll={handleToggleAskAll}
              canAskAll={canAskAll && !isAskAllActive}
              suggestions={suggestions}
              isLoadingSuggestions={isLoadingSuggestions}
            />
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="border-t border-gray-800 bg-gray-900/80 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setShowBackground(true)}
              className="rounded-xl bg-gray-700 px-5 py-3 text-sm font-bold text-gray-200 hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 shadow-lg"
            >
              📋 事件概要
            </button>
            <HintButton
              canUseHint={canUseHint}
              canRevealNewHint={canRevealNewHint}
              revealedHints={revealedHints}
              totalHints={state.scenario.hints.length}
              onRevealHint={handleUseHint}
              hintsRevealed={state.hintsRevealed}
            />
            <AccuseButton
              characters={state.scenario.characters}
              onAccuse={handleAccuse}
              disabled={isLoading || isAskAllActive}
            />
          </div>
        </div>

        {/* Background modal */}
        {showBackground && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowBackground(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
              className="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col animate-[fade-in_0.2s_ease-out]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 pt-6 pb-4 border-b border-gray-800">
                <h2 className="text-lg font-bold text-gray-100">事件概要</h2>
                <p className="text-sm text-gray-400 mt-1">{state.scenario.title}</p>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {state.scenario.introParagraphs.map((text, i) => (
                  <p key={i} className="text-gray-300 leading-relaxed text-sm">
                    {text}
                  </p>
                ))}
              </div>
              <div className="px-6 py-4 border-t border-gray-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowBackground(false)}
                  className="px-5 py-2 text-sm rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error toast */}
        {errorToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-[slide-up_0.3s_ease-out]">
            <div className="bg-red-900/90 border border-red-700 text-red-200 px-5 py-3 rounded-lg shadow-xl text-sm max-w-md">
              {errorToast}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
