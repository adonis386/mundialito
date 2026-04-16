import type { MatchPrediction, ScoringConfig, SoccerScore } from "@/lib/domain/types";

export type MatchOutcome = "home" | "draw" | "away";

export function getOutcome(score: SoccerScore): MatchOutcome {
  if (score.home > score.away) return "home";
  if (score.home < score.away) return "away";
  return "draw";
}

export function isExactScore(prediction: MatchPrediction, finalScore: SoccerScore) {
  return prediction.home === finalScore.home && prediction.away === finalScore.away;
}

export function isCorrectResult(prediction: MatchPrediction, finalScore: SoccerScore) {
  return getOutcome(prediction) === getOutcome(finalScore);
}

export type ScoringBreakdown = {
  points: number;
  correctResult: boolean;
  exactScore: boolean;
};

export function scoreMatch(params: {
  config: Pick<ScoringConfig, "mode" | "points">;
  prediction: MatchPrediction;
  finalScore: SoccerScore;
}): ScoringBreakdown {
  const { config, prediction, finalScore } = params;

  const correctResult = isCorrectResult(prediction, finalScore);
  const exactScore = isExactScore(prediction, finalScore);

  if (config.mode === "resultOnly") {
    return {
      points: correctResult ? config.points.correctResult : 0,
      correctResult,
      exactScore,
    };
  }

  if (config.mode === "exactScore") {
    return {
      points: exactScore ? config.points.correctResult + config.points.exactScoreBonus : 0,
      correctResult,
      exactScore,
    };
  }

  // hybrid
  return {
    points:
      (correctResult ? config.points.correctResult : 0) +
      (exactScore ? config.points.exactScoreBonus : 0),
    correctResult,
    exactScore,
  };
}

