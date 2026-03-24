import { useCallback, useMemo, useState } from "react";

import { Layout } from "../components/Layout";
import { DIFFICULTY_CONFIGS } from "../config/difficulty";
import { scenarios } from "../data/scenarios";
import { useGameState } from "../hooks/useGameState";
import type { Difficulty, ScoreRecord } from "../types";
import { getTopScores } from "../utils/storage";

const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard"];

export function StartScreen() {
  const { dispatch } = useGameState();
  const [playerName, setPlayerName] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [selectedScenarioId] = useState(
    () => scenarios[Math.floor(Math.random() * scenarios.length)].id,
  );

  const topScores = useMemo(() => getTopScores(5), []);

  const selectedScenario = useMemo(
    () => scenarios.find((s) => s.id === selectedScenarioId) ?? scenarios[0],
    [selectedScenarioId],
  );

  const handleStart = useCallback(() => {
    const trimmed = playerName.trim();
    if (!trimmed) return;
    dispatch({ type: "START_GAME", scenario: selectedScenario, playerName: trimmed, difficulty });
  }, [dispatch, playerName, difficulty, selectedScenario]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleStart();
      }
    },
    [handleStart],
  );

  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center px-4 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
        {/* Title */}
        <div className="text-center mb-10 animate-[slide-up_0.6s_ease-out]">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-100 mb-3 tracking-tight">
            <span className="mr-2">🔍</span>容疑者AIの供述
          </h1>
          <p className="text-lg md:text-xl text-amber-400 font-medium">矛盾を探せ</p>
        </div>

        {/* Input area */}
        <div className="w-full max-w-sm mb-12 animate-[slide-up_0.6s_ease-out_0.15s_both]">
          <label htmlFor="player-name" className="block text-sm text-gray-400 mb-2">
            探偵名を入力
          </label>
          <input
            id="player-name"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="あなたの名前..."
            maxLength={20}
            autoFocus
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-shadow"
          />

          {/* Difficulty selector */}
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-2">難易度を選択</p>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTIES.map((d) => {
                const config = DIFFICULTY_CONFIGS[d];
                const isActive = difficulty === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                      isActive
                        ? "border-amber-500 bg-amber-600/20 text-amber-300"
                        : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    <div className="font-bold">{config.label}</div>
                    <div className="text-xs mt-0.5 opacity-70">{config.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleStart}
            disabled={!playerName.trim()}
            className="w-full mt-4 px-6 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            ゲームスタート
          </button>
        </div>

        {/* Top scores */}
        {topScores.length > 0 && (
          <div className="w-full max-w-sm animate-[slide-up_0.6s_ease-out_0.3s_both]">
            <h2 className="text-sm font-semibold text-gray-400 mb-3 text-center uppercase tracking-wider">
              Top Scores
            </h2>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg overflow-hidden">
              {topScores.map((record: ScoreRecord, i: number) => (
                <div
                  key={`${record.playerName}-${record.date}-${i}`}
                  className={`flex items-center justify-between px-4 py-2.5 text-sm ${
                    i > 0 ? "border-t border-gray-700/50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 w-5 text-right font-mono">{i + 1}</span>
                    <span className="text-gray-200">{record.playerName}</span>
                  </div>
                  <div className="flex items-center gap-3">
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
      </div>
    </Layout>
  );
}
