export type MatchOutcome = "home" | "draw" | "away";

export type SoccerScore = {
  home: number;
  away: number;
};

export type ScoringMode = "exactScore" | "resultOnly" | "hybrid";

export type ScoringConfig = {
  mode: ScoringMode;
  points: {
    correctResult: number;
    correctDraw: number;
    exactScoreBonus: number;
  };
};

export function getOutcome(score: SoccerScore): MatchOutcome {
  if (score.home > score.away) return "home";
  if (score.home < score.away) return "away";
  return "draw";
}

export function isExactScore(prediction: SoccerScore, finalScore: SoccerScore) {
  return prediction.home === finalScore.home && prediction.away === finalScore.away;
}

export function isCorrectResult(prediction: SoccerScore, finalScore: SoccerScore) {
  return getOutcome(prediction) === getOutcome(finalScore);
}

export function scoreMatch(params: {
  config: ScoringConfig;
  prediction: SoccerScore;
  finalScore: SoccerScore;
}) {
  const { config, prediction, finalScore } = params;

  const correctResult = isCorrectResult(prediction, finalScore);
  const exactScore = isExactScore(prediction, finalScore);
  const isDraw = getOutcome(finalScore) === "draw";
  const resultPoints = correctResult
    ? isDraw
      ? config.points.correctDraw
      : config.points.correctResult
    : 0;

  if (config.mode === "resultOnly") {
    return {
      points: resultPoints,
      correctResult,
      exactScore,
    };
  }

  if (config.mode === "exactScore") {
    return {
      points: exactScore ? resultPoints + config.points.exactScoreBonus : 0,
      correctResult,
      exactScore,
    };
  }

  return {
    points:
      resultPoints +
      (exactScore ? config.points.exactScoreBonus : 0),
    correctResult,
    exactScore,
  };
}

