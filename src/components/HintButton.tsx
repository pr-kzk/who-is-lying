import { useState } from "react";

interface HintButtonProps {
  canUseHint: boolean;
  canRevealNewHint: boolean;
  revealedHints: string[];
  totalHints: number;
  onRevealHint: () => void;
  hintsRevealed: number;
}

export function HintButton({
  canUseHint,
  canRevealNewHint,
  revealedHints,
  totalHints,
  onRevealHint,
  hintsRevealed,
}: HintButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!canUseHint) return null;

  function handleClick() {
    if (hintsRevealed === 0 && canRevealNewHint) {
      onRevealHint();
      setIsOpen(true);
    } else {
      setIsOpen((prev) => !prev);
    }
  }

  function handleRevealNew() {
    onRevealHint();
  }

  const buttonLabel =
    hintsRevealed === 0 ? "💡 ヒントを使う -150pt" : `💡 ヒント (${hintsRevealed}/${totalHints})`;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleClick}
        className="rounded-lg bg-amber-900/50 border border-amber-700/50 px-4 py-2 text-sm text-amber-300 hover:bg-amber-900/80 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        {buttonLabel}
      </button>

      {isOpen && hintsRevealed > 0 && (
        <div className="absolute left-0 bottom-full mb-2 p-3 bg-gray-800 border border-amber-700/40 rounded-lg shadow-lg text-sm text-amber-200 leading-relaxed animate-[fade-in_0.3s_ease-out] z-10 min-w-[280px]">
          <div className="space-y-2">
            {revealedHints.map((hint, i) => (
              <div key={i} className="flex gap-2">
                <span className="shrink-0 text-amber-400 font-bold">#{i + 1}</span>
                <span>{hint}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-2 border-t border-amber-700/30">
            {hintsRevealed >= totalHints ? (
              <span className="text-xs text-gray-400">全ヒント公開済み</span>
            ) : canRevealNewHint ? (
              <button
                type="button"
                onClick={handleRevealNew}
                className="w-full rounded bg-amber-800/60 border border-amber-600/40 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-800/90 transition-colors"
              >
                次のヒントを見る -150pt
              </button>
            ) : (
              <span className="text-xs text-gray-400">次のターンでヒントが使えます</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
