import { useCallback, useEffect, useRef, useState } from "react";

import type { ChatMessage } from "../types";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled: boolean;
  suspectName: string;
  streamingContent: string | null;
  askAllMode: boolean;
  onToggleAskAll: () => void;
  canAskAll: boolean;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 bg-gray-500 rounded-full animate-[typing-dot_1.4s_ease-in-out_infinite]"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

export function ChatInterface({
  messages,
  onSend,
  isLoading,
  disabled,
  suspectName,
  streamingContent,
  askAllMode,
  onToggleAskAll,
  canAskAll,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const isNearBottom = useCallback(() => {
    const el = scrollAreaRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  // Scroll on new messages or loading state change.
  useEffect(() => {
    if (isNearBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isLoading, isNearBottom]);

  // Scroll during streaming — throttled to avoid excessive calls.
  const lastScrollRef = useRef(0);
  useEffect(() => {
    if (!streamingContent) return;
    const now = Date.now();
    if (now - lastScrollRef.current < 100) return;
    lastScrollRef.current = now;
    if (isNearBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [streamingContent, isNearBottom]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isLoading || disabled) return;
    onSend(trimmed);
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Messages area */}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && !isLoading && (
          <p className="text-center text-gray-600 text-sm py-8">
            {suspectName} に質問してみましょう
          </p>
        )}

        {messages.map((msg, index) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={`${index}-${msg.timestamp}`}
              className={`flex ${isUser ? "justify-end animate-[fade-in_0.3s_ease-out]" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  isUser
                    ? "bg-blue-600 text-white rounded-br-md"
                    : "bg-gray-800 text-gray-200 rounded-bl-md"
                }`}
              >
                {!isUser && <p className="text-xs text-gray-500 mb-1 font-medium">{suspectName}</p>}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start animate-[fade-in_0.2s_ease-out]">
            <div className="max-w-[80%] bg-gray-800 text-gray-200 rounded-2xl rounded-bl-md px-4 py-2.5 text-sm leading-relaxed">
              <p className="text-xs text-gray-500 mb-1 font-medium">{suspectName}</p>
              {streamingContent ? (
                <p className="whitespace-pre-wrap">{streamingContent}</p>
              ) : (
                <TypingIndicator />
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-800 p-3">
        <div className="max-w-3xl mx-auto space-y-2">
          <div className="flex items-center">
            <button
              type="button"
              onClick={onToggleAskAll}
              disabled={!canAskAll || isLoading || disabled}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                askAllMode
                  ? "bg-amber-600/80 border-amber-500 text-amber-100"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-300 hover:border-gray-600"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              全員に質問（2ターン）
            </button>
          </div>
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={disabled ? "質問できません" : "質問を入力してください..."}
              disabled={isLoading || disabled}
              rows={1}
              className="flex-1 resize-none rounded-xl bg-gray-800 border border-gray-700 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={isLoading || disabled || !input.trim()}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                askAllMode ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {askAllMode ? "全員に送信" : "送信"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
