/** Convierte kickoff Firestore (Timestamp | ISO string) a ms. */
export function kickoffToMillis(kickoffAt: unknown): number | null {
  if (kickoffAt == null) return null;
  if (typeof kickoffAt === "object" && kickoffAt !== null && "toMillis" in kickoffAt) {
    const ms = (kickoffAt as { toMillis: () => number }).toMillis();
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof kickoffAt === "object" && kickoffAt !== null && "seconds" in kickoffAt) {
    const sec = Number((kickoffAt as { seconds: number }).seconds);
    return Number.isFinite(sec) ? sec * 1000 : null;
  }
  const parsed = Date.parse(String(kickoffAt));
  return Number.isFinite(parsed) ? parsed : null;
}

type MasterPickState = {
  status?: "scheduled" | "live" | "final" | string;
  kickoffAt?: unknown;
};

/** Picks solo editables: programado y antes del kickoff. */
export function isPickEditable(master: MasterPickState | null | undefined): boolean {
  if (!master) return false;
  if (master.status === "live" || master.status === "final") return false;
  const ms = kickoffToMillis(master.kickoffAt);
  if (ms == null) return false;
  return Date.now() < ms;
}

export function pickLockReason(master: MasterPickState | null | undefined): string | null {
  if (!master) return "Partido no disponible.";
  if (master.status === "live") return "Partido en vivo: el pick está cerrado.";
  if (master.status === "final") return "Partido finalizado: el pick está cerrado.";
  const ms = kickoffToMillis(master.kickoffAt);
  if (ms == null) return "Sin hora de kickoff.";
  if (Date.now() >= ms) return "Ya pasó el kickoff: el pick está cerrado.";
  return null;
}
