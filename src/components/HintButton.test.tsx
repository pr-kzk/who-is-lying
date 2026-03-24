import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";

import { HintButton } from "./HintButton";

afterEach(() => {
  cleanup();
});

const defaultProps = {
  canUseHint: true,
  canRevealNewHint: true,
  revealedHints: [] as string[],
  totalHints: 3,
  onRevealHint: vi.fn(),
  hintsRevealed: 0,
};

describe("HintButton", () => {
  it("returns null when canUseHint=false", () => {
    const { container } = render(<HintButton {...defaultProps} canUseHint={false} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders button when canUseHint=true", () => {
    render(<HintButton {...defaultProps} />);
    expect(screen.getByText(/ヒントを使う/)).not.toBeNull();
  });

  it("first click reveals hint and calls onRevealHint", () => {
    const onRevealHint = vi.fn();
    render(<HintButton {...defaultProps} onRevealHint={onRevealHint} />);

    fireEvent.click(screen.getByText(/ヒントを使う/));
    expect(onRevealHint).toHaveBeenCalledTimes(1);
  });

  it("shows revealed hints in popover", () => {
    render(<HintButton {...defaultProps} hintsRevealed={1} revealedHints={["犯人は秘書です"]} />);

    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("犯人は秘書です")).not.toBeNull();
  });

  it("shows 'next hint' button when canRevealNewHint=true", () => {
    render(
      <HintButton
        {...defaultProps}
        hintsRevealed={1}
        revealedHints={["ヒント1"]}
        canRevealNewHint={true}
      />,
    );

    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText(/次のヒントを見る/)).not.toBeNull();
  });

  it("shows disabled message when canRevealNewHint=false", () => {
    render(
      <HintButton
        {...defaultProps}
        hintsRevealed={1}
        revealedHints={["ヒント1"]}
        canRevealNewHint={false}
      />,
    );

    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText(/次のターンでヒントが使えます/)).not.toBeNull();
  });

  it("shows 'all hints revealed' when all hints used", () => {
    render(
      <HintButton
        {...defaultProps}
        hintsRevealed={3}
        revealedHints={["ヒント1", "ヒント2", "ヒント3"]}
        canRevealNewHint={false}
      />,
    );

    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText(/全ヒント公開済み/)).not.toBeNull();
  });

  it("button label shows hint count after first reveal", () => {
    render(
      <HintButton {...defaultProps} hintsRevealed={2} revealedHints={["ヒント1", "ヒント2"]} />,
    );

    expect(screen.getByText(/2\/3/)).not.toBeNull();
  });
});
