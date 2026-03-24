import { GameProvider } from "./state/GameContext";
import { GameRouter } from "./GameRouter";

export function App() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  );
}
