import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { screen, fireEvent, waitFor } from "@testing-library/react";

import { InterrogationScreen } from "./InterrogationScreen";
import {
  renderWithGameSetup,
  INTERROGATION_ACTIONS,
  createTurnActions,
  act,
} from "../test/helpers";
import { useGame } from "../state/GameContext";

vi.mock("../hooks/useLLMChat", () => ({
  useLLMChat: vi.fn().mockReturnValue({
    sendMessage: vi.fn().mockResolvedValue("回答です"),
    isLoading: false,
    error: null,
    clearError: vi.fn(),
    streamingContent: null,
  }),
}));

vi.mock("../utils/anxietyDetector", () => ({
  detectAnxiety: vi.fn().mockReturnValue(false),
}));

vi.mock("../utils/promptBuilder", () => ({
  buildSystemPrompt: vi.fn().mockReturnValue("system prompt"),
}));

import { useLLMChat } from "../hooks/useLLMChat";

describe("InterrogationScreen", () => {
  beforeEach(() => {
    vi.mocked(useLLMChat).mockReturnValue({
      sendMessage: vi.fn().mockResolvedValue("回答です"),
      isLoading: false,
      error: null,
      clearError: vi.fn(),
      streamingContent: null,
    });
  });

  it("renders ScoreBoard with remaining turns", async () => {
    renderWithGameSetup(<InterrogationScreen />, INTERROGATION_ACTIONS);
    expect(await screen.findByText("残り質問回数")).not.toBeNull();
  });

  it("renders SuspectSelector with character names", async () => {
    renderWithGameSetup(<InterrogationScreen />, INTERROGATION_ACTIONS);
    await screen.findByText("残り質問回数");
    // A太郎 appears in both SuspectSelector and CharacterPanel
    const allA = screen.getAllByText("A太郎");
    expect(allA.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("B子")).not.toBeNull();
    expect(screen.getByText("C太")).not.toBeNull();
  });

  it("renders CharacterPanel with current suspect", async () => {
    renderWithGameSetup(<InterrogationScreen />, INTERROGATION_ACTIONS);
    expect(await screen.findByText("会計士")).not.toBeNull();
  });

  it("renders AccuseButton", async () => {
    renderWithGameSetup(<InterrogationScreen />, INTERROGATION_ACTIONS);
    expect(await screen.findByText(/犯人を指名する/)).not.toBeNull();
  });

  it("renders initial alibi message for current suspect", async () => {
    renderWithGameSetup(<InterrogationScreen />, INTERROGATION_ACTIONS);
    expect(await screen.findByText("自宅にいた")).not.toBeNull();
  });

  it("disables input when remainingTurns <= 0", async () => {
    renderWithGameSetup(<InterrogationScreen />, [
      ...INTERROGATION_ACTIONS,
      ...createTurnActions(15),
    ]);

    const textarea = await screen.findByPlaceholderText("質問できません");
    expect((textarea as HTMLTextAreaElement).disabled).toBe(true);
  });

  it("shows error toast when error occurs", async () => {
    vi.mocked(useLLMChat).mockReturnValue({
      sendMessage: vi.fn().mockResolvedValue(""),
      isLoading: false,
      error: "API接続エラー",
      clearError: vi.fn(),
      streamingContent: null,
    });

    renderWithGameSetup(<InterrogationScreen />, INTERROGATION_ACTIONS);

    expect(await screen.findByText("API接続エラー")).not.toBeNull();
  });

  it("renders score display", async () => {
    renderWithGameSetup(<InterrogationScreen />, INTERROGATION_ACTIONS);
    expect(await screen.findByText("スコア推定値")).not.toBeNull();
  });

  it("adds assistant reply to the questioned suspect even if the tab is switched before response resolves", async () => {
    let resolveResponse!: (value: string) => void;
    const pendingResponse = new Promise<string>((resolve) => {
      resolveResponse = resolve;
    });
    vi.mocked(useLLMChat).mockReturnValue({
      sendMessage: vi.fn().mockReturnValue(pendingResponse),
      isLoading: false,
      error: null,
      clearError: vi.fn(),
      streamingContent: null,
    });

    let capturedDispatch!: ReturnType<typeof useGame>["dispatch"];
    let capturedState!: ReturnType<typeof useGame>["state"];
    function StateCapture() {
      const { dispatch, state } = useGame();
      capturedDispatch = dispatch;
      capturedState = state;
      return null;
    }

    renderWithGameSetup(
      <>
        <StateCapture />
        <InterrogationScreen />
      </>,
      INTERROGATION_ACTIONS,
    );

    await screen.findByText("残り質問回数");

    // Send a message to suspect A (char-a, the initial suspect)
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "質問です" } });
    fireEvent.keyDown(textarea, { key: "Enter" });

    // Switch to suspect B before the response resolves
    await act(async () => {
      capturedDispatch({ type: "SELECT_SUSPECT", suspectId: "char-b" });
    });

    // Resolve the LLM response
    await act(async () => {
      resolveResponse("Aの回答");
    });

    // Reply must land in char-a's history, not char-b's
    await waitFor(() => {
      expect(capturedState.chatHistories["char-a"].some((m) => m.content === "Aの回答")).toBe(true);
    });
    expect(capturedState.chatHistories["char-b"].some((m) => m.content === "Aの回答")).toBe(false);
  });
});
