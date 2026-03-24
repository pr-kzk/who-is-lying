interface AnthropicResponse {
  content: Array<{ type: string; text: string }>;
}

interface OpenAIResponse {
  choices: Array<{ message: { content: string } }>;
}

type LLMProvider = "claude" | "local";

function getProvider(): LLMProvider {
  const value = import.meta.env["VITE_LLM_PROVIDER"];
  if (value === "claude") return "claude";
  return "local";
}

async function callClaude(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: import.meta.env["VITE_CLAUDE_MODEL"] || "claude-opus-4-6",
      max_tokens: 500,
      system: systemPrompt,
      messages,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data: AnthropicResponse = await response.json();
  return data.content[0]?.text ?? "";
}

async function callLocal(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  signal?: AbortSignal,
): Promise<string> {
  const chatMessages = [{ role: "system" as const, content: systemPrompt }, ...messages];

  const response = await fetch("/api/local", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: import.meta.env["VITE_LLM_MODEL"] || "qwen3.5-9b",
      max_tokens: 500,
      messages: chatMessages,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data: OpenAIResponse = await response.json();
  return data.choices[0]?.message.content ?? "";
}

export async function callLLM(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  signal?: AbortSignal,
): Promise<string> {
  const provider = getProvider();
  if (provider === "claude") {
    return callClaude(systemPrompt, messages, signal);
  }
  return callLocal(systemPrompt, messages, signal);
}
