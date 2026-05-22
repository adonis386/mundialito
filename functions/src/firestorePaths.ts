export const TOURNAMENT_ID = "2026" as const;

export const firestorePaths = {
  masterMatchDoc: (matchId: string) => `tournaments/${TOURNAMENT_ID}/matches/${matchId}`,
  userProfileDoc: (uid: string) => `users/${uid}`,
  userPickDoc: (uid: string, matchId: string) => `users/${uid}/picks/${matchId}`,
  userStatsDoc: (uid: string) => `userStats/${uid}`,
  scoringConfigDoc: () => `scoring/config`,
  globalLeaderboardDoc: () => `leaderboards/global`,
  leagueDoc: (leagueId: string) => `leagues/${leagueId}`,
  leagueMemberDoc: (leagueId: string, uid: string) => `leagues/${leagueId}/members/${uid}`,
  leagueStatsDoc: (leagueId: string, uid: string) => `leagues/${leagueId}/stats/${uid}`,
  leagueLeaderboardDoc: (leagueId: string) => `leagues/${leagueId}/leaderboards/current`,
  /** Reglas y premios visibles para todos los miembros de la liga */
  leagueOverviewDoc: (leagueId: string) => `leagues/${leagueId}/overview/public`,
};

