import { describe, expect, it } from "vite-plus/test";

import type { GuiltyCharacterData, InnocentCharacterData, Scenario } from "../types";
import { buildGuiltyPrompt, buildInnocentPrompt, buildSystemPrompt } from "./promptBuilder";

const guiltyCharacter: GuiltyCharacterData = {
  id: "test-guilty",
  name: "山田太郎",
  job: "会社員",
  age: "30代男性",
  personality: "慎重で几帳面",
  personalSecret: "借金を抱えている",
  emoji: "👤",
  color: "blue",
  guilty: true,
  alibiLie: "自宅でテレビを見ていた",
  contradiction: "番組名を間違えた",
  crimeDetail: "金庫から現金を盗んだ",
};

const innocentCharacter: InnocentCharacterData = {
  id: "test-innocent",
  name: "佐藤花子",
  job: "教師",
  age: "40代女性",
  personality: "明るく社交的",
  personalSecret: "転職を考えている",
  emoji: "👩",
  color: "rose",
  guilty: false,
  alibiTruth: "友人と食事をしていた",
};

const scenario: Scenario = {
  id: "test-scenario",
  title: "消えた宝石",
  crimeType: "窃盗",
  setting: "宝石店",
  crimeTime: "21:00〜23:00",
  introParagraphs: ["テスト用のイントロ"],
  characters: [guiltyCharacter, innocentCharacter, innocentCharacter],
  guiltyCharacterId: "test-guilty",
  contradictionExplanation: "テスト用の矛盾説明",
  hints: ["テスト用のヒント"],
};

describe("buildGuiltyPrompt", () => {
  const prompt = buildGuiltyPrompt(guiltyCharacter, scenario, "normal");

  it("contains character details", () => {
    expect(prompt).toContain("山田太郎");
    expect(prompt).toContain("会社員");
    expect(prompt).toContain("30代男性");
    expect(prompt).toContain("慎重で几帳面");
  });

  it("contains scenario details", () => {
    expect(prompt).toContain("宝石店");
    expect(prompt).toContain("消えた宝石");
    expect(prompt).toContain("窃盗");
    expect(prompt).toContain("21:00〜23:00");
  });

  it("contains crime-specific fields", () => {
    expect(prompt).toContain("金庫から現金を盗んだ");
    expect(prompt).toContain("自宅でテレビを見ていた");
    expect(prompt).toContain("番組名を間違えた");
    expect(prompt).toContain("借金を抱えている");
  });

  it("contains guilty instruction keywords", () => {
    expect(prompt).toContain("真犯人");
    expect(prompt).toContain("絶対に認めず");
  });
});

describe("buildInnocentPrompt", () => {
  const prompt = buildInnocentPrompt(innocentCharacter, scenario, "normal");

  it("contains character details", () => {
    expect(prompt).toContain("佐藤花子");
    expect(prompt).toContain("教師");
    expect(prompt).toContain("40代女性");
    expect(prompt).toContain("明るく社交的");
  });

  it("contains alibi and secret", () => {
    expect(prompt).toContain("友人と食事をしていた");
    expect(prompt).toContain("転職を考えている");
  });

  it("contains innocent instruction keywords", () => {
    expect(prompt).toContain("無実の人物");
  });

  it("does not contain guilty keywords", () => {
    expect(prompt).not.toContain("真犯人");
  });
});

describe("buildSystemPrompt", () => {
  it("dispatches to guilty prompt for guilty character", () => {
    const prompt = buildSystemPrompt(guiltyCharacter, scenario, "normal");
    expect(prompt).toContain("真犯人");
  });

  it("dispatches to innocent prompt for innocent character", () => {
    const prompt = buildSystemPrompt(innocentCharacter, scenario, "normal");
    expect(prompt).toContain("無実");
    expect(prompt).not.toContain("真犯人");
  });
});
