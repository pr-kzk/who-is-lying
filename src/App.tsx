import { GameProvider } from "./state/GameContext";
import { Layout } from "./components/Layout";
import { GameRouter } from "./GameRouter";

export function App() {
  return (
    <GameProvider>
      <Layout>
        <GameRouter />
      </Layout>
    </GameProvider>
  );
}
