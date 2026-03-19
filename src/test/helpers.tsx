import { cleanup, render, renderHook, act, type RenderOptions } from "@testing-library/react";
import { useEffect, useState, type ReactNode } from "react";
import { afterEach, beforeAll, vi } from "vite-plus/test";

import { GameProvider, useGame } from "../state/GameContext";
import type { GameAction } from "../state/gameReducer";

// Re-export fixtures for convenience
export { testScenario, INTERROGATION_ACTIONS, INTRO_ACTIONS, createTurnActions } from "./fixtures";

// Mock scrollIntoView (not available in jsdom)
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

// Auto-cleanup after each test
afterEach(() => {
  cleanup();
});

function GameWrapper({ children }: { children: ReactNode }) {
  return <GameProvider>{children}</GameProvider>;
}

export function renderWithGame(ui: React.ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { wrapper: GameWrapper, ...options });
}

export function renderHookWithGame<T>(hook: () => T) {
  return renderHook(hook, { wrapper: GameWrapper });
}

/**
 * Wrapper component that initializes game state via useEffect before rendering children.
 * This avoids the "Cannot update a component while rendering" React error.
 */
function GameStateInitializer({
  actions,
  children,
}: {
  actions: GameAction[];
  children: ReactNode;
}) {
  const { dispatch } = useGame();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    for (const action of actions) {
      dispatch(action);
    }
    setReady(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return null;
  return <>{children}</>;
}

/**
 * Renders a component inside GameProvider with pre-applied game actions.
 * Uses useEffect to apply actions, so tests must use findBy* queries (async).
 */
export function renderWithGameSetup(
  ui: React.ReactElement,
  actions: GameAction[],
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, {
    ...options,
    wrapper: ({ children }: { children: ReactNode }) => (
      <GameProvider>
        <GameStateInitializer actions={actions}>{children}</GameStateInitializer>
      </GameProvider>
    ),
  });
}

export { act };
