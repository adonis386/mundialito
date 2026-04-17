"use client";

import { MATCHDAY_1 } from "@/data/matchday1";
import { MATCHDAY_2 } from "@/data/matchday2";
import { MATCHDAY_3 } from "@/data/matchday3";
import { TeamFlag } from "@/components/TeamFlag";
import { getGroupIdForMatch } from "@/lib/groups";
import { firestore, firebaseAuth } from "@/lib/firebase/client";
import Link from "next/link";
import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

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
    const unsub = onAuthStateChanged(firebaseAuth, (u) => setUid(u?.uid ?? null));
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
          for (const docSnap of snap.docs) next[docSnap.id] = docSnap.data() as MasterMatch;
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
          next[d.id] = { home: String(data?.prediction?.home ?? ""), away: String(data?.prediction?.away ?? "") };
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
    if (ms == null) return true;
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
      if (!Number.isFinite(home) || home < 0 || !Number.isFinite(away) || away < 0) throw new Error("Score inválido.");

      const ref = doc(firestore, "users", uid, "picks", matchId);
      const existing = await getDoc(ref);
      await setDoc(
        ref,
        { matchId, prediction: { home, away }, updatedAt: serverTimestamp(), ...(existing.exists() ? {} : { createdAt: serverTimestamp() }) },
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
        <div className="text-xs font-black uppercase tracking-[0.25em] text-[#3c0007]">Match Center</div>
        <h1 className="text-3xl font-black italic tracking-tighter text-slate-900 sm:text-4xl">Scores &amp; Results</h1>
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
            className="h-10 rounded-full bg-slate-50 px-4 text-xs font-semibold text-slate-900 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-900/10"
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
          <div className="rounded-xl bg-white px-3 py-2 text-sm text-slate-700 shadow-[0_24px_48px_rgba(26,28,28,0.04)]">
            Para guardar picks, inicia sesión en{" "}
            <Link className="font-semibold underline underline-offset-2" href="/login">
              /login
            </Link>
            .
          </div>
        ) : null}

        {loadError ? <div className="rounded-xl bg-[#ffdad6] px-3 py-2 text-sm text-[#93000a]">{loadError}</div> : null}

        <div className="grid gap-6">
            {fixtures.map((m) => {
              const master = masterById[m.id];
              const { dateLabel, time } = formatKickoffCaracas(master?.kickoffAt);
              const groupId = getGroupIdForMatch(m.home, m.away);
              const locked = isLocked(m.id) || master?.status === "final";
              const pick = picksById[m.id] ?? { home: "", away: "" };
              const saving = savingById[m.id];
              const pickErr = pickErrorById[m.id];
              const isFinal = master?.status === "final" && Boolean(master?.score);
              const statusLabel =
                master?.status === "final"
                  ? "FT"
                  : master?.status === "live"
                    ? "EN VIVO"
                    : "PROGRAMADO";
              const statusTone =
                master?.status === "final"
                  ? "bg-[#9ff4c9]/50 text-[#096c4b]"
                  : master?.status === "live"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-100 text-slate-600";

              return (
                <article
                  key={m.id}
                  className="overflow-hidden rounded-xl bg-[#f3f3f3] shadow-[0_24px_48px_rgba(26,28,28,0.04)]"
                  aria-label={`${m.home} vs ${m.away}`}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Match */}
                    <div className="relative flex flex-1 p-6 md:p-7">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#3c0007]/[0.03] to-transparent" />
                      <div className="relative z-10 grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 sm:gap-8">
                        <div className="flex min-w-0 flex-col items-center gap-2">
                          <div className="rounded-full bg-white p-1 shadow-sm">
                            <TeamFlag team={m.home} layout="stacked" size="sm" />
                          </div>
                          <div className="max-w-[12rem] truncate text-center text-sm font-bold uppercase tracking-wide text-slate-900">
                            {m.home.nameEs}
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-2">
                          {isFinal ? (
                            <div className="flex items-center gap-4 text-4xl font-black italic tracking-tight text-slate-900">
                              <span>{master!.score!.home}</span>
                              <span className="font-normal text-slate-300">:</span>
                              <span>{master!.score!.away}</span>
                            </div>
                          ) : (
                            <div className="text-xl font-black uppercase tracking-widest text-[#3c0007]">VS</div>
                          )}

                          <div className={`rounded px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest ${statusTone}`}>
                            {statusLabel}
                          </div>

                          <div className="text-center">
                            {groupId ? (
                              <div className="mb-1">
                                <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                                  Grupo {groupId}
                                </span>
                              </div>
                            ) : null}
                            <div className="text-xs font-bold text-slate-700">{time}</div>
                            <div className="text-[11px] font-medium text-slate-500">{dateLabel}</div>
                          </div>
                        </div>

                        <div className="flex min-w-0 flex-col items-center gap-2">
                          <div className="rounded-full bg-white p-1 shadow-sm">
                            <TeamFlag team={m.away} layout="stacked" size="sm" />
                          </div>
                          <div className="max-w-[12rem] truncate text-center text-sm font-bold uppercase tracking-wide text-slate-900">
                            {m.away.nameEs}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pick panel (only when logged in) */}
                    {uid ? (
                      <div className="w-full bg-white p-6 md:w-[22rem] md:p-7">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <div className="text-[10px] font-black uppercase tracking-widest text-[#3c0007]">
                              {isFinal ? "Tu predicción" : "Set prediction"}
                            </div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                              {locked ? "Cerrado" : "Editable"}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <input
                              className="w-full border-0 border-b-4 border-b-[#e2e2e2] bg-transparent py-2 text-center text-3xl font-black italic text-slate-900 outline-none ring-0 placeholder:text-slate-300 focus:border-b-[#3c0007] disabled:text-slate-400"
                              inputMode="numeric"
                              placeholder="0"
                              value={pick.home}
                              onChange={(e) =>
                                setPicksById((s) => ({ ...s, [m.id]: { home: e.target.value, away: s[m.id]?.away ?? "" } }))
                              }
                              disabled={locked}
                              aria-label="Pick goles local"
                            />
                            <div className="font-bold text-slate-300">-</div>
                            <input
                              className="w-full border-0 border-b-4 border-b-[#e2e2e2] bg-transparent py-2 text-center text-3xl font-black italic text-slate-900 outline-none ring-0 placeholder:text-slate-300 focus:border-b-[#3c0007] disabled:text-slate-400"
                              inputMode="numeric"
                              placeholder="0"
                              value={pick.away}
                              onChange={(e) =>
                                setPicksById((s) => ({ ...s, [m.id]: { home: s[m.id]?.home ?? "", away: e.target.value } }))
                              }
                              disabled={locked}
                              aria-label="Pick goles visitante"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => savePick(m.id)}
                            disabled={locked || saving}
                            className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#3c0007] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {saving ? "Guardando..." : "Guardar pick"}
                          </button>

                          {pickErr ? (
                            <div className="rounded-xl bg-[#ffdad6] px-3 py-2 text-sm text-[#93000a]" role="alert">
                              {pickErr}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
        </div>
      </section>
    </div>
  );
}

