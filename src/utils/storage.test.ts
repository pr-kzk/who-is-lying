import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import type { ScoreRecord } from "../types";
import { clearScores, getTopScores, saveScore } from "./storage";

const STORAGE_KEY = "who-is-lying-scores";

function createRecord(overrides: Partial<ScoreRecord> = {}): ScoreRecord {
  return {
    playerName: "テスト",
    score: 1000,
    rank: "A",
    title: "優秀な刑事",
    date: "2026-03-19",
    scenarioId: "test",
    turnsUsed: 5,
    ...overrides,
  };
}

describe("storage", () => {
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    vi.spyOn(Storage.prototype, "getItem").mockImplementation((key: string) => store[key] ?? null);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation((key: string, value: string) => {
      store[key] = value;
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation((key: string) => {
      delete store[key];
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("saveScore", () => {
    it("saves a record that can be retrieved", () => {
      const record = createRecord();
      saveScore(record);
      const scores = getTopScores();
      expect(scores).toHaveLength(1);
      expect(scores[0].playerName).toBe("テスト");
    });

    it("appends to existing records", () => {
      saveScore(createRecord({ playerName: "A" }));
      saveScore(createRecord({ playerName: "B" }));
      const scores = getTopScores();
      expect(scores).toHaveLength(2);
    });

    it("silently fails when setItem throws", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
      expect(() => saveScore(createRecord())).not.toThrow();
    });
  });

  describe("getTopScores", () => {
    it("returns empty array when no data stored", () => {
      expect(getTopScores()).toEqual([]);
    });

    it("returns empty array for invalid JSON", () => {
      store[STORAGE_KEY] = "not json";
      expect(getTopScores()).toEqual([]);
    });

    it("returns empty array when stored data is not an array", () => {
      store[STORAGE_KEY] = '{"key": "value"}';
      expect(getTopScores()).toEqual([]);
    });

    it("sorts by score descending", () => {
      store[STORAGE_KEY] = JSON.stringify([
        createRecord({ score: 500, turnsUsed: 3 }),
        createRecord({ score: 1000, turnsUsed: 3 }),
        createRecord({ score: 750, turnsUsed: 3 }),
      ]);
      const scores = getTopScores();
      expect(scores.map((s) => s.score)).toEqual([1000, 750, 500]);
    });

    it("uses turnsUsed as tiebreaker (ascending)", () => {
      store[STORAGE_KEY] = JSON.stringify([
        createRecord({ score: 1000, turnsUsed: 10 }),
        createRecord({ score: 1000, turnsUsed: 3 }),
        createRecord({ score: 1000, turnsUsed: 7 }),
      ]);
      const scores = getTopScores();
      expect(scores.map((s) => s.turnsUsed)).toEqual([3, 7, 10]);
    });

    it("respects default limit of 10", () => {
      const records = Array.from({ length: 12 }, (_, i) =>
        createRecord({ score: i * 100, turnsUsed: i }),
      );
      store[STORAGE_KEY] = JSON.stringify(records);
      expect(getTopScores()).toHaveLength(10);
    });

    it("respects custom limit", () => {
      const records = Array.from({ length: 5 }, (_, i) =>
        createRecord({ score: i * 100, turnsUsed: i }),
      );
      store[STORAGE_KEY] = JSON.stringify(records);
      expect(getTopScores(3)).toHaveLength(3);
    });

    it("returns empty array on localStorage error", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("SecurityError");
      });
      expect(getTopScores()).toEqual([]);
    });
  });

  describe("clearScores", () => {
    it("removes scores from storage", () => {
      saveScore(createRecord());
      clearScores();
      expect(getTopScores()).toEqual([]);
    });

    it("silently handles errors", () => {
      vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
        throw new Error("SecurityError");
      });
      expect(() => clearScores()).not.toThrow();
    });
  });

  describe("edge cases", () => {
    it("getTopScores with limit=0 returns empty array", () => {
      saveScore(createRecord());
      expect(getTopScores(0)).toEqual([]);
    });

    it("saveScore preserves existing records with same name", () => {
      saveScore(createRecord({ playerName: "同じ名前", score: 1000 }));
      saveScore(createRecord({ playerName: "同じ名前", score: 500 }));
      const scores = getTopScores();
      expect(scores).toHaveLength(2);
      expect(scores[0].score).toBe(1000);
      expect(scores[1].score).toBe(500);
    });

    it("handles deeply corrupted records (partial objects)", () => {
      store[STORAGE_KEY] = JSON.stringify([{ playerName: "壊れ" }, null, 42]);
      // Should not throw, even with corrupted data
      expect(() => getTopScores()).not.toThrow();
    });
  });
});
