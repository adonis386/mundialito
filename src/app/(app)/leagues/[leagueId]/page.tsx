"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, onSnapshot, query } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { firebaseAuth, firestore, functions } from "@/lib/firebase/client";
import Link from "next/link";
import { useParams } from "next/navigation";

type LeagueDoc = {
  name?: string;
  visibility?: "private" | "public";
  membersCount?: number;
  joinCode?: string;
};

type LeaderboardDoc = {
  top?: Array<{ uid: string; pointsTotal: number; rank: number }>;
  updatedAt?: unknown;
};

type MemberDoc = {
  uid?: string;
  displayName?: string | null;
  email?: string | null;
  role?: "owner" | "admin" | "member";
  joinedAt?: unknown;
};

export default function LeagueDetailPage() {
  const params = useParams<{ leagueId: string }>();
  const leagueId = params?.leagueId ?? "";
  const [uid, setUid] = useState<string | null>(null);
  const [league, setLeague] = useState<LeagueDoc | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardDoc | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [members, setMembers] = useState<Array<MemberDoc & { id: string }>>([]);
  const [codeBusy, setCodeBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!leagueId) return;
    setError(null);
    const leagueRef = doc(firestore, "leagues", leagueId);
    const unsubLeague = onSnapshot(
      leagueRef,
      (snap) => setLeague((snap.data() as LeagueDoc) ?? null),
      (e) => setError(e instanceof Error ? e.message : "Error leyendo liga.")
    );

    const lbRef = doc(firestore, "leagues", leagueId, "leaderboards", "current");
    const unsubLb = onSnapshot(
      lbRef,
      (snap) => setLeaderboard((snap.data() as LeaderboardDoc) ?? null),
      () => null
    );

    const membersRef = query(collection(firestore, "leagues", leagueId, "members"));
    const unsubMembers = onSnapshot(
      membersRef,
      (snap) => {
        setMembers(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as MemberDoc),
          }))
        );
      },
      () => null
    );

    const unsubRole =
      uid
        ? onSnapshot(doc(firestore, "leagues", leagueId, "members", uid), (snap) => setRole(String((snap.data() as any)?.role ?? "member")))
        : () => {};

    return () => {
      unsubLeague();
      unsubLb();
      unsubMembers();
      unsubRole();
    };
  }, [leagueId, uid]);

  async function copyJoinCode() {
    if (!league?.joinCode) return;
    try {
      await navigator.clipboard.writeText(league.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        // optional: don't block on share
      }
    } catch {
      // ignore
    }
  }

  function shareWhatsApp() {
    if (!league?.joinCode) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const joinUrl = origin ? `${origin}/leagues/join` : "/leagues/join";
    const leagueName = league?.name ? ` “${league.name}”` : "";
    const text = `Únete a mi liga${leagueName} en Mundialito 2026.\n\nCódigo: ${league.joinCode}\n\nUnirse: ${joinUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function regenerateCode() {
    if (!leagueId) return;
    setError(null);
    try {
      setCodeBusy(true);
      const fn = httpsCallable(functions, "regenerateLeagueJoinCode");
      await fn({ leagueId });
    } catch (e) {
      const anyErr = e as any;
      setError(typeof anyErr?.message === "string" ? anyErr.message : "Error regenerando código.");
    } finally {
      setCodeBusy(false);
    }
  }

  const title = league?.name ?? "Liga";
  const entries = useMemo(() => leaderboard?.top ?? [], [leaderboard]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="text-xs font-black uppercase tracking-[0.25em] text-[#3c0007]">Leagues</div>
        <h1 className="text-3xl font-black italic tracking-tighter text-slate-900 sm:text-4xl">{title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
          <span className="rounded-full bg-white/70 px-3 py-1 shadow-sm">
            {league?.visibility === "public" ? "Pública" : "Privada"}
          </span>
          <span className="rounded-full bg-white/70 px-3 py-1 shadow-sm">
            Miembros: {Number(league?.membersCount ?? 0)}
          </span>
          {!uid ? (
            <span className="rounded-full bg-[#ffdad6] px-3 py-1 font-semibold text-[#93000a]">
              Inicia sesión para ver la tabla
            </span>
          ) : null}
        </div>
      </header>

      {error ? <div className="rounded-xl bg-[#ffdad6] px-3 py-2 text-sm text-[#93000a]">{error}</div> : null}

      <section className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_48px_rgba(26,28,28,0.04)]">
        <div className="bg-gradient-to-br from-[#3c0007] to-[#630012] px-4 py-3">
          <div className="text-sm font-black italic tracking-tighter text-white">Invitar</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">Código de unión</div>
        </div>

        <div className="p-4">
          {league?.joinCode ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-2xl font-black italic tracking-tight text-[#3c0007]">{league.joinCode}</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyJoinCode}
                  className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-200"
                >
                  {copied ? "Copiado" : "Copiar"}
                </button>
                <button
                  type="button"
                  onClick={shareWhatsApp}
                  className="inline-flex items-center justify-center rounded-full bg-[#096c4b] px-4 py-2 text-sm font-bold text-white hover:bg-[#0b8d62]"
                >
                  WhatsApp
                </button>
                {role === "owner" || role === "admin" ? (
                  <button
                    type="button"
                    onClick={regenerateCode}
                    disabled={codeBusy}
                    className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-sm hover:bg-slate-50 disabled:opacity-60"
                  >
                    {codeBusy ? "..." : "Regenerar"}
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="text-sm text-slate-700">Esta liga no tiene código visible (se creó con una versión vieja).</div>
              {role === "owner" || role === "admin" ? (
                <button
                  type="button"
                  onClick={regenerateCode}
                  disabled={codeBusy}
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-[#3c0007] disabled:opacity-60"
                >
                  {codeBusy ? "Generando..." : "Generar código"}
                </button>
              ) : (
                <div className="text-xs text-slate-500">Pídele al owner que regenere el código.</div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_48px_rgba(26,28,28,0.04)]">
        <div className="bg-gradient-to-br from-[#3c0007] to-[#630012] px-4 py-3">
          <div className="text-sm font-black italic tracking-tighter text-white">Tabla de posiciones</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">Ordenado por puntos</div>
        </div>

        <div className="divide-y divide-slate-200/70">
          {entries.length === 0 ? (
            <div className="px-4 py-6 text-sm text-slate-700">
              Aún no hay posiciones. Cuando finalice el primer partido con picks, se generará el leaderboard.
            </div>
          ) : (
            entries.map((e) => (
              <div key={e.uid} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 text-center text-sm font-black text-slate-900">#{e.rank}</div>
                  <div className="text-sm font-semibold text-slate-900">{e.uid}</div>
                </div>
                <div className="text-sm font-black text-[#3c0007]">{e.pointsTotal} pts</div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_48px_rgba(26,28,28,0.04)]">
        <div className="bg-gradient-to-br from-[#096c4b] to-[#0b8d62] px-4 py-3">
          <div className="text-sm font-black italic tracking-tighter text-white">Miembros</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">IDs (UID)</div>
        </div>

        <div className="divide-y divide-slate-200/70">
          {members.length === 0 ? (
            <div className="px-4 py-6 text-sm text-slate-700">Aún no hay miembros.</div>
          ) : (
            members
              .slice()
              .sort((a, b) => (a.id < b.id ? -1 : 1))
              .map((m) => (
                <div key={m.id} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">{m.displayName || "Miembro"}</div>
                    {m.email ? <div className="truncate text-xs text-slate-500">{m.email}</div> : null}
                  </div>
                  <div className="mt-1 flex items-center gap-2 sm:mt-0">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {String(m.role ?? "member")}
                    </span>
                  </div>
                </div>
              ))
          )}
        </div>
      </section>

      <Link href="/leagues" className="text-sm font-semibold text-[#3c0007] underline underline-offset-2">
        Volver a ligas
      </Link>
    </div>
  );
}

