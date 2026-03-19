import { describe, expect, it } from "vite-plus/test";
import { screen } from "@testing-library/react";

import { ScoreBoard } from "./ScoreBoard";
import { renderWithGameSetup, INTERROGATION_ACTIONS, createTurnActions } from "../test/helpers";

describe("ScoreBoard", () => {
  it("displays remaining turns", async () => {
    renderWithGameSetup(<ScoreBoard />, INTERROGATION_ACTIONS);

    expect(await screen.findByText("15")).not.toBeNull();
    expect(screen.getByText("残り質問回数")).not.toBeNull();
  });

  it("displays estimated score", async () => {
    renderWithGameSetup(<ScoreBoard />, INTERROGATION_ACTIONS);

    expect(await screen.findByText("スコア推定値")).not.toBeNull();
    expect(screen.getByText("1500")).not.toBeNull();
  });

  it("displays hints used count", async () => {
    renderWithGameSetup(<ScoreBoard />, INTERROGATION_ACTIONS);

    expect(await screen.findByText("ヒント使用回数")).not.toBeNull();
    expect(screen.getByText("0")).not.toBeNull();
  });

  it("shows red pulse animation when remainingTurns <= 3", async () => {
    renderWithGameSetup(<ScoreBoard />, [...INTERROGATION_ACTIONS, ...createTurnActions(13)]);

    const turnsElement = await screen.findByText("2");
    expect(turnsElement.className).toContain("text-red-400");
  });

  it("does not show red animation when turns > 3", async () => {
    renderWithGameSetup(<ScoreBoard />, INTERROGATION_ACTIONS);

    const turnsElement = await screen.findByText("15");
    expect(turnsElement.className).toContain("text-gray-100");
    expect(turnsElement.className).not.toContain("text-red-400");
  });
});
