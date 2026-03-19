import { useState } from "react";

interface HintButtonProps {
  canUseHint: boolean;
  hintText: string;
  onUseHint: () => void;
  hintsUsed: number;
}

export function HintButton({ canUseHint, hintText, onUseHint, hintsUsed }: HintButtonProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  if (!canUseHint) return null;

  function handleClick() {
    if (isRevealed) return;
    setIsRevealed(true);
    onUseHint();
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleClick}
        disabled={isRevealed}
        className="rounded-lg bg-amber-900/50 border border-amber-700/50 px-4 py-2 text-sm text-amber-300 hover:bg-amber-900/80 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-70 disabled:cursor-default"
      >
        {isRevealed ? `💡 ヒント (${hintsUsed}回使用)` : "💡 ヒントを使う -150pt"}
      </button>

      {/* Hint popover */}
      {isRevealed && (
        <div className="absolute left-0 right-0 mt-2 p-3 bg-gray-800 border border-amber-700/40 rounded-lg shadow-lg text-sm text-amber-200 leading-relaxed animate-[fade-in_0.3s_ease-out] z-10 min-w-[250px]">
          {hintText}
        </div>
      )}
    </div>
  );
}
