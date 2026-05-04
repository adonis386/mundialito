export type Slot =
  | { kind: "fixed"; label: string }
  | { kind: "thirdPool"; label: string; pools: string[] };

export type KnockoutMatch = {
  id: string;
  home: Slot;
  away: Slot;
};

export const R32_SAMPLE: KnockoutMatch[] = [
  {
    id: "Dieciseisavos 1",
    home: { kind: "fixed", label: "1° Grupo A" },
    away: { kind: "thirdPool", label: "3° lugar", pools: ["Grupo C", "E", "F", "H", "I"] },
  },
  {
    id: "Dieciseisavos 2",
    home: { kind: "fixed", label: "1° Grupo B" },
    away: { kind: "thirdPool", label: "3° lugar", pools: ["Grupo E", "F", "G", "I", "J"] },
  },
  {
    id: "Dieciseisavos 3",
    home: { kind: "fixed", label: "2° Grupo A" },
    away: { kind: "fixed", label: "2° Grupo B" },
  },
  {
    id: "Dieciseisavos 4",
    home: { kind: "fixed", label: "1° Grupo E" },
    away: { kind: "thirdPool", label: "3° lugar", pools: ["Grupo A", "B", "C", "D", "F"] },
  },
];

export function makeTbdMatches(roundLabel: string, count: number, startAt = 1): KnockoutMatch[] {
  const out: KnockoutMatch[] = [];
  for (let i = startAt; i < startAt + count; i += 1) {
    out.push({
      id: `${roundLabel} ${i}`,
      home: { kind: "fixed", label: "TBD" },
      away: { kind: "fixed", label: "TBD" },
    });
  }
  return out;
}

export function buildKnockoutRounds2026() {
  return [
    {
      key: "r32" as const,
      title: "Dieciseisavos",
      subtitle: "32 equipos",
      matches: [...R32_SAMPLE, ...makeTbdMatches("Dieciseisavos", 12, R32_SAMPLE.length + 1)],
    },
    { key: "r16" as const, title: "Octavos", subtitle: "16 equipos", matches: makeTbdMatches("Octavos", 8) },
    { key: "qf" as const, title: "Cuartos", subtitle: "8 equipos", matches: makeTbdMatches("Cuartos", 4) },
    { key: "sf" as const, title: "Semifinales", subtitle: "4 equipos", matches: makeTbdMatches("Semifinal", 2) },
  ];
}
