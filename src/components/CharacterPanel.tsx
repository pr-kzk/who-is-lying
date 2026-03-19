import type { CharacterData } from "../types";

interface CharacterPanelProps {
  character: CharacterData;
  isAnxious: boolean;
}

export function CharacterPanel({ character, isAnxious }: CharacterPanelProps) {
  return (
    <div className="flex flex-col items-center py-4 px-3 md:py-6">
      {/* Character emoji with animations */}
      <div className="relative">
        <span
          className={`text-5xl md:text-7xl block ${
            isAnxious ? "animate-[shake_0.5s_ease-in-out_infinite]" : ""
          }`}
        >
          {character.emoji}
        </span>

        {/* Sweat drop overlay */}
        {isAnxious && (
          <span className="absolute -top-1 -right-2 text-xl animate-[sweat-drop_1.5s_ease-in-out_infinite]">
            💧
          </span>
        )}
      </div>

      {/* Character info */}
      <div className="mt-3 text-center">
        <p className="font-bold text-base md:text-lg text-gray-100">{character.name}</p>
        <p className="text-xs md:text-sm text-gray-400">{character.job}</p>
      </div>
    </div>
  );
}
