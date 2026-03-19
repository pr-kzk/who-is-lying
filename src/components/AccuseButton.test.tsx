import { describe, expect, it, vi } from "vite-plus/test";
import { render, screen, fireEvent } from "@testing-library/react";

import { AccuseButton } from "./AccuseButton";
import { testScenario } from "../test/helpers";

const characters = [...testScenario.characters];

describe("AccuseButton", () => {
  it("renders the accuse button", () => {
    render(<AccuseButton characters={characters} onAccuse={vi.fn()} disabled={false} />);
    expect(screen.getByText(/犯人を指名する/)).not.toBeNull();
  });

  it("button is disabled when disabled=true", () => {
    render(<AccuseButton characters={characters} onAccuse={vi.fn()} disabled={true} />);
    const button = screen.getByText(/犯人を指名する/) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it("clicking opens character selection modal", () => {
    render(<AccuseButton characters={characters} onAccuse={vi.fn()} disabled={false} />);
    fireEvent.click(screen.getByText(/犯人を指名する/));
    expect(screen.getByText("誰が嘘をついていると思いますか？")).not.toBeNull();
  });

  it("displays all characters in selection grid", () => {
    render(<AccuseButton characters={characters} onAccuse={vi.fn()} disabled={false} />);
    fireEvent.click(screen.getByText(/犯人を指名する/));

    for (const char of characters) {
      expect(screen.getByText(char.name)).not.toBeNull();
    }
  });

  it("selecting a character highlights it", () => {
    render(<AccuseButton characters={characters} onAccuse={vi.fn()} disabled={false} />);
    fireEvent.click(screen.getByText(/犯人を指名する/));
    fireEvent.click(screen.getByText("A太郎"));

    const button = screen.getByText("A太郎").closest("button");
    expect(button!.className).toContain("border-red-500");
  });

  it("confirm button is disabled until character is selected", () => {
    render(<AccuseButton characters={characters} onAccuse={vi.fn()} disabled={false} />);
    fireEvent.click(screen.getByText(/犯人を指名する/));

    const confirmBtn = screen.getByText("この人を指名する") as HTMLButtonElement;
    expect(confirmBtn.disabled).toBe(true);

    fireEvent.click(screen.getByText("A太郎"));
    expect(confirmBtn.disabled).toBe(false);
  });

  it("clicking confirm opens ConfirmModal", () => {
    render(<AccuseButton characters={characters} onAccuse={vi.fn()} disabled={false} />);
    fireEvent.click(screen.getByText(/犯人を指名する/));
    fireEvent.click(screen.getByText("A太郎"));
    fireEvent.click(screen.getByText("この人を指名する"));

    expect(screen.getByText("本当にこの人物を告発しますか？")).not.toBeNull();
  });

  it("confirming calls onAccuse with selected character id", () => {
    const onAccuse = vi.fn();
    render(<AccuseButton characters={characters} onAccuse={onAccuse} disabled={false} />);

    fireEvent.click(screen.getByText(/犯人を指名する/));
    fireEvent.click(screen.getByText("B子"));
    fireEvent.click(screen.getByText("この人を指名する"));
    fireEvent.click(screen.getByText("告発する"));

    expect(onAccuse).toHaveBeenCalledWith("char-b");
  });
});
