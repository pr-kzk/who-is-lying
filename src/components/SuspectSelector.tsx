import { useState } from "react";

import { useGameState } from "../hooks/useGameState";
import { ConfirmModal } from "./ConfirmModal";

const colorMap: Record<string, string> = {
  blue: "border-blue-500",
  rose: "border-rose-500",
  emerald: "border-emerald-500",
  amber: "border-amber-500",
  purple: "border-purple-500",
  cyan: "border-cyan-500",
  red: "border-red-500",
  green: "border-green-500",
  yellow: "border-yellow-500",
  pink: "border-pink-500",
  indigo: "border-indigo-500",
  orange: "border-orange-500",
};

export function SuspectSelector() {
  const { state, dispatch, remainingTurns } = useGameState();
  const [pendingSuspectId, setPendingSuspectId] = useState<string | null>(null);

  function handleSelect(suspectId: string) {
    if (suspectId === state.currentSuspectId) return;

    if (remainingTurns <= 3) {
      setPendingSuspectId(suspectId);
    } else {
      dispatch({ type: "SELECT_SUSPECT", suspectId });
    }
  }

  function handleConfirmSwitch() {
    if (pendingSuspectId) {
      dispatch({ type: "SELECT_SUSPECT", suspectId: pendingSuspectId });
      setPendingSuspectId(null);
    }
  }

  return (
    <>
      <div className="flex w-full border-b border-gray-800">
        {state.scenario.characters.map((character) => {
          const isActive = character.id === state.currentSuspectId;
          const messageCount = (state.chatHistories[character.id] ?? []).filter(
            (m) => m.role === "user",
          ).length;
          const borderColor = colorMap[character.color] ?? "border-gray-500";

          return (
            <button
              key={character.id}
              type="button"
              onClick={() => handleSelect(character.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors relative ${
                isActive
                  ? `border-b-2 ${borderColor} bg-gray-900/50 text-gray-100`
                  : "border-b-2 border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-900/30"
              }`}
            >
              <span className="text-lg">{character.emoji}</span>
              <span>{character.name}</span>
              {messageCount > 0 && (
                <span className="absolute top-1 right-2 bg-gray-700 text-gray-300 text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {messageCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <ConfirmModal
        isOpen={pendingSuspectId !== null}
        title="容疑者を切り替えますか？"
        message="残り質問回数が少なくなっています。切り替えると1ターン消費します。"
        confirmLabel="切り替える"
        cancelLabel="やめる"
        onConfirm={handleConfirmSwitch}
        onCancel={() => setPendingSuspectId(null)}
        variant="danger"
      />
    </>
  );
}
