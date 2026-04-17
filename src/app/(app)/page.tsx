"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { firebaseAuth, firestore } from "@/lib/firebase/client";

export default function HomePage() {
  const [uid, setUid] = useState<string | null>(null);
  const [firstLeague, setFirstLeague] = useState<{ id: string; name: string; role?: string } | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) {
      setFirstLeague(null);
      return;
    }
    const col = collection(firestore, "users", uid, "leagueMemberships");
    const q = query(col, orderBy("joinedAt", "desc"), limit(1));
    const unsub = onSnapshot(q, (snap) => {
      const d = snap.docs[0];
      if (!d) {
        setFirstLeague(null);
        return;
      }
      const data = d.data() as any;
      setFirstLeague({ id: d.id, name: String(data?.name ?? "Liga"), role: data?.role });
    });
    return () => unsub();
  }, [uid]);

  const tabs = useMemo(() => {
    return [
      { href: "/leagues", label: "Mis ligas", active: true },
      { href: "/leagues/join", label: "Unirme / Crear", active: false },
    ] as const;
  }, []);

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <header className="flex flex-col gap-3">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#3c0007]">Community Hub</p>
        <h1 className="text-balance text-3xl font-extrabold tracking-tight text-[#1a1c1c] sm:text-4xl">
          Ligas del Mundial 2026
        </h1>
        <p className="max-w-prose text-pretty text-sm text-[#45464f]">
          Crea tu liga privada, comparte código con tus panas y compite en el ranking global. Todo basado en la misma
          matriz master de resultados oficiales.
        </p>
      </header>

      {/* Tabs My Leagues / Join/Create */}
      <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-xs font-medium uppercase tracking-[0.25em] text-[#767680]">
          PANEL PRINCIPAL
        </div>
        <div className="flex w-full rounded-full bg-[#eeeeee] p-1 md:w-auto">
          <Link
            href={tabs[0].href}
            className="w-1/2 rounded-full bg-[#ffffff] px-6 py-2 text-center text-sm font-bold text-[#3c0007] shadow-sm md:w-auto"
          >
            {tabs[0].label}
          </Link>
          <Link
            href={tabs[1].href}
            className="w-1/2 rounded-full px-6 py-2 text-center text-sm font-bold text-[#45464f] hover:text-[#3c0007] md:w-auto"
          >
            {tabs[1].label}
          </Link>
        </div>
      </section>

      {/* Bento grid */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Hero global league */}
        <article className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#3c0007] to-[#630012] p-8 text-white shadow-2xl lg:col-span-2">
          <div className="relative z-10">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#096c4b] px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                Global Rank #4,102
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                vs 1.2M usuarios
              </span>
            </div>
            <h2 className="mb-2 text-3xl font-black italic tracking-tighter sm:text-4xl">
              LIGA GLOBAL DEL MUNDIAL
            </h2>
            <p className="mb-6 max-w-sm text-sm font-medium text-[#ffb3b2]">
              Estás dentro del top 5% de todos los jugadores. Mantén tus picks al día y defiende tu puesto.
            </p>

            <div className="flex flex-wrap items-center gap-6">
              <div>
                <div className="text-3xl font-black">2,450</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#ffdad9]">Puntos</div>
              </div>
              <div className="h-10 w-px bg-white/25" />
              <div>
                <div className="text-3xl font-black">12</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#ffdad9]">
                  Marcadores exactos
                </div>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-12 -bottom-16 opacity-10">
            <div className="h-40 w-40 rounded-full bg-white/20 blur-3xl" />
          </div>
        </article>

        {/* Private league card (real if you have one) */}
        <article className="flex flex-col justify-between rounded-xl bg-white p-6 shadow-[0_24px_48px_rgba(26,28,28,0.04)]">
          <div>
            <div className="mb-4 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#9ff4c9] text-[#096c4b]">
                <span className="text-xs font-black uppercase tracking-widest">LP</span>
              </div>
              <span className="text-2xl font-black text-[#096c4b]">#2</span>
            </div>
            <h3 className="mb-1 text-lg font-bold text-[#1a1c1c]">{firstLeague?.name ?? "Tus ligas"}</h3>
            <p className="mb-4 text-xs font-medium text-[#767680]">
              {uid
                ? firstLeague
                  ? `Rol: ${firstLeague.role ?? "member"}`
                  : "Aún no tienes ligas. Crea una o únete con código."
                : "Inicia sesión para ver tus ligas."}
            </p>
          </div>
          <Link
            href={firstLeague ? `/leagues/${firstLeague.id}` : "/leagues"}
            className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-[#e2e2e2] px-4 py-2.5 text-sm font-bold text-[#1a1c1c] hover:bg-[#1a1c1c] hover:text-white"
          >
            {firstLeague ? "Ver tabla" : "Ir a ligas"}
          </Link>
        </article>

        {/* Fast actions */}
        <article className="grid gap-2 rounded-xl bg-[#f3f3f3] p-1 lg:col-span-2">
          <div className="flex flex-col gap-2 md:flex-row">
            <Link
              href="/leagues/create"
              className="flex flex-1 flex-col items-center justify-center rounded-lg bg-white p-5 text-center hover:bg-[#ffdad9]/40"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#ffdad9] text-[#3c0007]">
                <span className="text-lg font-black">+</span>
              </div>
              <div className="text-sm font-bold text-[#1a1c1c]">Crear liga privada</div>
              <p className="mt-1 text-[11px] text-[#767680]">Comparte un código e invita a tus amigos.</p>
            </Link>
            <Link
              href="/leagues/join"
              className="flex flex-1 flex-col items-center justify-center rounded-lg bg-white p-5 text-center hover:bg-[#9ff4c9]/30"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#9ff4c9] text-[#096c4b]">
                <span className="text-sm font-black">#</span>
              </div>
              <div className="text-sm font-bold text-[#1a1c1c]">Unirme con código</div>
              <p className="mt-1 text-[11px] text-[#767680]">Ingresa un código de invitación existente.</p>
            </Link>
          </div>
        </article>
      </section>

      {/* Trending communities (placeholder) */}
      <section className="mt-4 space-y-4">
        <div className="flex items-center gap-3">
          <span className="h-1 w-8 rounded-full bg-[#3c0007]" />
          <h2 className="text-lg font-bold tracking-tight text-[#1a1c1c]">Comunidades en tendencia</h2>
        </div>
        <div className="overflow-hidden rounded-2xl bg-[#f3f3f3]">
          <div className="grid divide-y divide-[#e2e2e2] md:grid-cols-2 md:divide-y-0 md:divide-x">
            <div className="p-5 hover:bg-white">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#096c4b]">Live action</p>
              <h3 className="mt-1 text-sm font-bold text-[#1a1c1c]">Fanáticos Caracas</h3>
              <p className="mt-1 text-[11px] text-[#767680]">3k miembros • fans Vinotinto</p>
            </div>
            <div className="p-5 hover:bg-white">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#3c0007]">Oficial</p>
              <h3 className="mt-1 text-sm font-bold text-[#1a1c1c]">Liga de la oficina</h3>
              <p className="mt-1 text-[11px] text-[#767680]">Solo invitados • prize pool interno</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

