import { callLLM } from "../api/llm";
import type { CharacterData, ChatMessage, Scenario } from "../types";

function buildSuggestionPrompt(
  scenario: Scenario,
  character: CharacterData,
  chatHistory: ChatMessage[],
): string {
  const intro = scenario.introParagraphs.join("\n");
  const historyText =
    chatHistory.length > 0
      ? chatHistory
          .map((m) => `${m.role === "user" ? "刑事" : character.name}: ${m.content}`)
          .join("\n")
      : "（まだ会話していません）";

  return `あなたは推理ゲームのプレイヤーを補助するアシスタントです。
プレイヤーは刑事として容疑者を尋問し、嘘をついている犯人を見つけ出す必要があります。

## 事件概要
${intro}

## 事件情報
- 事件の種類: ${scenario.crimeType}
- 場所: ${scenario.setting}
- 犯行時刻: ${scenario.crimeTime}

## 現在尋問中の容疑者
- 名前: ${character.name}
- 職業: ${character.job}
- 年齢: ${character.age}
- 性格: ${character.personality}

## これまでの会話
${historyText}

## 指示
犯人を特定するために有効な質問を3つ考えてください。
- アリバイの詳細、矛盾点、具体的な状況を突く鋭い質問にしてください
- これまでの会話で既に聞いた内容と重複しないようにしてください
- 質問は自然な日本語の口語体で、刑事が容疑者に聞くような口調にしてください
- 各質問は1文で簡潔に（40文字以内を目安）

以下のJSON配列形式のみで回答してください。説明や前置きは不要です:
["質問1", "質問2", "質問3"]`;
}

export async function generateSuggestions(
  scenario: Scenario,
  character: CharacterData,
  chatHistory: ChatMessage[],
  signal?: AbortSignal,
): Promise<string[]> {
  const systemPrompt = buildSuggestionPrompt(scenario, character, chatHistory);
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    { role: "user", content: "質問候補を3つ生成してください。" },
  ];

  const response = await callLLM(systemPrompt, messages, signal);

  // Extract JSON array from response
  const match = response.match(/\[[\s\S]*?\]/);
  if (!match) return [];

  try {
    const parsed: unknown = JSON.parse(match[0]);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
      return parsed.slice(0, 3);
    }
  } catch {
    // Parse failure — return empty
  }

  return [];
}
