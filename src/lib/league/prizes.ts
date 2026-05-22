export type PrizeTier = {
  place: number;
  label: string;
  percent: number;
};

export const DEFAULT_PRIZE_TIERS: PrizeTier[] = [
  { place: 1, label: "1er lugar", percent: 50 },
  { place: 2, label: "2do lugar", percent: 30 },
  { place: 3, label: "3er lugar", percent: 20 },
];

export function sumPercents(tiers: PrizeTier[]) {
  return tiers.reduce((s, t) => s + t.percent, 0);
}

export function formatMoney(n: number) {
  return n.toLocaleString("es-VE", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

/** Pozo = cuota × miembros unidos (reales). Los % se aplican sobre ese total. */
export function computePrizePool({
  entryFee,
  membersCount,
  plannedParticipants,
  tiers,
}: {
  entryFee: number | null | undefined;
  membersCount: number;
  plannedParticipants?: number | null;
  tiers: PrizeTier[];
}) {
  const fee = Number(entryFee ?? 0);
  const members = Math.max(0, Math.floor(membersCount));
  const planned = plannedParticipants != null ? Math.max(1, Math.floor(plannedParticipants)) : null;
  const totalPool = fee > 0 && members > 0 ? Math.round(fee * members * 100) / 100 : 0;
  const plannedPool =
    fee > 0 && planned != null ? Math.round(fee * planned * 100) / 100 : null;

  const payouts = tiers.map((t) => ({
    ...t,
    amount: totalPool > 0 ? Math.round(((totalPool * t.percent) / 100) * 100) / 100 : 0,
  }));

  return {
    entryFee: fee,
    membersCount: members,
    plannedParticipants: planned,
    totalPool,
    plannedPool,
    payouts,
    percentSum: sumPercents(tiers),
  };
}

export function normalizeTiersForSubmit(tiers: PrizeTier[]): PrizeTier[] {
  return tiers
    .map((t, i) => ({
      place: Number.isFinite(t.place) ? Math.floor(t.place) : i + 1,
      label: (t.label ?? "").trim() || `Puesto ${i + 1}`,
      percent: Math.round(Number(t.percent) * 100) / 100,
    }))
    .filter((t) => t.label.length > 0);
}
