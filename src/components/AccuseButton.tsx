import { useState } from "react";

import type { CharacterData } from "../types";
import { ConfirmModal } from "./ConfirmModal";

interface AccuseButtonProps {
  characters: CharacterData[];
  onAccuse: (suspectId: string) => void;
  disabled: boolean;
}

export function AccuseButton({ characters, onAccuse, disabled }: AccuseButtonProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const selectedCharacter = selectedId ? characters.find((c) => c.id === selectedId) : null;

  function handleSelect(id: string) {
    setSelectedId(id);
  }

  function handleRequestConfirm() {
    if (selectedId) {
      setIsConfirming(true);
    }
  }

  function handleConfirm() {
    if (selectedId) {
      onAccuse(selectedId);
      setSelectedId(null);
      setIsSelecting(false);
      setIsConfirming(false);
    }
  }

  function handleCancelConfirm() {
    setIsConfirming(false);
  }

  function handleClose() {
    setIsSelecting(false);
    setSelectedId(null);
    setIsConfirming(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsSelecting(true)}
        disabled={disabled}
        className="rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/30"
      >
        👮 犯人を指名する
      </button>

      {/* Character selection modal */}
      {isSelecting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-lg w-full p-6 animate-[fade-in_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-100 mb-1">犯人を指名する</h2>
            <p className="text-sm text-gray-400 mb-5">誰が嘘をついていると思いますか？</p>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {characters.map((character) => (
                <button
                  key={character.id}
                  type="button"
                  onClick={() => handleSelect(character.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    selectedId === character.id
                      ? "border-red-500 bg-red-950/30"
                      : "border-gray-700 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800"
                  }`}
                >
                  <span className="text-3xl">{character.emoji}</span>
                  <span className="text-sm font-medium text-gray-100">{character.name}</span>
                  <span className="text-xs text-gray-400">{character.job}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleRequestConfirm}
                disabled={!selectedId}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                この人を指名する
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirming}
        title="本当にこの人物を告発しますか？"
        message={
          selectedCharacter
            ? `${selectedCharacter.emoji} ${selectedCharacter.name}（${selectedCharacter.job}）を犯人として告発します。この判断は取り消せません。`
            : ""
        }
        confirmLabel="告発する"
        cancelLabel="もう少し考える"
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
        variant="danger"
      />
    </>
  );
}
