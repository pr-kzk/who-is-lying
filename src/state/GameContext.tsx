import { createContext, useContext, useReducer, type ReactNode } from "react";

import type { GameState } from "../types/index";
import { gameReducer, initialGameState, type GameAction } from "./gameReducer";

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  return <GameContext value={{ state, dispatch }}>{children}</GameContext>;
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (context === null) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
