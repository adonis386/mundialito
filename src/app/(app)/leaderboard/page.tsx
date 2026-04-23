"use client";

import { EmptyState } from "@/components/EmptyState";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { firebaseAuth, firestore } from "@/lib/firebase/client";

type GlobalLeaderboardDoc = {
  top?: Array<{ uid: string; pointsTotal: number; rank: number }>;
  updatedAt?: unknown;
  sourceVersion?: number;
};

export default function LeaderboardPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [lb, setLb] = useState<GlobalLeaderboardDoc | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Ranking global</h1>
        <p className="text-sm text-slate-700">
          Tabla materializada para lectura rápida. Se recalcula cuando se finaliza un partido en la matriz master.
        </p>
      </header>

      {error ? <div className="rounded-xl bg-[#ffdad6] px-3 py-2 text-sm text-[#93000a]">{error}</div> : null}

      {!uid ? (
        <div className="rounded-xl bg-white px-3 py-2 text-sm text-slate-700 shadow-[0_24px_48px_rgba(26,28,28,0.04)]">
          Inicia sesión para ver el ranking completo.
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
                <div className="flex items-center gap-3">
                  <div className="w-10 text-center text-sm font-black text-slate-900">#{e.rank}</div>
                  <div className="text-sm font-semibold text-slate-900">{e.uid}</div>
                </div>
                <div className="text-sm font-black text-[#3c0007]">{e.pointsTotal} pts</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

