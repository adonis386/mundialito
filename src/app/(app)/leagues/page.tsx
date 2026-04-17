"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { EmptyState } from "@/components/EmptyState";
import { firebaseAuth, firestore } from "@/lib/firebase/client";

type MembershipDoc = {
  leagueId: string;
  name: string;
  role?: "owner" | "member";
  joinedAt?: unknown;
};

export default function LeaguesPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<Array<{ id: string; data: MembershipDoc }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) {
      setMemberships([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const col = collection(firestore, "users", uid, "leagueMemberships");
    const q = query(col, orderBy("joinedAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setMemberships(snap.docs.map((d) => ({ id: d.id, data: d.data() as MembershipDoc })));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [uid]);

  const leaguesCount = memberships.length;

  const headline = useMemo(() => {
    if (!uid) return "Inicia sesión para ver tus ligas";
    if (loading) return "Cargando ligas…";
    return "Tus ligas";
  }, [uid, loading]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="text-xs font-black uppercase tracking-[0.25em] text-[#3c0007]">Community Hub</div>
        <h1 className="text-3xl font-black italic tracking-tighter text-slate-900 sm:text-4xl">{headline}</h1>
        <p className="text-sm text-slate-700">Crea ligas privadas y compite con tu grupo. Todos dependen de la matriz master.</p>
      </header>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href="/leagues/create"
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-[#3c0007] to-[#630012] px-5 py-2.5 text-sm font-bold text-white"
        >
          Crear liga
        </Link>
        <Link
          href="/leagues/join"
          className="inline-flex items-center justify-center rounded-full bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-900 hover:bg-slate-200"
        >
          Unirme con código
        </Link>
      </div>

      {uid && leaguesCount > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {memberships.map(({ id, data }) => (
            <Link
              key={id}
              href={`/leagues/${id}`}
              className="group flex flex-col justify-between rounded-xl bg-white p-6 shadow-[0_24px_48px_rgba(26,28,28,0.04)] hover:-translate-y-0.5 transition-transform"
            >
              <div>
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#9ff4c9] text-[#096c4b]">
                    <span className="text-xs font-black uppercase tracking-widest">{(data.role ?? "member").slice(0, 2)}</span>
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">{data.role ?? "member"}</span>
                </div>
                <div className="text-lg font-bold text-slate-900">{data.name}</div>
                <div className="mt-1 text-xs text-slate-500">Liga privada</div>
              </div>
              <div className="mt-4 inline-flex items-center justify-center rounded-lg border border-[#e2e2e2] px-4 py-2.5 text-sm font-bold text-slate-900 group-hover:bg-slate-900 group-hover:text-white">
                Ver tabla
              </div>
            </Link>
          ))}
        </div>
      ) : null}

      {!uid || leaguesCount === 0 ? (
        <EmptyState
          title="Aún no perteneces a ninguna liga"
          description={!uid ? "Inicia sesión y luego crea o únete a una liga." : "Crea una liga o únete con un código de invitación."}
        />
      ) : null}
    </div>
  );
}

