import { describe, expect, it } from "vite-plus/test";
import { screen, fireEvent } from "@testing-library/react";

import { SuspectSelector } from "./SuspectSelector";
import { renderWithGameSetup, INTERROGATION_ACTIONS } from "../test/helpers";

describe("SuspectSelector", () => {
  it("renders all character tabs", async () => {
    renderWithGameSetup(<SuspectSelector />, INTERROGATION_ACTIONS);

    expect(await screen.findByText("A太郎")).not.toBeNull();
    expect(screen.getByText("B子")).not.toBeNull();
    expect(screen.getByText("C太")).not.toBeNull();
  });

  it("renders character emojis", async () => {
    renderWithGameSetup(<SuspectSelector />, INTERROGATION_ACTIONS);

    expect(await screen.findByText("👔")).not.toBeNull();
    expect(screen.getByText("💼")).not.toBeNull();
    expect(screen.getByText("🖥️")).not.toBeNull();
  });

  it("clicking a different suspect switches to that suspect", async () => {
    renderWithGameSetup(<SuspectSelector />, INTERROGATION_ACTIONS);

    await screen.findByText("B子");
    fireEvent.click(screen.getByText("B子"));

    const bTab = screen.getByText("B子").closest("button");
    expect(bTab!.className).toContain("border-rose-500");
  });

  it("clicking current suspect does nothing", async () => {
    renderWithGameSetup(<SuspectSelector />, INTERROGATION_ACTIONS);

    await screen.findByText("A太郎");
    const aTab = screen.getByText("A太郎").closest("button");
    const classBefore = aTab!.className;

    fireEvent.click(screen.getByText("A太郎"));

    expect(aTab!.className).toBe(classBefore);
  });
});
