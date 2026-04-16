import type { GroupId, GroupTeam } from "@/data/groupStage2026";
import { GROUP_STAGE_2026 } from "@/data/groupStage2026";

function teamKey(team: GroupTeam) {
  return team.iso2 ? team.iso2 : team.flag;
}

const TEAM_TO_GROUP: Record<string, GroupId> = (() => {
  const map: Record<string, GroupId> = {};
  for (const group of GROUP_STAGE_2026) {
    for (const team of group.teams) {
      map[teamKey(team)] = group.id;
    }
  }
  return map;
})();

export function getGroupIdForMatch(home: GroupTeam, away: GroupTeam): GroupId | null {
  const a = TEAM_TO_GROUP[teamKey(home)];
  const b = TEAM_TO_GROUP[teamKey(away)];
  if (!a || !b) return null;
  return a === b ? a : null;
}

