"use client";

import { MATCHDAY_1 } from "@/data/matchday1";
import { MATCHDAY_2 } from "@/data/matchday2";
import { MATCHDAY_3 } from "@/data/matchday3";
import { TeamFlag } from "@/components/TeamFlag";
import { getGroupIdForMatch } from "@/lib/groups";
import { firestore } from "@/lib/firebase/client";
import Link from "next/link";
import {
  collection,
  doc,
  documentId,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";

function toMillis(ts: unknown): number | null {
  if (!ts) return null;
  if (typeof (ts as any).toMillis === "function") return (ts as any).toMillis();
  if (typeof (ts as any).seconds === "number") return (ts as any).seconds * 1000;
  return null;
}

function formatKickoffCaracas(ts: unknown) {
  const ms = toMillis(ts);
  if (ms == null) return { time: "--:--", dateLabel: "-- ---" };
  const d = new Date(ms);

  const parts = new Intl.DateTimeFormat("es-VE", {
    timeZone: "America/Caracas",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    day: "2-digit",
    month: "short",
  }).formatToParts(d);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = get("day");
  const month = get("month").toUpperCase();
  const time = `${get("hour")}:${get("minute")}`;

  return { time, dateLabel: `${Number(day)} ${month}` };
}

export default function MatchesPage() {
  const [matchday, setMatchday] = useState<"1" | "2" | "3">("1");

  const localFixtures = useMemo(() => {
    const base = matchday === "3" ? MATCHDAY_3 : matchday === "2" ? MATCHDAY_2 : MATCHDAY_1;
    return [...base].sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt));
  }, [matchday]);

  type MasterMatch = {
    kickoffAt?: unknown;
    status?: "scheduled" | "live" | "final";
    score?: { home: number; away: number };
  };

  const [masterById, setMasterById] = useState<Record<string, MasterMatch>>({});
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [uid, setUid] = useState<string | null>(null);
  const [picksById, setPicksById] = useState<Record<string, { home: string; away: string }>>({});
  const [savingById, setSavingById] = useState<Record<string, boolean>>({});
  const [pickErrorById, setPickErrorById] = useState<Record<string, string | null>>({});

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (u) => {
      setUid(u?.uid ?? null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoadError(null);
        setLoading(true);

        const ids = localFixtures.map((f) => f.id);
        if (ids.length === 0) {
          setMasterById({});
          return;
        }

        const col = collection(firestore, "tournaments", "2026", "matches");
        const chunks: string[][] = [];
        for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));

        const next: Record<string, MasterMatch> = {};
        for (const chunk of chunks) {
          const q = query(col, where(documentId(), "in", chunk));
          const snap = await getDocs(q);
          for (const docSnap of snap.docs) {
            next[docSnap.id] = docSnap.data() as MasterMatch;
          }
        }

        if (!cancelled) setMasterById(next);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Error cargando calendario.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [localFixtures]);

  useEffect(() => {
    if (!uid) {
      setPicksById({});
      return;
    }

    const ids = localFixtures.map((f) => f.id);
    if (ids.length === 0) return;

    const col = collection(firestore, "users", uid, "picks");
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));

    const unsubs = chunks.map((chunk) => {
      const q = query(col, where(documentId(), "in", chunk));
      return onSnapshot(q, (snap) => {
        const next: Record<string, { home: string; away: string }> = {};
        for (const d of snap.docs) {
          const data = d.data() as any;
          next[d.id] = {
            home: String(data?.prediction?.home ?? ""),
            away: String(data?.prediction?.away ?? ""),
          };
        }
        setPicksById((prev) => ({ ...prev, ...next }));
      });
    });

    return () => {
      for (const u of unsubs) u();
    };
  }, [uid, localFixtures]);

  function isLocked(matchId: string) {
    const ms = toMillis(masterById[matchId]?.kickoffAt);
    if (ms == null) return true; // if unknown kickoff, lock to be safe
    return Date.now() >= ms;
  }

  async function savePick(matchId: string) {
    if (!uid) return;
    setSavingById((s) => ({ ...s, [matchId]: true }));
    setPickErrorById((s) => ({ ...s, [matchId]: null }));
    try {
      const draft = picksById[matchId] ?? { home: "", away: "" };
      const home = Number.parseInt(draft.home, 10);
      const away = Number.parseInt(draft.away, 10);

      if (!Number.isFinite(home) || home < 0 || !Number.isFinite(away) || away < 0) {
        throw new Error("Score inválido.");
      }

      const ref = doc(firestore, "users", uid, "picks", matchId);
      const existing = await getDoc(ref);
      await setDoc(
        ref,
        {
          matchId,
          prediction: { home, away },
          updatedAt: serverTimestamp(),
          ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
        },
        { merge: true }
      );
    } catch (e) {
      setPickErrorById((s) => ({ ...s, [matchId]: e instanceof Error ? e.message : "Error guardando pick." }));
    } finally {
      setSavingById((s) => ({ ...s, [matchId]: false }));
    }
  }

  const fixtures = useMemo(() => {
    return [...localFixtures].sort((a, b) => {
      const aMs = toMillis(masterById[a.id]?.kickoffAt);
      const bMs = toMillis(masterById[b.id]?.kickoffAt);
      if (aMs != null && bMs != null) return aMs - bMs;
      if (aMs != null) return -1;
      if (bMs != null) return 1;
      return a.kickoffAt.localeCompare(b.kickoffAt);
    });
  }, [localFixtures, masterById]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Partidos</h1>
        <p className="text-sm text-slate-700">
          Tus picks se cierran automáticamente antes del kickoff (según la matriz master).
        </p>
      </header>

      <section aria-labelledby="matchday-1-heading" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="matchday-1-heading" className="text-base font-semibold text-slate-900">
            Jornada {matchday}
          </h2>
          <select
            className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-900 shadow-sm outline-none"
            value={matchday}
            onChange={(e) => setMatchday(e.target.value as "1" | "2" | "3")}
            aria-label="Seleccionar jornada"
          >
            <option value="1">Jornada 1</option>
            <option value="2">Jornada 2</option>
            <option value="3">Jornada 3</option>
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Hora mostrada en <span className="font-semibold">Venezuela</span> (America/Caracas).
          {loading ? " Cargando..." : null}
        </div>
        {!uid ? (
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
            Para guardar picks, inicia sesión en{" "}
            <Link className="font-semibold underline underline-offset-2" href="/login">
              /login
            </Link>
            .
          </div>
        ) : null}
        {loadError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {loadError}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <ul className="divide-y divide-slate-200">
            {fixtures.map((m) => {
              const master = masterById[m.id];
              const { dateLabel, time } = formatKickoffCaracas(master?.kickoffAt);
              const groupId = getGroupIdForMatch(m.home, m.away);
              const locked = isLocked(m.id) || master?.status === "final";
              const pick = picksById[m.id] ?? { home: "", away: "" };
              const saving = savingById[m.id];
              const pickErr = pickErrorById[m.id];
              return (
                <li key={m.id} className="px-4 py-4 sm:px-6">
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-6">
                      <div className="flex justify-start sm:justify-end">
                        <div className="min-w-0">
                          <TeamFlag team={m.home} layout="inline" size="sm" inlineOrder="name-flag" />
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-xs font-medium text-slate-500">
                          {master?.status ? master.status : "Mundial"}
                        </div>
                        {groupId ? (
                          <div className="mt-1">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                              Grupo {groupId}
                            </span>
                          </div>
                        ) : null}
                        <div className="text-lg font-semibold tracking-tight text-slate-900">{time}</div>
                        <div className="text-xs font-medium text-slate-500">{dateLabel}</div>
                        {master?.status === "final" && master?.score ? (
                          <div className="mt-1 text-sm font-semibold text-slate-900">
                            Final: {master.score.home}-{master.score.away}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex justify-start">
                        <div className="min-w-0">
                          <TeamFlag team={m.away} layout="inline" size="sm" inlineOrder="flag-name" />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <span className="text-xs font-semibold text-slate-700">Tu pick</span>
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                          <input
                            className="h-8 w-12 rounded-lg border border-slate-300 bg-white px-2 text-center text-sm text-slate-900"
                            inputMode="numeric"
                            placeholder="0"
                            value={pick.home}
                            onChange={(e) =>
                              setPicksById((s) => ({ ...s, [m.id]: { home: e.target.value, away: (s[m.id]?.away ?? "") } }))
                            }
                            disabled={!uid || locked}
                            aria-label="Pick goles local"
                          />
                          <span className="text-slate-400">-</span>
                          <input
                            className="h-8 w-12 rounded-lg border border-slate-300 bg-white px-2 text-center text-sm text-slate-900"
                            inputMode="numeric"
                            placeholder="0"
                            value={pick.away}
                            onChange={(e) =>
                              setPicksById((s) => ({ ...s, [m.id]: { home: (s[m.id]?.home ?? ""), away: e.target.value } }))
                            }
                            disabled={!uid || locked}
                            aria-label="Pick goles visitante"
                          />
                        </div>
                        {locked ? (
                          <span className="text-[11px] font-medium text-slate-500">Picks cerrados</span>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => savePick(m.id)}
                        disabled={!uid || locked || saving}
                        className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {saving ? "Guardando..." : "Guardar pick"}
                      </button>
                    </div>

                    {pickErr ? (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        {pickErr}
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}

