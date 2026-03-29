import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { renderHook, waitFor } from "@testing-library/react";

import { useSuggestions } from "./useSuggestions";
import type { CharacterData, ChatMessage, Scenario } from "../types";

vi.mock("../utils/questionSuggester", () => ({
  generateSuggestions: vi.fn(),
}));

import { generateSuggestions } from "../utils/questionSuggester";

const mockGenerateSuggestions = vi.mocked(generateSuggestions);

const scenario = {
  id: "s1",
  title: "test",
  crimeType: "test",
  setting: "test",
  crimeTime: "test",
  introParagraphs: [],
  characters: [] as unknown as Scenario["characters"],
  guiltyCharacterId: "c1",
  contradictionExplanation: "",
  hints: [],
} satisfies Scenario;

const characterA: CharacterData = {
  id: "c1",
  name: "Aさん",
  job: "会社員",
  age: "30",
  personality: "温厚",
  personalSecret: "秘密A",
  emoji: "😀",
  color: "blue",
  guilty: true,
  alibiLie: "嘘",
  contradiction: "矛盾",
  crimeDetail: "詳細",
};

const characterB: CharacterData = {
  id: "c2",
  name: "Bさん",
  job: "医師",
  age: "40",
  personality: "冷静",
  personalSecret: "秘密B",
  emoji: "😎",
  color: "rose",
  guilty: false,
  alibiTruth: "真実",
};

const noHistory: ChatMessage[] = [];

describe("useSuggestions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateSuggestions.mockResolvedValue(["質問1", "質問2", "質問3"]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("easyモードでcharacterが未定義の場合はサジェストを生成しない", async () => {
    const { result } = renderHook(() => useSuggestions(scenario, undefined, noHistory, "easy"));
    await waitFor(() => expect(result.current.isLoadingSuggestions).toBe(false));
    expect(mockGenerateSuggestions).not.toHaveBeenCalled();
    expect(result.current.suggestions).toEqual([]);
  });

  it("normalモードではサジェストを生成しない", async () => {
    const { result } = renderHook(() => useSuggestions(scenario, characterA, noHistory, "normal"));
    await waitFor(() => expect(result.current.isLoadingSuggestions).toBe(false));
    expect(mockGenerateSuggestions).not.toHaveBeenCalled();
  });

  it("easyモードで初回サジェストを生成する", async () => {
    const { result } = renderHook(() => useSuggestions(scenario, characterA, noHistory, "easy"));
    await waitFor(() => expect(result.current.suggestions).toEqual(["質問1", "質問2", "質問3"]));
    expect(mockGenerateSuggestions).toHaveBeenCalledTimes(1);
  });

  it("タブ切り替え（characterId変更）でキャッシュがあれば再生成しない", async () => {
    let character: CharacterData = characterA;
    const { result, rerender } = renderHook(() =>
      useSuggestions(scenario, character, noHistory, "easy"),
    );

    // 初回生成を待つ
    await waitFor(() => expect(result.current.suggestions).toEqual(["質問1", "質問2", "質問3"]));
    expect(mockGenerateSuggestions).toHaveBeenCalledTimes(1);

    // characterB に切り替え
    mockGenerateSuggestions.mockResolvedValue(["質問B1", "質問B2", "質問B3"]);
    character = characterB;
    rerender();
    await waitFor(() => expect(result.current.suggestions).toEqual(["質問B1", "質問B2", "質問B3"]));
    expect(mockGenerateSuggestions).toHaveBeenCalledTimes(2);

    // characterA に戻る → キャッシュを使うため再生成しない
    character = characterA;
    rerender();
    await waitFor(() => expect(result.current.suggestions).toEqual(["質問1", "質問2", "質問3"]));
    expect(mockGenerateSuggestions).toHaveBeenCalledTimes(2); // 増えない
  });

  it("A のリクエスト進行中に B に切り替えても A のリクエストを abort しない", async () => {
    let resolveA!: (v: string[]) => void;
    const promiseA = new Promise<string[]>((res) => {
      resolveA = res;
    });
    mockGenerateSuggestions.mockReturnValueOnce(promiseA);
    mockGenerateSuggestions.mockResolvedValue(["質問B1", "質問B2", "質問B3"]);

    let character: CharacterData = characterA;
    const { result, rerender } = renderHook(() =>
      useSuggestions(scenario, character, noHistory, "easy"),
    );

    // A の loading 開始
    await waitFor(() => expect(result.current.isLoadingSuggestions).toBe(true));
    expect(mockGenerateSuggestions).toHaveBeenCalledTimes(1);

    // B に切り替え → A のリクエストは abort されず継続
    character = characterB;
    rerender();
    await waitFor(() => expect(result.current.suggestions).toEqual(["質問B1", "質問B2", "質問B3"]));
    expect(mockGenerateSuggestions).toHaveBeenCalledTimes(2); // B の分だけ追加

    // A のリクエストが完了 → A のキャッシュに保存される
    resolveA(["質問A1", "質問A2", "質問A3"]);

    // A に戻る → キャッシュを使い再生成しない
    character = characterA;
    rerender();
    await waitFor(() => expect(result.current.suggestions).toEqual(["質問A1", "質問A2", "質問A3"]));
    expect(mockGenerateSuggestions).toHaveBeenCalledTimes(2); // 増えない
  });

  it("新しいassistantメッセージが追加されたときは再生成する", async () => {
    let history: ChatMessage[] = [];
    const { result, rerender } = renderHook(() =>
      useSuggestions(scenario, characterA, history, "easy"),
    );

    await waitFor(() => expect(result.current.suggestions).toEqual(["質問1", "質問2", "質問3"]));
    expect(mockGenerateSuggestions).toHaveBeenCalledTimes(1);

    // assistantメッセージ追加
    mockGenerateSuggestions.mockResolvedValue(["新質問1", "新質問2", "新質問3"]);
    history = [{ role: "assistant", content: "返答", timestamp: 1, triggeredAnxiety: false }];
    rerender();

    await waitFor(() =>
      expect(result.current.suggestions).toEqual(["新質問1", "新質問2", "新質問3"]),
    );
    expect(mockGenerateSuggestions).toHaveBeenCalledTimes(2);
  });
});
