import { afterEach, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";

import { ChatInterface } from "./ChatInterface";
import type { ChatMessage } from "../types";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
});

function createMessage(role: "user" | "assistant", content: string): ChatMessage {
  return { role, content, timestamp: Date.now(), triggeredAnxiety: false };
}

const defaultAskAllProps = {
  askAllMode: false,
  onToggleAskAll: vi.fn(),
  canAskAll: true,
};

describe("ChatInterface", () => {
  it("shows placeholder text when no messages", () => {
    render(
      <ChatInterface
        messages={[]}
        onSend={vi.fn()}
        isLoading={false}
        disabled={false}
        suspectName="田中"
        streamingContent={null}
        {...defaultAskAllProps}
      />,
    );
    expect(screen.getByText("田中 に質問してみましょう")).not.toBeNull();
  });

  it("renders user messages", () => {
    const messages = [createMessage("user", "アリバイは？")];
    render(
      <ChatInterface
        messages={messages}
        onSend={vi.fn()}
        isLoading={false}
        disabled={false}
        suspectName="田中"
        streamingContent={null}
        {...defaultAskAllProps}
      />,
    );
    expect(screen.getByText("アリバイは？")).not.toBeNull();
  });

  it("renders assistant messages with suspectName", () => {
    const messages = [createMessage("assistant", "自宅にいました")];
    render(
      <ChatInterface
        messages={messages}
        onSend={vi.fn()}
        isLoading={false}
        disabled={false}
        suspectName="田中"
        streamingContent={null}
        {...defaultAskAllProps}
      />,
    );
    expect(screen.getByText("自宅にいました")).not.toBeNull();
    expect(screen.getByText("田中")).not.toBeNull();
  });

  it("shows typing indicator when isLoading=true and no streaming content", () => {
    const { container } = render(
      <ChatInterface
        messages={[]}
        onSend={vi.fn()}
        isLoading={true}
        disabled={false}
        suspectName="田中"
        streamingContent={null}
        {...defaultAskAllProps}
      />,
    );
    const dots = container.querySelectorAll("span.rounded-full");
    expect(dots.length).toBe(3);
  });

  it("shows streaming content instead of typing indicator", () => {
    render(
      <ChatInterface
        messages={[]}
        onSend={vi.fn()}
        isLoading={true}
        disabled={false}
        suspectName="田中"
        streamingContent="途中の回答"
        {...defaultAskAllProps}
      />,
    );
    expect(screen.getByText("途中の回答")).not.toBeNull();
  });

  it("does not show typing indicator when isLoading=false", () => {
    const { container } = render(
      <ChatInterface
        messages={[]}
        onSend={vi.fn()}
        isLoading={false}
        disabled={false}
        suspectName="田中"
        streamingContent={null}
        {...defaultAskAllProps}
      />,
    );
    const dots = container.querySelectorAll("span.rounded-full");
    expect(dots.length).toBe(0);
  });

  it("calls onSend with trimmed input on Enter", () => {
    const onSend = vi.fn();
    render(
      <ChatInterface
        messages={[]}
        onSend={onSend}
        isLoading={false}
        disabled={false}
        suspectName="田中"
        streamingContent={null}
        {...defaultAskAllProps}
      />,
    );

    const textarea = screen.getByPlaceholderText("質問を入力してください...");
    fireEvent.change(textarea, { target: { value: "  質問です  " } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    expect(onSend).toHaveBeenCalledWith("質問です");
  });

  it("does NOT send on Shift+Enter", () => {
    const onSend = vi.fn();
    render(
      <ChatInterface
        messages={[]}
        onSend={onSend}
        isLoading={false}
        disabled={false}
        suspectName="田中"
        streamingContent={null}
        {...defaultAskAllProps}
      />,
    );

    const textarea = screen.getByPlaceholderText("質問を入力してください...");
    fireEvent.change(textarea, { target: { value: "質問です" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });

    expect(onSend).not.toHaveBeenCalled();
  });

  it("clears input after sending", () => {
    render(
      <ChatInterface
        messages={[]}
        onSend={vi.fn()}
        isLoading={false}
        disabled={false}
        suspectName="田中"
        streamingContent={null}
        {...defaultAskAllProps}
      />,
    );

    const textarea = screen.getByPlaceholderText(
      "質問を入力してください...",
    ) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "質問" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    expect(textarea.value).toBe("");
  });

  it("disables input and send button when disabled=true", () => {
    render(
      <ChatInterface
        messages={[]}
        onSend={vi.fn()}
        isLoading={false}
        disabled={true}
        suspectName="田中"
        streamingContent={null}
        {...defaultAskAllProps}
      />,
    );

    const textarea = screen.getByPlaceholderText("質問できません") as HTMLTextAreaElement;
    expect(textarea.disabled).toBe(true);

    const sendButton = screen.getByText("送信") as HTMLButtonElement;
    expect(sendButton.disabled).toBe(true);
  });

  it("does not send empty or whitespace-only input", () => {
    const onSend = vi.fn();
    render(
      <ChatInterface
        messages={[]}
        onSend={onSend}
        isLoading={false}
        disabled={false}
        suspectName="田中"
        streamingContent={null}
        {...defaultAskAllProps}
      />,
    );

    const textarea = screen.getByPlaceholderText("質問を入力してください...");
    fireEvent.change(textarea, { target: { value: "   " } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    expect(onSend).not.toHaveBeenCalled();
  });
});
