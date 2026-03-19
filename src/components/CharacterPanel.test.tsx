import { describe, expect, it } from "vite-plus/test";
import { render, screen } from "@testing-library/react";

import { CharacterPanel } from "./CharacterPanel";
import { testScenario } from "../test/helpers";

const character = testScenario.characters[0]; // A太郎

describe("CharacterPanel", () => {
  it("renders character emoji, name, and job", () => {
    render(<CharacterPanel character={character} isAnxious={false} />);

    expect(screen.getByText("👔")).not.toBeNull();
    expect(screen.getByText("A太郎")).not.toBeNull();
    expect(screen.getByText("会計士")).not.toBeNull();
  });

  it("does NOT show shake animation when isAnxious=false", () => {
    const { container } = render(<CharacterPanel character={character} isAnxious={false} />);
    const emojiSpan = container.querySelector("span.text-5xl");
    expect(emojiSpan!.className).not.toContain("animate-");
  });

  it("shows shake animation when isAnxious=true", () => {
    const { container } = render(<CharacterPanel character={character} isAnxious={true} />);
    const emojiSpan = container.querySelector("span.text-5xl");
    expect(emojiSpan!.className).toContain("animate-");
  });

  it("shows sweat drop emoji when isAnxious=true", () => {
    render(<CharacterPanel character={character} isAnxious={true} />);
    expect(screen.getByText("💧")).not.toBeNull();
  });
});
