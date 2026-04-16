import type { TournamentId } from "./types";

export const TOURNAMENT_ID: TournamentId = "2026";

export const firestorePaths = {
  tournamentDoc: (tournamentId: TournamentId = TOURNAMENT_ID) =>
    `tournaments/${tournamentId}`,
  masterMatchDoc: (matchId: string, tournamentId: TournamentId = TOURNAMENT_ID) =>
    `tournaments/${tournamentId}/matches/${matchId}`,

  userDoc: (uid: string) => `users/${uid}`,
  userPickDoc: (uid: string, matchId: string) => `users/${uid}/picks/${matchId}`,

  leagueDoc: (leagueId: string) => `leagues/${leagueId}`,
  leagueMemberDoc: (leagueId: string, uid: string) =>
    `leagues/${leagueId}/members/${uid}`,
  leagueStatsDoc: (leagueId: string, uid: string) => `leagues/${leagueId}/stats/${uid}`,
  leagueLeaderboardDoc: (leagueId: string) => `leagues/${leagueId}/leaderboards/current`,

  scoringConfigDoc: () => `scoring/config`,

  userStatsDoc: (uid: string) => `userStats/${uid}`,
  globalLeaderboardDoc: () => `leaderboards/global`,
};

