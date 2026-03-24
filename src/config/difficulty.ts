import type { Difficulty } from "../types";

export interface DifficultyConfig {
  label: string;
  description: string;
  maxTurns: number;
  hintUnlockThreshold: number;
  scoreMultiplier: number;
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: "イージー",
    description: "容疑者は緊張しやすく、ボロが出やすい",
    maxTurns: 20,
    hintUnlockThreshold: 3,
    scoreMultiplier: 0.8,
  },
  normal: {
    label: "ノーマル",
    description: "標準的な難易度",
    maxTurns: 15,
    hintUnlockThreshold: 5,
    scoreMultiplier: 1.0,
  },
  hard: {
    label: "ハード",
    description: "容疑者は冷静で矛盾を隠すのが上手い",
    maxTurns: 12,
    hintUnlockThreshold: 7,
    scoreMultiplier: 1.5,
  },
};
