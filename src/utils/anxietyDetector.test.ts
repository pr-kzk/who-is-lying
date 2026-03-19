import { describe, expect, it } from "vite-plus/test";

import { detectAnxiety } from "./anxietyDetector";

describe("detectAnxiety", () => {
  it("returns true when text contains an anxiety phrase", () => {
    expect(detectAnxiety("それは…よくわかりません")).toBe(true);
  });

  it("returns true when text is exactly an anxiety phrase", () => {
    expect(detectAnxiety("えっと")).toBe(true);
  });

  it("returns true when anxiety phrase is embedded in a longer sentence", () => {
    expect(detectAnxiety("私はその日、ちょっと待ってください、思い出します")).toBe(true);
  });

  it("returns false for text with no anxiety phrases", () => {
    expect(detectAnxiety("私は無実です。その日は自宅にいました。")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(detectAnxiety("")).toBe(false);
  });

  it("returns true when multiple anxiety phrases are present", () => {
    expect(detectAnxiety("あの…それは…覚えていません")).toBe(true);
  });

  it("returns true for stuttering patterns", () => {
    expect(detectAnxiety("そ、それは違います")).toBe(true);
    expect(detectAnxiety("い、いえ、そんなことは")).toBe(true);
    expect(detectAnxiety("ち、違うんです")).toBe(true);
  });

  it("returns true for hesitation phrases", () => {
    expect(detectAnxiety("なぜそんなことを聞くんですか")).toBe(true);
  });

  it("detects each individual anxiety word from the data file", async () => {
    const { anxietyWords } = await import("../data/anxietyWords");
    for (const word of anxietyWords) {
      expect(detectAnxiety(`容疑者の回答: ${word} そうですね`)).toBe(true);
    }
  });
});
