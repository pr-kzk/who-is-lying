export type GamePhase = "start" | "intro" | "interrogation" | "accusation" | "result";

export type Difficulty = "easy" | "normal" | "hard";

export interface Character {
  id: string;
  name: string;
  job: string;
  age: string;
  personality: string;
  personalSecret: string;
  emoji: string;
  color: string; // tailwind color name like "blue", "rose", "emerald"
}

export interface GuiltyCharacterData extends Character {
  guilty: true;
  alibiLie: string;
  contradiction: string;
  crimeDetail: string;
}

export interface InnocentCharacterData extends Character {
  guilty: false;
  alibiTruth: string;
}

export type CharacterData = GuiltyCharacterData | InnocentCharacterData;

export interface Scenario {
  id: string;
  title: string;
  crimeType: string;
  setting: string;
  crimeTime: string;
  introParagraphs: string[];
  characters: [CharacterData, CharacterData, CharacterData];
  guiltyCharacterId: string;
  contradictionExplanation: string;
  hints: string[]; // progressive hints shown when player uses hint button
  dayContext: string; // verifiable facts about the day that ground the culprit's lie
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  triggeredAnxiety: boolean;
}

export interface GameState {
  phase: GamePhase;
  scenario: Scenario;
  currentSuspectId: string;
  chatHistories: Record<string, ChatMessage[]>;
  turnsUsed: number;
  hintsRevealed: number;
  lastHintTurn: number | null;
  accusedSuspectId: string | null;
  isCorrect: boolean | null;
  score: number | null;
  playerName: string;
  difficulty: Difficulty;
}

export interface ScoreRecord {
  playerName: string;
  score: number;
  rank: string;
  title: string;
  date: string;
  scenarioId: string;
  turnsUsed: number;
  difficulty: Difficulty;
}
