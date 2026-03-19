import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";

import { HintButton } from "./HintButton";

afterEach(() => {
  cleanup();
});

describe("HintButton", () => {
  it("returns null when canUseHint=false", () => {
    const { container } = render(
      <HintButton canUseHint={false} hintText="ヒント" onUseHint={vi.fn()} hintsUsed={0} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders button when canUseHint=true", () => {
    render(<HintButton canUseHint={true} hintText="ヒント" onUseHint={vi.fn()} hintsUsed={0} />);
    expect(screen.getByText(/ヒントを使う/)).not.toBeNull();
  });

  it("clicking reveals hint text, calls onUseHint, and shows popover", () => {
    const onUseHint = vi.fn();
    render(
      <HintButton
        canUseHint={true}
        hintText="犯人は秘書です"
        onUseHint={onUseHint}
        hintsUsed={0}
      />,
    );

    fireEvent.click(screen.getByText(/ヒントを使う/));

    expect(onUseHint).toHaveBeenCalledTimes(1);
    expect(screen.getByText("犯人は秘書です")).not.toBeNull();
  });

  it("second click does not call onUseHint again", () => {
    const onUseHint = vi.fn();
    render(<HintButton canUseHint={true} hintText="ヒント" onUseHint={onUseHint} hintsUsed={0} />);

    fireEvent.click(screen.getByText(/ヒントを使う/));
    expect(onUseHint).toHaveBeenCalledTimes(1);

    const revealedButton = screen.getByRole("button");
    fireEvent.click(revealedButton);
    expect(onUseHint).toHaveBeenCalledTimes(1);
  });

  it("displays correct hintsUsed count after reveal", () => {
    render(<HintButton canUseHint={true} hintText="ヒント" onUseHint={vi.fn()} hintsUsed={2} />);

    fireEvent.click(screen.getByText(/ヒントを使う/));

    expect(screen.getByText(/2回使用/)).not.toBeNull();
  });
});
