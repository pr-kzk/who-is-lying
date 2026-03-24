import type { GameAction } from "../state/gameReducer";
import type { Scenario } from "../types";

export const testScenario: Scenario = {
  id: "test-scenario",
  title: "テスト事件",
  crimeType: "窃盗",
  setting: "テストビル",
  crimeTime: "20:00",
  introParagraphs: ["段落1", "段落2", "段落3"],
  characters: [
    {
      id: "char-a",
      name: "A太郎",
      job: "会計士",
      age: "40代",
      personality: "几帳面",
      personalSecret: "秘密A",
      emoji: "👔",
      color: "blue",
      guilty: false,
      alibiTruth: "自宅にいた",
    },
    {
      id: "char-b",
      name: "B子",
      job: "秘書",
      age: "30代",
      personality: "明るい",
      personalSecret: "秘密B",
      emoji: "💼",
      color: "rose",
      guilty: true,
      alibiLie: "レストランにいた",
      contradiction: "矛盾点",
      crimeDetail: "PCを盗んだ",
    },
    {
      id: "char-c",
      name: "C太",
      job: "エンジニア",
      age: "20代",
      personality: "無口",
      personalSecret: "秘密C",
      emoji: "🖥️",
      color: "emerald",
      guilty: false,
      alibiTruth: "ハッカソンに参加",
    },
  ],
  guiltyCharacterId: "char-b",
  contradictionExplanation: "テスト矛盾説明",
  hints: ["テストヒント1", "テストヒント2", "テストヒント3"],
};

/** Common action sequences */
export const INTERROGATION_ACTIONS: GameAction[] = [
  { type: "START_GAME", scenario: testScenario, playerName: "テスト", difficulty: "normal" },
  { type: "START_INTERROGATION" },
];

export const INTRO_ACTIONS: GameAction[] = [
  { type: "START_GAME", scenario: testScenario, playerName: "テスト", difficulty: "normal" },
];

export function createTurnActions(count: number): GameAction[] {
  return Array.from({ length: count }, (_, i) => ({
    type: "ADD_USER_MESSAGE" as const,
    content: `q${i}`,
  }));
}
