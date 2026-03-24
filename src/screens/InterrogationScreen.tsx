import { useCallback, useEffect, useRef, useState } from "react";

import { AccuseButton } from "../components/AccuseButton";
import { CharacterPanel } from "../components/CharacterPanel";
import { ChatInterface } from "../components/ChatInterface";
import { HintButton } from "../components/HintButton";
import { Layout } from "../components/Layout";
import { ScoreBoard } from "../components/ScoreBoard";
import { SuspectSelector } from "../components/SuspectSelector";
import { useLLMChat } from "../hooks/useLLMChat";
import { useGameState } from "../hooks/useGameState";
import { detectAnxiety } from "../utils/anxietyDetector";
import { buildSystemPrompt } from "../utils/promptBuilder";

export function InterrogationScreen() {
  const { state, dispatch, remainingTurns, currentSuspect, currentChatHistory, canUseHint } =
    useGameState();
  const { sendMessage, isLoading, error, clearError, streamingContent } = useLLMChat();

  const [isAnxious, setIsAnxious] = useState(false);
  const anxietyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const errorToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (anxietyTimeoutRef.current) clearTimeout(anxietyTimeoutRef.current);
      if (errorToastTimeoutRef.current) clearTimeout(errorToastTimeoutRef.current);
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

  const handleSendMessage = useCallback(
    async (userMessage: string) => {
      if (!currentSuspect || remainingTurns <= 0) return;

      dispatch({ type: "ADD_USER_MESSAGE", content: userMessage });

      const systemPrompt = buildSystemPrompt(currentSuspect, state.scenario, state.difficulty);

      try {
        // Pass currentChatHistory (without the new message) because
        // useLLMChat.sendMessage appends userMessage itself
        const response = await sendMessage(systemPrompt, currentChatHistory, userMessage);
        const triggeredAnxiety = detectAnxiety(response);

        dispatch({
          type: "ADD_ASSISTANT_MESSAGE",
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
      }
    },
    [currentSuspect, remainingTurns, dispatch, state.scenario, currentChatHistory, sendMessage],
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

  if (!currentSuspect) return null;

  const inputDisabled = remainingTurns <= 0;

  return (
    <Layout>
      <div className="flex-1 flex flex-col bg-gray-950 overflow-hidden">
        {/* Score board */}
        <ScoreBoard />

        {/* Suspect selector */}
        <SuspectSelector />

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
              isLoading={isLoading}
              disabled={inputDisabled}
              suspectName={currentSuspect.name}
              streamingContent={streamingContent}
            />
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="border-t border-gray-800 bg-gray-900/80 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <HintButton
              canUseHint={canUseHint}
              hintText={state.scenario.hintText}
              onUseHint={handleUseHint}
              hintsUsed={state.hintsUsed}
            />
            <AccuseButton
              characters={state.scenario.characters}
              onAccuse={handleAccuse}
              disabled={isLoading}
            />
          </div>
        </div>

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
