import { useGameState } from "../hooks/useGameState";

export function ScoreBoard() {
  const { remainingTurns, maxTurns, estimatedScore, state } = useGameState();

  const isLowTurns = remainingTurns <= 3;

  return (
    <div className="w-full bg-gray-900/80 border-b border-gray-800 px-4 py-3">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
        {/* Remaining turns */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">残り質問回数</span>
          <span
            className={`font-bold text-lg ${
              isLowTurns
                ? "text-red-400 animate-[pulse-red_1s_ease-in-out_infinite]"
                : "text-gray-100"
            }`}
          >
            {remainingTurns}
          </span>
          <span className="text-gray-600 text-xs">/ {maxTurns}</span>
        </div>

        {/* Estimated score */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">スコア推定値</span>
          <span className="font-bold text-lg text-amber-400">{estimatedScore}</span>
          <span className="text-gray-600 text-xs">pt</span>
        </div>

        {/* Hints used */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">ヒント使用回数</span>
          <span className="font-bold text-lg text-purple-400">{state.hintsUsed}</span>
        </div>
      </div>
    </div>
  );
}
