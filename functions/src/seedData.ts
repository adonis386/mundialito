import { Timestamp } from "firebase-admin/firestore";

export type SeedMatch = {
  matchId: string;
  kickoffAt: { y: number; m: number; d: number; hh: number; mm: number };
};

export const SEED_MATCHDAYS: Record<1 | 2 | 3, SeedMatch[]> = {
  1: [
    { matchId: "md1-01", kickoffAt: { y: 2026, m: 6, d: 11, hh: 15, mm: 0 } },
    { matchId: "md1-02", kickoffAt: { y: 2026, m: 6, d: 11, hh: 22, mm: 0 } },
    { matchId: "md1-03", kickoffAt: { y: 2026, m: 6, d: 12, hh: 15, mm: 0 } },
    { matchId: "md1-04", kickoffAt: { y: 2026, m: 6, d: 12, hh: 21, mm: 0 } },
    { matchId: "md1-05", kickoffAt: { y: 2026, m: 6, d: 13, hh: 15, mm: 0 } },
    { matchId: "md1-06", kickoffAt: { y: 2026, m: 6, d: 13, hh: 18, mm: 0 } },
    { matchId: "md1-07", kickoffAt: { y: 2026, m: 6, d: 13, hh: 21, mm: 0 } },
    { matchId: "md1-08", kickoffAt: { y: 2026, m: 6, d: 14, hh: 0, mm: 0 } },
    { matchId: "md1-09", kickoffAt: { y: 2026, m: 6, d: 14, hh: 13, mm: 0 } },
    { matchId: "md1-10", kickoffAt: { y: 2026, m: 6, d: 14, hh: 16, mm: 0 } },
    { matchId: "md1-11", kickoffAt: { y: 2026, m: 6, d: 14, hh: 19, mm: 0 } },
    { matchId: "md1-12", kickoffAt: { y: 2026, m: 6, d: 14, hh: 22, mm: 0 } },
    { matchId: "md1-13", kickoffAt: { y: 2026, m: 6, d: 15, hh: 12, mm: 0 } },
    { matchId: "md1-14", kickoffAt: { y: 2026, m: 6, d: 15, hh: 15, mm: 0 } },
    { matchId: "md1-15", kickoffAt: { y: 2026, m: 6, d: 15, hh: 18, mm: 0 } },
    { matchId: "md1-16", kickoffAt: { y: 2026, m: 6, d: 15, hh: 21, mm: 0 } },
    { matchId: "md1-17", kickoffAt: { y: 2026, m: 6, d: 16, hh: 15, mm: 0 } },
    { matchId: "md1-18", kickoffAt: { y: 2026, m: 6, d: 16, hh: 18, mm: 0 } },
    { matchId: "md1-19", kickoffAt: { y: 2026, m: 6, d: 16, hh: 21, mm: 0 } },
    { matchId: "md1-20", kickoffAt: { y: 2026, m: 6, d: 17, hh: 0, mm: 0 } },
    { matchId: "md1-21", kickoffAt: { y: 2026, m: 6, d: 17, hh: 13, mm: 0 } },
    { matchId: "md1-22", kickoffAt: { y: 2026, m: 6, d: 17, hh: 16, mm: 0 } },
    { matchId: "md1-23", kickoffAt: { y: 2026, m: 6, d: 17, hh: 19, mm: 0 } },
    { matchId: "md1-24", kickoffAt: { y: 2026, m: 6, d: 17, hh: 22, mm: 0 } },
  ],
  2: [
    { matchId: "md2-01", kickoffAt: { y: 2026, m: 6, d: 18, hh: 12, mm: 0 } },
    { matchId: "md2-02", kickoffAt: { y: 2026, m: 6, d: 18, hh: 15, mm: 0 } },
    { matchId: "md2-03", kickoffAt: { y: 2026, m: 6, d: 18, hh: 18, mm: 0 } },
    { matchId: "md2-04", kickoffAt: { y: 2026, m: 6, d: 18, hh: 21, mm: 0 } },
    { matchId: "md2-05", kickoffAt: { y: 2026, m: 6, d: 19, hh: 15, mm: 0 } },
    { matchId: "md2-06", kickoffAt: { y: 2026, m: 6, d: 19, hh: 18, mm: 0 } },
    { matchId: "md2-07", kickoffAt: { y: 2026, m: 6, d: 19, hh: 20, mm: 30 } },
    { matchId: "md2-08", kickoffAt: { y: 2026, m: 6, d: 19, hh: 23, mm: 0 } },
    { matchId: "md2-09", kickoffAt: { y: 2026, m: 6, d: 20, hh: 13, mm: 0 } },
    { matchId: "md2-10", kickoffAt: { y: 2026, m: 6, d: 20, hh: 16, mm: 0 } },
    { matchId: "md2-11", kickoffAt: { y: 2026, m: 6, d: 20, hh: 20, mm: 0 } },
    { matchId: "md2-12", kickoffAt: { y: 2026, m: 6, d: 21, hh: 0, mm: 0 } },
    { matchId: "md2-13", kickoffAt: { y: 2026, m: 6, d: 21, hh: 12, mm: 0 } },
    { matchId: "md2-14", kickoffAt: { y: 2026, m: 6, d: 21, hh: 15, mm: 0 } },
    { matchId: "md2-15", kickoffAt: { y: 2026, m: 6, d: 21, hh: 18, mm: 0 } },
    { matchId: "md2-16", kickoffAt: { y: 2026, m: 6, d: 21, hh: 21, mm: 0 } },
    { matchId: "md2-17", kickoffAt: { y: 2026, m: 6, d: 22, hh: 13, mm: 0 } },
    { matchId: "md2-18", kickoffAt: { y: 2026, m: 6, d: 22, hh: 17, mm: 0 } },
    { matchId: "md2-19", kickoffAt: { y: 2026, m: 6, d: 22, hh: 20, mm: 0 } },
    { matchId: "md2-20", kickoffAt: { y: 2026, m: 6, d: 22, hh: 23, mm: 0 } },
    { matchId: "md2-21", kickoffAt: { y: 2026, m: 6, d: 23, hh: 13, mm: 0 } },
    { matchId: "md2-22", kickoffAt: { y: 2026, m: 6, d: 23, hh: 16, mm: 0 } },
    { matchId: "md2-23", kickoffAt: { y: 2026, m: 6, d: 23, hh: 19, mm: 0 } },
    { matchId: "md2-24", kickoffAt: { y: 2026, m: 6, d: 23, hh: 22, mm: 0 } },
  ],
  3: [
    { matchId: "md3-01", kickoffAt: { y: 2026, m: 6, d: 24, hh: 15, mm: 0 } },
    { matchId: "md3-02", kickoffAt: { y: 2026, m: 6, d: 24, hh: 15, mm: 0 } },
    { matchId: "md3-03", kickoffAt: { y: 2026, m: 6, d: 24, hh: 18, mm: 0 } },
    { matchId: "md3-04", kickoffAt: { y: 2026, m: 6, d: 24, hh: 18, mm: 0 } },
    { matchId: "md3-05", kickoffAt: { y: 2026, m: 6, d: 24, hh: 21, mm: 0 } },
    { matchId: "md3-06", kickoffAt: { y: 2026, m: 6, d: 24, hh: 21, mm: 0 } },
    { matchId: "md3-07", kickoffAt: { y: 2026, m: 6, d: 25, hh: 16, mm: 0 } },
    { matchId: "md3-08", kickoffAt: { y: 2026, m: 6, d: 25, hh: 16, mm: 0 } },
    { matchId: "md3-09", kickoffAt: { y: 2026, m: 6, d: 25, hh: 19, mm: 0 } },
    { matchId: "md3-10", kickoffAt: { y: 2026, m: 6, d: 25, hh: 19, mm: 0 } },
    { matchId: "md3-11", kickoffAt: { y: 2026, m: 6, d: 25, hh: 22, mm: 0 } },
    { matchId: "md3-12", kickoffAt: { y: 2026, m: 6, d: 25, hh: 22, mm: 0 } },
    { matchId: "md3-13", kickoffAt: { y: 2026, m: 6, d: 26, hh: 15, mm: 0 } },
    { matchId: "md3-14", kickoffAt: { y: 2026, m: 6, d: 26, hh: 15, mm: 0 } },
    { matchId: "md3-15", kickoffAt: { y: 2026, m: 6, d: 26, hh: 20, mm: 0 } },
    { matchId: "md3-16", kickoffAt: { y: 2026, m: 6, d: 26, hh: 20, mm: 0 } },
    { matchId: "md3-17", kickoffAt: { y: 2026, m: 6, d: 26, hh: 23, mm: 0 } },
    { matchId: "md3-18", kickoffAt: { y: 2026, m: 6, d: 26, hh: 23, mm: 0 } },
    { matchId: "md3-19", kickoffAt: { y: 2026, m: 6, d: 27, hh: 17, mm: 0 } },
    { matchId: "md3-20", kickoffAt: { y: 2026, m: 6, d: 27, hh: 17, mm: 0 } },
    { matchId: "md3-21", kickoffAt: { y: 2026, m: 6, d: 27, hh: 19, mm: 30 } },
    { matchId: "md3-22", kickoffAt: { y: 2026, m: 6, d: 27, hh: 19, mm: 30 } },
    { matchId: "md3-23", kickoffAt: { y: 2026, m: 6, d: 27, hh: 22, mm: 0 } },
    { matchId: "md3-24", kickoffAt: { y: 2026, m: 6, d: 27, hh: 22, mm: 0 } },
  ],
};

/**
 * Interpreta los horarios definidos en el seed como hora Venezuela (America/Caracas, UTC-4)
 * y los convierte a un instante UTC estable para guardarlo en Firestore.
 *
 * Venezuela no usa DST, así que el offset es constante: UTC = local + 4h
 */
export function toTimestampUtc(input: SeedMatch["kickoffAt"]) {
  const localAsUtc = new Date(Date.UTC(input.y, input.m - 1, input.d, input.hh, input.mm, 0));
  const utcMillis = localAsUtc.getTime() + 4 * 60 * 60 * 1000;
  return Timestamp.fromMillis(utcMillis);
}

