"use client";

import { EmptyState } from "@/components/EmptyState";
import { userListLabel } from "@/lib/userLabel";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useEffect, useMemo, useState } from "react";
import { firebaseAuth, firestore, functions } from "@/lib/firebase/client";

type GlobalLeaderboardDoc = {
  top?: Array<{ uid: string; pointsTotal: number; rank: number; displayName?: string | null }>;
  updatedAt?: unknown;
  sourceVersion?: number;
};

export default function LeaderboardPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [lb, setLb] = useState<GlobalLeaderboardDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [myRankOutsideTop, setMyRankOutsideTop] = useState<number | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    setError(null);
    const ref = doc(firestore, "leaderboards", "global");
    const unsub = onSnapshot(
      ref,
      (snap) => setLb((snap.data() as GlobalLeaderboardDoc) ?? null),
      (e) => setError(e instanceof Error ? e.message : "Error leyendo leaderboard.")
    );
    return () => unsub();
  }, []);

  const entries = useMemo(() => lb?.top ?? [], [lb]);

  const myTopEntry = useMemo(() => {
    if (!uid) return null;
    return entries.find((e) => e.uid === uid) ?? null;
  }, [entries, uid]);

  useEffect(() => {
    if (!uid) {
      setMyRankOutsideTop(null);
      return;
    }
    if (myTopEntry) {
      setMyRankOutsideTop(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const fn = httpsCallable(functions, "getMyGlobalRank");
        const res = await fn();
        const rank = (res.data as { rank?: number })?.rank;
        if (!cancelled && typeof rank === "number") setMyRankOutsideTop(rank);
      } catch {
        if (!cancelled) setMyRankOutsideTop(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, myTopEntry]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Ranking global</h1>
        <p className="text-sm text-slate-700">
          Tabla materializada para lectura rápida. Se recalcula cuando se finaliza un partido en la matriz master.
          Solo se publican los primeros 50; tu posición exacta se calcula por función si quedas fuera.
        </p>
      </header>

      {error ? <div className="rounded-xl bg-[#ffdad6] px-3 py-2 text-sm text-[#93000a]">{error}</div> : null}

      {!uid ? (
        <div className="rounded-xl bg-white px-3 py-2 text-sm text-slate-700 shadow-[0_24px_48px_rgba(26,28,28,0.04)]">
          Inicia sesión para ver el ranking completo.
        </div>
      ) : null}

      {uid && myTopEntry ? (
        <div className="rounded-xl border border-[#9ff4c9]/60 bg-[#f0fff7] px-4 py-3 text-sm text-slate-800">
          Estás en el <span className="font-black text-[#096c4b]">top publicado</span>: puesto{" "}
          <span className="font-black text-[#3c0007]">#{myTopEntry.rank}</span> · {myTopEntry.pointsTotal} pts
        </div>
      ) : null}

      {uid && !myTopEntry && myRankOutsideTop != null ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-[0_24px_48px_rgba(26,28,28,0.04)]">
          Tu <span className="font-black text-[#3c0007]">puesto global</span> es #{myRankOutsideTop} (fuera del top 50
          publicado en esta vista).
        </div>
      ) : null}

      {entries.length === 0 ? (
        <EmptyState
          title="Aún no hay ranking"
          description="Cuando un admin finalice el primer partido, Functions generará el leaderboard global."
        />
      ) : (
        <section className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_48px_rgba(26,28,28,0.04)]">
          <div className="bg-gradient-to-br from-[#3c0007] to-[#630012] px-4 py-3">
            <div className="text-sm font-black italic tracking-tighter text-white">Top global</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">
              {typeof lb?.sourceVersion === "number" ? `Version ${lb.sourceVersion}` : "Actualizado por partidos finalizados"}
            </div>
          </div>

          <div className="divide-y divide-slate-200/70">
            {entries.map((e) => (
              <div key={e.uid} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="w-10 shrink-0 text-center text-sm font-black text-slate-900">#{e.rank}</div>
                  <div className="min-w-0 truncate text-sm font-semibold text-slate-900">{userListLabel(e, uid)}</div>
                </div>
                <div className="shrink-0 text-sm font-black text-[#3c0007]">{e.pointsTotal} pts</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
