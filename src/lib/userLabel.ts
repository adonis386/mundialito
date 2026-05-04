/** Etiqueta corta para listados públicos (leaderboards materializados). */
export function userListLabel(
  e: { uid: string; displayName?: string | null },
  selfUid: string | null
): string {
  if (selfUid && e.uid === selfUid) return "Tú";
  const d = e.displayName?.trim();
  if (d) return d;
  const u = e.uid;
  if (u.length <= 14) return u;
  return `${u.slice(0, 6)}…${u.slice(-4)}`;
}
