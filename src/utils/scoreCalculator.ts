const BASE_SCORE = 1000;
const TURN_PENALTY = 50;
const HINT_PENALTY = 150;
const CORRECT_BONUS = 500;

export function calculateScore(turnsUsed: number, hintsUsed: number, isCorrect: boolean): number {
  const turnPenalty = turnsUsed * TURN_PENALTY;
  const hintPenalty = hintsUsed * HINT_PENALTY;
  const correctBonus = isCorrect ? CORRECT_BONUS : 0;

  return Math.max(0, BASE_SCORE - turnPenalty - hintPenalty + correctBonus);
}

export function getRank(score: number): { rank: string; title: string } {
  if (score >= 1200) return { rank: "S", title: "天才探偵" };
  if (score >= 900) return { rank: "A", title: "優秀な刑事" };
  if (score >= 600) return { rank: "B", title: "一般捜査官" };
  if (score >= 300) return { rank: "C", title: "見習い探偵" };
  return { rank: "D", title: "迷探偵" };
}
