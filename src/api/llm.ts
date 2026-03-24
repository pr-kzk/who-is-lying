type LLMProvider = "claude" | "local";

function getProvider(): LLMProvider {
  const value = import.meta.env["VITE_LLM_PROVIDER"];
  if (value === "claude") return "claude";
  return "local";
}

async function* parseSSE(reader: ReadableStreamDefaultReader<Uint8Array>): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") return;
      yield data;
    }
  }
}

async function streamClaude(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: import.meta.env["VITE_CLAUDE_MODEL"] || "claude-opus-4-6",
      max_tokens: 500,
      stream: true,
      system: systemPrompt,
      messages,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const reader = response.body!.getReader();
  let fullText = "";

  for await (const data of parseSSE(reader)) {
    try {
      const parsed = JSON.parse(data) as {
        type?: string;
        delta?: { type?: string; text?: string };
      };
      if (parsed.type === "content_block_delta" && parsed.delta?.text) {
        fullText += parsed.delta.text;
        onChunk(parsed.delta.text);
      }
    } catch {
      // skip non-JSON lines
    }
  }

  return fullText;
}

async function streamLocal(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const chatMessages = [{ role: "system" as const, content: systemPrompt }, ...messages];

  const response = await fetch("/api/local", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: import.meta.env["VITE_LLM_MODEL"] || "qwen3.5-9b",
      max_tokens: 500,
      stream: true,
      messages: chatMessages,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const reader = response.body!.getReader();
  let fullText = "";

  for await (const data of parseSSE(reader)) {
    try {
      const parsed = JSON.parse(data) as {
        choices?: Array<{ delta?: { content?: string } }>;
      };
      const content = parsed.choices?.[0]?.delta?.content;
      if (content) {
        fullText += content;
        onChunk(content);
      }
    } catch {
      // skip non-JSON lines
    }
  }

  return fullText;
}

export async function streamLLM(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const provider = getProvider();
  if (provider === "claude") {
    return streamClaude(systemPrompt, messages, onChunk, signal);
  }
  return streamLocal(systemPrompt, messages, onChunk, signal);
}
