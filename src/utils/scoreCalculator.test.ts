import { describe, expect, it } from "vite-plus/test";

import { calculateScore, getRank } from "./scoreCalculator";

describe("calculateScore", () => {
  it("returns 1500 for correct answer with 0 turns and 0 hints", () => {
    expect(calculateScore(0, 0, true)).toBe(1500);
  });

  it("returns 1100 for correct answer with 5 turns and 1 hint", () => {
    // 1000 - 250 - 150 + 500 = 1100
    expect(calculateScore(5, 1, true)).toBe(1100);
  });

  it("returns 1000 for incorrect answer with 0 turns and 0 hints", () => {
    expect(calculateScore(0, 0, false)).toBe(1000);
  });

  it("returns 50 for incorrect answer with 10 turns and 3 hints", () => {
    // 1000 - 500 - 450 + 0 = 50
    expect(calculateScore(10, 3, false)).toBe(50);
  });

  it("floors score at 0 when calculation would be negative", () => {
    // 1000 - 1000 - 300 + 0 = -300 → 0
    expect(calculateScore(20, 2, false)).toBe(0);
  });

  it("floors at 0 for very large values", () => {
    expect(calculateScore(100, 100, false)).toBe(0);
  });

  it("floors at 0 for large values even with correct bonus", () => {
    // 1000 - 5000 - 15000 + 500 = -18500 → 0
    expect(calculateScore(100, 100, true)).toBe(0);
  });

  it("calculates correctly at typical game end (15 turns, 2 hints, correct)", () => {
    // 1000 - 750 - 300 + 500 = 450
    expect(calculateScore(15, 2, true)).toBe(450);
  });
});

describe("getRank", () => {
  it("returns S rank for score >= 1200", () => {
    expect(getRank(1200)).toEqual({ rank: "S", title: "天才探偵" });
    expect(getRank(1500)).toEqual({ rank: "S", title: "天才探偵" });
  });

  it("returns A rank for score 900-1199", () => {
    expect(getRank(900)).toEqual({ rank: "A", title: "優秀な刑事" });
    expect(getRank(1199)).toEqual({ rank: "A", title: "優秀な刑事" });
  });

  it("returns B rank for score 600-899", () => {
    expect(getRank(600)).toEqual({ rank: "B", title: "一般捜査官" });
    expect(getRank(899)).toEqual({ rank: "B", title: "一般捜査官" });
  });

  it("returns C rank for score 300-599", () => {
    expect(getRank(300)).toEqual({ rank: "C", title: "見習い探偵" });
    expect(getRank(599)).toEqual({ rank: "C", title: "見習い探偵" });
  });

  it("returns D rank for score 0-299", () => {
    expect(getRank(0)).toEqual({ rank: "D", title: "迷探偵" });
    expect(getRank(299)).toEqual({ rank: "D", title: "迷探偵" });
  });

  it("returns correct rank at exact boundary 1199→A and 1200→S", () => {
    expect(getRank(1199).rank).toBe("A");
    expect(getRank(1200).rank).toBe("S");
  });

  it("returns correct rank at exact boundary 299→D and 300→C", () => {
    expect(getRank(299).rank).toBe("D");
    expect(getRank(300).rank).toBe("C");
  });
});
