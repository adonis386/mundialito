export type TournamentId = "2026";

export type MatchStage = "group" | "round16" | "qf" | "sf" | "final";
export type MatchStatus = "scheduled" | "live" | "final";

export type SoccerScore = {
  home: number;
  away: number;
};

export type MasterMatch = {
  stage: MatchStage;
  homeTeamId: string;
  awayTeamId: string;
  kickoffAt: unknown; // Firestore Timestamp (avoid hard dependency in shared types)
  status: MatchStatus;
  score?: SoccerScore;
  version: number;
  updatedAt: unknown; // Firestore Timestamp
  updatedBy: string; // uid/email
};

export type UserProfile = {
  displayName: string;
  photoURL?: string;
  createdAt: unknown; // Firestore Timestamp
};

export type MatchPrediction = SoccerScore;

export type UserPick = {
  matchId: string;
  prediction: MatchPrediction;
  createdAt: unknown; // Firestore Timestamp
  updatedAt: unknown; // Firestore Timestamp
};

export type LeagueVisibility = "private";
export type LeagueRole = "owner" | "admin" | "member";

export type League = {
  name: string;
  ownerUid: string;
  visibility: LeagueVisibility;
  joinCodeHash: string;
  createdAt: unknown; // Firestore Timestamp
};

export type LeagueMember = {
  role: LeagueRole;
  joinedAt: unknown; // Firestore Timestamp
};

export type ScoringMode = "exactScore" | "resultOnly" | "hybrid";

export type ScoringConfig = {
  mode: ScoringMode;
  points: {
    /** Puntos por acertar ganador (home/away) */
    correctResult: number;
    /** Puntos por acertar empate (draw) */
    correctDraw: number;
    exactScoreBonus: number;
  };
  updatedAt: unknown; // Firestore Timestamp
};

export type UserStats = {
  pointsTotal: number;
  correctResults: number;
  exactScores: number;
  updatedAt: unknown; // Firestore Timestamp
};

export type LeaderboardEntry = {
  uid: string;
  pointsTotal: number;
  rank: number;
};

export type LeaderboardDoc = {
  top: LeaderboardEntry[];
  updatedAt: unknown; // Firestore Timestamp
  sourceVersion: number;
};

