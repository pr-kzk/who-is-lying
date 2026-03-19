import { useCallback, useState } from "react";

import { Layout } from "../components/Layout";
import { useGameState } from "../hooks/useGameState";
import { useTypewriter } from "../hooks/useTypewriter";
import type { CharacterData } from "../types";

export function IntroScreen() {
  const { state, dispatch } = useGameState();
  const { introParagraphs, characters } = state.scenario;

  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [completedParagraphs, setCompletedParagraphs] = useState<string[]>([]);
  const [skipped, setSkipped] = useState(false);

  const isAllDone = skipped || currentParagraphIndex >= introParagraphs.length;

  const currentText = isAllDone ? "" : introParagraphs[currentParagraphIndex];
  const { displayedText, isComplete, skip: skipTypewriter } = useTypewriter(currentText, 25);

  const handleAdvance = useCallback(() => {
    if (isAllDone) return;

    if (!isComplete) {
      skipTypewriter();
      return;
    }

    setCompletedParagraphs((prev) => [...prev, introParagraphs[currentParagraphIndex]]);
    setCurrentParagraphIndex((prev) => prev + 1);
  }, [isAllDone, isComplete, skipTypewriter, introParagraphs, currentParagraphIndex]);

  const handleSkipAll = useCallback(() => {
    setCompletedParagraphs(introParagraphs);
    setCurrentParagraphIndex(introParagraphs.length);
    setSkipped(true);
  }, [introParagraphs]);

  const handleProceed = useCallback(() => {
    dispatch({ type: "START_INTERROGATION" });
  }, [dispatch]);

  return (
    <Layout>
      <div className="flex-1 flex flex-col bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 relative">
        {/* Skip button */}
        <button
          type="button"
          onClick={handleSkipAll}
          className="absolute top-4 right-4 z-10 px-4 py-1.5 text-xs text-gray-400 hover:text-gray-200 bg-gray-800/60 hover:bg-gray-800 rounded-full border border-gray-700/50 transition-colors"
        >
          スキップ
        </button>

        {/* Narrative content */}
        <div
          className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full px-6 py-12 cursor-pointer"
          onClick={handleAdvance}
        >
          <div className="space-y-5 mb-8">
            {/* Already completed paragraphs */}
            {completedParagraphs.map((text, i) => (
              <p
                key={i}
                className="text-gray-300 leading-relaxed text-sm md:text-base animate-[fade-in_0.3s_ease-out]"
              >
                {text}
              </p>
            ))}

            {/* Currently typing paragraph */}
            {!isAllDone && (
              <p className="text-gray-100 leading-relaxed text-sm md:text-base">
                {displayedText}
                {!isComplete && (
                  <span className="inline-block w-0.5 h-4 bg-amber-400 ml-0.5 animate-pulse align-text-bottom" />
                )}
              </p>
            )}
          </div>

          {/* Click to continue hint */}
          {!isAllDone && isComplete && (
            <p className="text-gray-600 text-xs text-center animate-pulse">クリックして続ける</p>
          )}
        </div>

        {/* Suspect cards + proceed button */}
        {isAllDone && (
          <div className="px-6 pb-8 animate-[slide-up_0.5s_ease-out]">
            <h2 className="text-center text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">
              容疑者
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
              {characters.map((character: CharacterData) => (
                <div
                  key={character.id}
                  className={`bg-gray-800/70 border border-gray-700/60 rounded-xl p-5 text-center hover:border-${character.color}-500/40 transition-colors`}
                >
                  <div className="text-4xl mb-2">{character.emoji}</div>
                  <h3 className="text-gray-100 font-bold text-lg mb-1">{character.name}</h3>
                  <p className="text-gray-400 text-sm mb-2">
                    {character.job} / {character.age}
                  </p>
                  <p className="text-gray-500 text-xs leading-relaxed">{character.personality}</p>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={handleProceed}
                className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                尋問を開始する
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
