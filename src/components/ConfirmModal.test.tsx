import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";

import { ConfirmModal } from "./ConfirmModal";

afterEach(() => {
  cleanup();
});

describe("ConfirmModal", () => {
  it("renders nothing when isOpen=false", () => {
    const { container } = render(
      <ConfirmModal
        isOpen={false}
        title="タイトル"
        message="メッセージ"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders title and message when open", () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="確認タイトル"
        message="確認メッセージ"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText("確認タイトル")).not.toBeNull();
    expect(screen.getByText("確認メッセージ")).not.toBeNull();
  });

  it("calls onCancel when Escape key is pressed", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmModal isOpen={true} title="t" message="m" onConfirm={vi.fn()} onCancel={onCancel} />,
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when backdrop is clicked", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmModal isOpen={true} title="t" message="m" onConfirm={vi.fn()} onCancel={onCancel} />,
    );

    const backdrop = screen.getByText("t").closest(".fixed");
    fireEvent.click(backdrop!);
    expect(onCancel).toHaveBeenCalled();
  });

  it("does NOT call onCancel when modal content is clicked", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmModal isOpen={true} title="t" message="m" onConfirm={vi.fn()} onCancel={onCancel} />,
    );

    fireEvent.click(screen.getByText("t"));
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("calls onConfirm when confirm button is clicked", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmModal isOpen={true} title="t" message="m" onConfirm={onConfirm} onCancel={vi.fn()} />,
    );

    fireEvent.click(screen.getByText("確認"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("uses custom button labels", () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="t"
        message="m"
        confirmLabel="はい"
        cancelLabel="いいえ"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("はい")).not.toBeNull();
    expect(screen.getByText("いいえ")).not.toBeNull();
  });

  it("applies danger variant styling", () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="t"
        message="m"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        variant="danger"
      />,
    );

    const confirmButton = screen.getByText("確認");
    expect(confirmButton.className).toContain("bg-red-600");
  });
});
