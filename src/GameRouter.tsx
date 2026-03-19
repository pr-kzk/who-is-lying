import { useGame } from "./state/GameContext";
import { StartScreen } from "./screens/StartScreen";
import { IntroScreen } from "./screens/IntroScreen";
import { InterrogationScreen } from "./screens/InterrogationScreen";
import { ResultScreen } from "./screens/ResultScreen";

export function GameRouter() {
  const { state } = useGame();

  switch (state.phase) {
    case "start":
      return <StartScreen />;
    case "intro":
      return <IntroScreen />;
    case "interrogation":
      return <InterrogationScreen />;
    case "accusation":
      return <InterrogationScreen />;
    case "result":
      return <ResultScreen />;
  }
}
