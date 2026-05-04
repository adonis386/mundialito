import { describe, expect, it } from "vitest";
import { scoreMatch, type ScoringConfig } from "./scoring.js";

const base: ScoringConfig = {
  mode: "hybrid",
  points: { correctResult: 3, correctDraw: 4, exactScoreBonus: 3 },
};

describe("scoreMatch", () => {
  it("awards result + exact bonus in hybrid", () => {
    const r = scoreMatch({
      config: base,
      prediction: { home: 2, away: 1 },
      finalScore: { home: 2, away: 1 },
    });
    expect(r.exactScore).toBe(true);
    expect(r.correctResult).toBe(true);
    expect(r.points).toBe(3 + 3);
  });

  it("uses correctDraw for draw results", () => {
    const r = scoreMatch({
      config: base,
      prediction: { home: 1, away: 1 },
      finalScore: { home: 0, away: 0 },
    });
    expect(r.correctResult).toBe(true);
    expect(r.exactScore).toBe(false);
    expect(r.points).toBe(4);
  });

  it("resultOnly ignores exact bonus", () => {
    const r = scoreMatch({
      config: { mode: "resultOnly", points: base.points },
      prediction: { home: 2, away: 0 },
      finalScore: { home: 2, away: 0 },
    });
    expect(r.points).toBe(3);
  });
});
