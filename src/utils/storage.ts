import type { ScoreRecord } from "../types";

const STORAGE_KEY = "who-is-lying-scores";

export function saveScore(record: ScoreRecord): void {
  try {
    const existing = getTopScores(Infinity);
    existing.push(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // localStorage may be unavailable or full — silently ignore
  }
}

export function getTopScores(limit = 10): ScoreRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Sort descending by score, then ascending by turnsUsed as tiebreaker
    const sorted = (parsed as ScoreRecord[]).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.turnsUsed - b.turnsUsed;
    });
    return sorted.slice(0, limit);
  } catch {
    return [];
  }
}

export function clearScores(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silently ignore
  }
}
