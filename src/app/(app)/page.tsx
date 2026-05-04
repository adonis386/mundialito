"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { firebaseAuth, firestore, functions } from "@/lib/firebase/client";
import { userListLabel } from "@/lib/userLabel";

type UserStatsDoc = {
  pointsTotal?: number;
  correctResults?: number;
  exactScores?: number;
};

type LeaderboardDoc = {
  top?: Array<{ uid: string; pointsTotal: number; rank: number; displayName?: string | null }>;
  updatedAt?: unknown;
};

function formatPts(n: number) {
  return n.toLocaleString("es-VE", { maximumFractionDigits: 0 });
}

export default function HomePage() {
  const [uid, setUid] = useState<string | null>(null);
  const [firstLeague, setFirstLeague] = useState<{ id: string; name: string; role?: string } | null>(null);
  const [userStats, setUserStats] = useState<UserStatsDoc | null>(null);
  const [globalLb, setGlobalLb] = useState<LeaderboardDoc | null>(null);
  const [leagueLb, setLeagueLb] = useState<LeaderboardDoc | null>(null);
  const [leaguesCount, setLeaguesCount] = useState(0);
  const [myGlobalRank, setMyGlobalRank] = useState<number | null>(null);
  const [myLeagueFallback, setMyLeagueFallback] = useState<{ rank: number; pointsTotal: number } | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) {
      setFirstLeague(null);
      setLeaguesCount(0);
      return;
    }
    const col = collection(firestore, "users", uid, "leagueMemberships");
    const q = query(col, orderBy("joinedAt", "desc"), limit(1));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const d = snap.docs[0];
        if (!d) {
          setFirstLeague(null);
          return;
        }
        const data = d.data() as { name?: string; role?: string };
        setFirstLeague({ id: d.id, name: String(data?.name ?? "Liga"), role: data?.role });
      },
      () => setFirstLeague(null)
    );

    const unsubAll = onSnapshot(collection(firestore, "users", uid, "leagueMemberships"), (snap) => {
      setLeaguesCount(snap.size);
    });

    return () => {
      unsub();
      unsubAll();
    };
  }, [uid]);

  useEffect(() => {
    const ref = doc(firestore, "leaderboards", "global");
    const unsub = onSnapshot(ref, (snap) => setGlobalLb((snap.data() as LeaderboardDoc) ?? null), () =>
      setGlobalLb(null)
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) {
      setUserStats(null);
      return;
    }
    const ref = doc(firestore, "userStats", uid);
    const unsub = onSnapshot(ref, (snap) => setUserStats((snap.data() as UserStatsDoc) ?? null), () =>
      setUserStats(null)
    );
    return () => unsub();
  }, [uid]);

  useEffect(() => {
    if (!firstLeague?.id) {
      setLeagueLb(null);
      return;
    }
    const ref = doc(firestore, "leagues", firstLeague.id, "leaderboards", "current");
    const unsub = onSnapshot(ref, (snap) => setLeagueLb((snap.data() as LeaderboardDoc) ?? null), () =>
      setLeagueLb(null)
    );
    return () => unsub();
  }, [firstLeague?.id]);

  const tabs = useMemo(() => {
    return [
      { href: "/leagues", label: "Mis ligas", active: true },
      { href: "/leagues/join", label: "Unirme / Crear", active: false },
    ] as const;
  }, []);

  const globalRankEntry = useMemo(() => {
    if (!uid || !globalLb?.top?.length) return null;
    return globalLb.top.find((e) => e.uid === uid) ?? null;
  }, [uid, globalLb]);

  const leagueRankEntry = useMemo(() => {
    if (!uid || !leagueLb?.top?.length) return null;
    return leagueLb.top.find((e) => e.uid === uid) ?? null;
  }, [uid, leagueLb]);

  useEffect(() => {
    if (!uid) {
      setMyGlobalRank(null);
      return;
    }
    if (globalRankEntry) {
      setMyGlobalRank(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const fn = httpsCallable(functions, "getMyGlobalRank");
        const res = await fn();
        const rank = (res.data as { rank?: number })?.rank;
        if (!cancelled && typeof rank === "number") setMyGlobalRank(rank);
      } catch {
        if (!cancelled) setMyGlobalRank(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, globalRankEntry]);

  useEffect(() => {
    if (!uid || !firstLeague?.id) {
      setMyLeagueFallback(null);
      return;
    }
    if (leagueRankEntry) {
      setMyLeagueFallback(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const fn = httpsCallable(functions, "getMyLeagueRank");
        const res = await fn({ leagueId: firstLeague.id });
        const data = res.data as { rank?: number; pointsTotal?: number };
        if (!cancelled && typeof data?.rank === "number") {
          setMyLeagueFallback({ rank: data.rank, pointsTotal: Number(data.pointsTotal ?? 0) });
        }
      } catch {
        if (!cancelled) setMyLeagueFallback(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, firstLeague?.id, leagueRankEntry]);

  const points = Number(userStats?.pointsTotal ?? 0);
  const exact = Number(userStats?.exactScores ?? 0);
  const correct = Number(userStats?.correctResults ?? 0);

  const globalPreview = useMemo(() => (globalLb?.top ?? []).slice(0, 5), [globalLb]);

  return (
    <div className="flex flex-col gap-10 text-left">
      <header className="flex flex-col gap-3 text-left">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#3c0007]">Community Hub</p>
        <h1 className="text-balance text-3xl font-extrabold tracking-tight text-[#1a1c1c] sm:text-4xl">
          Ligas del Mundial 2026
        </h1>
        <p className="max-w-prose text-pretty text-sm text-[#45464f]">
          Crea tu liga privada, comparte código con tus panas y compite en el ranking global. Todo basado en la misma
          matriz master de resultados oficiales.
        </p>
      </header>

      <section className="flex flex-col gap-3 text-left md:flex-row md:items-center md:justify-between">
        <div className="text-xs font-medium uppercase tracking-[0.25em] text-[#767680]">PANEL PRINCIPAL</div>
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

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <article className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#3c0007] to-[#630012] p-8 text-left text-white shadow-2xl lg:col-span-2">
          <div className="relative z-10">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#096c4b] px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                {uid
                  ? globalRankEntry
                    ? `Top global #${globalRankEntry.rank}`
                    : myGlobalRank != null
                      ? `Puesto global #${myGlobalRank}`
                      : "Fuera del top 50 público"
                  : "Ranking global"}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                Tabla materializada · top 50
              </span>
            </div>
            <h2 className="mb-2 text-3xl font-black italic tracking-tighter sm:text-4xl">LIGA GLOBAL DEL MUNDIAL</h2>
            <p className="mb-6 max-w-md text-sm font-medium text-[#ffb3b2]">
              {uid
                ? "Tus puntos se actualizan cuando el admin marca partidos como final en la matriz master."
                : "Inicia sesión para ver tus puntos y tu posición en el ranking global."}
            </p>

            <div className="flex flex-wrap items-center gap-6">
              <div>
                <div className="text-3xl font-black">{formatPts(points)}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#ffdad9]">Puntos</div>
              </div>
              <div className="h-10 w-px bg-white/25" />
              <div>
                <div className="text-3xl font-black">{formatPts(exact)}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#ffdad9]">Marcadores exactos</div>
              </div>
              <div className="h-10 w-px bg-white/25" />
              <div>
                <div className="text-3xl font-black">{formatPts(correct)}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#ffdad9]">Resultados acertados</div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/matches"
                className="inline-flex items-center justify-center rounded-full bg-white/15 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white ring-1 ring-white/25 transition-colors duration-200 ease-out hover:bg-white/25"
              >
                Ir a partidos
              </Link>
              <Link
                href="/leaderboard"
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[#3c0007] transition-opacity duration-200 ease-out hover:opacity-95"
              >
                Ver ranking global
              </Link>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-12 -bottom-16 opacity-10">
            <div className="h-40 w-40 rounded-full bg-white/20 blur-3xl" />
          </div>
        </article>

        <article className="flex flex-col justify-between rounded-xl bg-white p-6 text-left shadow-[0_24px_48px_rgba(26,28,28,0.04)]">
          <div>
            <div className="mb-4 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#9ff4c9] text-[#096c4b]">
                <span className="text-xs font-black uppercase tracking-widest">LP</span>
              </div>
              <span className="text-2xl font-black text-[#096c4b]">
                {firstLeague && uid
                  ? leagueRankEntry
                    ? `#${leagueRankEntry.rank}`
                    : myLeagueFallback
                      ? `#${myLeagueFallback.rank}`
                      : "—"
                  : "—"}
              </span>
            </div>
            <h3 className="mb-1 text-lg font-bold text-[#1a1c1c]">{firstLeague?.name ?? "Tus ligas"}</h3>
            <p className="mb-1 text-xs font-medium text-[#767680]">
              {uid
                ? firstLeague
                  ? `Rol: ${firstLeague.role ?? "member"} · Ligas: ${leaguesCount}`
                  : "Aún no tienes ligas. Crea una o únete con código."
                : "Inicia sesión para ver tus ligas."}
            </p>
            {firstLeague && uid && (leagueRankEntry || myLeagueFallback) ? (
              <p className="text-xs text-[#45464f]">
                {formatPts(
                  leagueRankEntry ? leagueRankEntry.pointsTotal : (myLeagueFallback?.pointsTotal ?? 0)
                )}{" "}
                pts en esta liga
              </p>
            ) : null}
          </div>
          <Link
            href={firstLeague ? `/leagues/${firstLeague.id}` : "/leagues"}
            className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-[#e2e2e2] px-4 py-2.5 text-sm font-bold text-[#1a1c1c] transition-colors duration-200 ease-out hover:bg-[#1a1c1c] hover:text-white"
          >
            {firstLeague ? "Ver tabla" : "Ir a ligas"}
          </Link>
        </article>

        <article className="grid gap-2 rounded-xl bg-[#f3f3f3] p-1 text-left lg:col-span-2">
          <div className="flex flex-col gap-2 md:flex-row">
            <Link
              href="/leagues/create"
              className="flex flex-1 flex-col items-center justify-center rounded-lg bg-white p-5 text-center transition-colors duration-200 ease-out hover:bg-[#ffdad9]/40"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#ffdad9] text-[#3c0007]">
                <span className="text-lg font-black">+</span>
              </div>
              <div className="text-sm font-bold text-[#1a1c1c]">Crear liga privada</div>
              <p className="mt-1 text-[11px] text-[#767680]">Comparte un código e invita a tus amigos.</p>
            </Link>
            <Link
              href="/leagues/join"
              className="flex flex-1 flex-col items-center justify-center rounded-lg bg-white p-5 text-center transition-colors duration-200 ease-out hover:bg-[#9ff4c9]/30"
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

      <section className="mt-4 space-y-4 text-left">
        <div className="flex items-center gap-3">
          <span className="h-1 w-8 rounded-full bg-[#3c0007]" />
          <h2 className="text-lg font-bold tracking-tight text-[#1a1c1c]">Ranking global (datos en vivo)</h2>
        </div>
        <div className="overflow-hidden rounded-2xl bg-[#f3f3f3]">
          {globalPreview.length === 0 ? (
            <div className="p-6 text-sm text-[#767680]">
              Aún no hay datos en el leaderboard. Cuando se finalicen partidos con picks, aparecerá el top aquí.
            </div>
          ) : (
            <ul className="divide-y divide-[#e2e2e2]">
              {globalPreview.map((row) => (
                <li key={row.uid} className="flex items-center justify-between gap-4 bg-white px-5 py-4 transition-colors duration-200 ease-out hover:bg-[#f9f9f9]">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="w-8 shrink-0 text-sm font-black text-[#3c0007]">#{row.rank}</span>
                    <span className={`truncate text-sm font-semibold ${row.uid === uid ? "text-[#096c4b]" : "text-[#1a1c1c]"}`}>
                      {userListLabel(row, uid)}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm font-black text-[#3c0007]">{formatPts(row.pointsTotal)} pts</span>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-[#e2e2e2] bg-white px-5 py-3">
            <Link href="/leaderboard" className="text-sm font-bold text-[#3c0007] underline underline-offset-2">
              Ver tabla completa
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
