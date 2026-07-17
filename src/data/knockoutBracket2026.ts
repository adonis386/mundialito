import { KNOCKOUT_ARCHIVE, type KnockoutArchiveMatch, type KnockoutStage } from "@/data/wc2026Archive";

export type Slot = { kind: "team"; label: string };

export type KnockoutMatch = {
  id: string;
  home: Slot;
  away: Slot;
  status: KnockoutArchiveMatch["status"];
  score?: { home: number; away: number };
  pens?: { home: number; away: number };
  kickoffAt: string;
  roundLabel: string;
  stage: KnockoutStage;
};

function toMatch(m: KnockoutArchiveMatch): KnockoutMatch {
  return {
    id: m.id,
    home: { kind: "team", label: m.homeNameEs },
    away: { kind: "team", label: m.awayNameEs },
    status: m.status,
    score: m.score,
    pens: m.pens,
    kickoffAt: m.kickoffAt,
    roundLabel: m.roundLabel,
    stage: m.stage,
  };
}

export function buildKnockoutRounds2026() {
  const all = KNOCKOUT_ARCHIVE.map(toMatch);
  const by = (stage: KnockoutStage) => all.filter((m) => m.stage === stage);

  return [
    {
      key: "r32" as const,
      title: "Dieciseisavos",
      subtitle: "32 equipos",
      matches: by("round32"),
    },
    {
      key: "r16" as const,
      title: "Octavos",
      subtitle: "16 equipos",
      matches: by("round16"),
    },
    {
      key: "qf" as const,
      title: "Cuartos",
      subtitle: "8 equipos",
      matches: by("qf"),
    },
    {
      key: "sf" as const,
      title: "Semifinales",
      subtitle: "4 equipos",
      matches: by("sf"),
    },
    {
      key: "third" as const,
      title: "3er puesto",
      subtitle: "18 JUL 2026",
      matches: by("third"),
    },
    {
      key: "final" as const,
      title: "Final",
      subtitle: "19 JUL 2026",
      matches: by("final"),
    },
  ];
}

/** Fixtures KO para panel admin (bronce + final priorizados al inicio). */
export function knockoutAdminFixtures(): KnockoutMatch[] {
  const all = KNOCKOUT_ARCHIVE.map(toMatch);
  const pending = all.filter((m) => m.status !== "final");
  const done = all.filter((m) => m.status === "final");
  return [...pending, ...done];
}
