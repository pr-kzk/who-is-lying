import { useCallback, useEffect, useMemo, useRef } from "react";

import { Layout } from "../components/Layout";
import { DIFFICULTY_CONFIGS } from "../config/difficulty";
import { useGameState } from "../hooks/useGameState";
import type { CharacterData, ScoreRecord } from "../types";
import { getRank } from "../utils/scoreCalculator";
import { getTopScores, saveScore } from "../utils/storage";

export function ResultScreen() {
  const { state, dispatch } = useGameState();
  const savedRef = useRef(false);

  const isCorrect = state.isCorrect ?? false;
  const score = state.score ?? 0;
  const turnsUsed = state.turnsUsed;
  const hintsUsed = state.hintsUsed;
  const difficultyConfig = DIFFICULTY_CONFIGS[state.difficulty];

  const { rank, title } = useMemo(() => getRank(score), [score]);

  const turnPenalty = turnsUsed * 50;
  const hintPenalty = hintsUsed * 150;
  const correctBonus = isCorrect ? 500 : 0;
  const rawScore = Math.max(0, 1000 - turnPenalty - hintPenalty + correctBonus);

  const accusedCharacter = useMemo(
    () => state.scenario.characters.find((c: CharacterData) => c.id === state.accusedSuspectId),
    [state.scenario.characters, state.accusedSuspectId],
  );

  const guiltyCharacter = useMemo(
    () =>
      state.scenario.characters.find(
        (c: CharacterData) => c.id === state.scenario.guiltyCharacterId,
      ),
    [state.scenario.characters, state.scenario.guiltyCharacterId],
  );

  // Save score once on mount
  useEffect(() => {
    if (savedRef.current) return;
    savedRef.current = true;

    const record: ScoreRecord = {
      playerName: state.playerName,
      score,
      rank,
      title,
      date: new Date().toISOString(),
      scenarioId: state.scenario.id,
      turnsUsed,
      difficulty: state.difficulty,
    };
    saveScore(record);
  }, [score, rank, title, state.playerName, state.scenario.id, turnsUsed, state.difficulty]);

  const topScores = useMemo(() => getTopScores(5), []);

  const handleReset = useCallback(() => {
    dispatch({ type: "RESET_GAME" });
  }, [dispatch]);

  return (
    <Layout>
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Result header */}
          <div className="text-center animate-[slide-up_0.5s_ease-out]">
            {isCorrect ? (
              <>
                <p className="text-5xl mb-4">🎉</p>
                <h1 className="text-2xl md:text-3xl font-bold text-amber-400 mb-2">
                  正解！ 犯人を見事に暴いた！
                </h1>
              </>
            ) : (
              <>
                <p className="text-5xl mb-4">❌</p>
                <h1 className="text-2xl md:text-3xl font-bold text-red-400 mb-2">
                  不正解… 真犯人に逃げられた…
                </h1>
              </>
            )}
          </div>

          {/* Accused suspect card */}
          {accusedCharacter && (
            <div className="animate-[slide-up_0.5s_ease-out_0.1s_both]">
              <div
                className={`bg-gray-800/70 border rounded-xl p-6 text-center ${
                  isCorrect ? "border-amber-500/50" : "border-red-500/50"
                }`}
              >
                <p className="text-xs text-gray-400 mb-2">あなたが告発した容疑者</p>
                <div className="text-4xl mb-2">{accusedCharacter.emoji}</div>
                <h3 className="text-gray-100 font-bold text-xl mb-1">{accusedCharacter.name}</h3>
                <p className="text-gray-400 text-sm">
                  {accusedCharacter.job} / {accusedCharacter.age}
                </p>
              </div>
            </div>
          )}

          {/* Score breakdown */}
          <div className="animate-[slide-up_0.5s_ease-out_0.2s_both]">
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">
                スコア内訳
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>基礎スコア</span>
                  <span className="font-mono">1000</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>ターン消費（{turnsUsed} x 50）</span>
                  <span className="font-mono text-red-400">-{turnPenalty}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>ヒント使用（{hintsUsed} x 150）</span>
                  <span className="font-mono text-red-400">-{hintPenalty}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>正解ボーナス</span>
                  <span className={`font-mono ${isCorrect ? "text-green-400" : "text-gray-500"}`}>
                    +{correctBonus}
                  </span>
                </div>
                {difficultyConfig.scoreMultiplier !== 1.0 && (
                  <div className="flex justify-between text-gray-300">
                    <span>難易度倍率（{difficultyConfig.label}）</span>
                    <span
                      className={`font-mono ${difficultyConfig.scoreMultiplier > 1 ? "text-green-400" : "text-yellow-400"}`}
                    >
                      x{difficultyConfig.scoreMultiplier}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-700 pt-3 flex justify-between text-gray-100 font-bold text-lg">
                  <span>合計</span>
                  <span className="font-mono text-amber-400">{score}</span>
                </div>
                {difficultyConfig.scoreMultiplier !== 1.0 && (
                  <div className="text-xs text-gray-500 text-right">
                    ({rawScore} x {difficultyConfig.scoreMultiplier} = {score})
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rank */}
          <div className="text-center animate-[slide-up_0.5s_ease-out_0.3s_both]">
            <div className="inline-block bg-gray-800/70 border border-gray-700/50 rounded-xl px-10 py-6">
              <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">ランク</p>
              <p className="text-6xl font-black text-amber-400 mb-1">{rank}</p>
              <p className="text-gray-300 font-medium">{title}</p>
            </div>
          </div>

          {/* Truth section */}
          <div className="animate-[slide-up_0.5s_ease-out_0.35s_both]">
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-amber-400 mb-4 uppercase tracking-wider">
                事件の真相
              </h2>

              {guiltyCharacter && (
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700/50">
                  <span className="text-3xl">{guiltyCharacter.emoji}</span>
                  <div>
                    <p className="text-gray-100 font-bold">{guiltyCharacter.name}</p>
                    <p className="text-red-400 text-xs font-medium">真犯人</p>
                  </div>
                </div>
              )}

              <p className="text-gray-300 text-sm leading-relaxed">
                {state.scenario.contradictionExplanation}
              </p>
            </div>
          </div>

          {/* Leaderboard */}
          {topScores.length > 0 && (
            <div className="animate-[slide-up_0.5s_ease-out_0.4s_both]">
              <h2 className="text-sm font-semibold text-gray-400 mb-3 text-center uppercase tracking-wider">
                Top 5
              </h2>
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg overflow-hidden">
                {topScores.map((record: ScoreRecord, i: number) => (
                  <div
                    key={`${record.playerName}-${record.date}-${i}`}
                    className={`flex items-center justify-between px-4 py-2.5 text-sm ${
                      i > 0 ? "border-t border-gray-700/50" : ""
                    } ${
                      record.playerName === state.playerName && record.score === score
                        ? "bg-amber-900/20"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 w-5 text-right font-mono">{i + 1}</span>
                      <span className="text-gray-200">{record.playerName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {record.difficulty && record.difficulty !== "normal" && (
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            record.difficulty === "easy"
                              ? "bg-green-900/50 text-green-400"
                              : "bg-red-900/50 text-red-400"
                          }`}
                        >
                          {DIFFICULTY_CONFIGS[record.difficulty].label}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">{record.rank}</span>
                      <span className="text-amber-400 font-bold w-16 text-right font-mono">
                        {record.score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reset button */}
          <div className="text-center pb-4 animate-[slide-up_0.5s_ease-out_0.45s_both]">
            <button
              type="button"
              onClick={handleReset}
              className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              もう一度プレイする
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
