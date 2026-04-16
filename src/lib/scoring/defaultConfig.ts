import type { ScoringConfig } from "@/lib/domain/types";

export const DEFAULT_SCORING_CONFIG: Omit<ScoringConfig, "updatedAt"> = {
  mode: "hybrid",
  points: {
    correctResult: 3,
    exactScoreBonus: 2,
  },
};

