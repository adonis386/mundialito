"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, onSnapshot, query, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { firebaseAuth, firestore, functions } from "@/lib/firebase/client";
import { forFirestore } from "@/lib/firestore/sanitize";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { LeaguePrizePanel } from "@/components/league/LeaguePrizePanel";
import { ScoringRulesPanel } from "@/components/league/ScoringRulesPanel";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { computePrizePool, formatMoney } from "@/lib/league/prizes";
import type { PrizeTier } from "@/lib/league/prizes";
import { describeScoringRules } from "@/lib/scoring/scoringRulesText";
import { userListLabel } from "@/lib/userLabel";
import { DEFAULT_SCORING_CONFIG } from "@/lib/scoring/defaultConfig";
import type { ScoringConfig } from "@/lib/domain/types";

type LeagueSettings = {
  tournament?: string;
  matchScope?: string;
  predictionBy?: string;
  pickDeadline?: string;
  sortBy?: string;
};

type LeaguePublicInfo = {
  name?: string;
  membersCount?: number;
  entryFee?: number | null;
  plannedParticipants?: number | null;
  prizeTiers?: PrizeTier[];
  prizeDescription?: string | null;
  scoringRules?: Pick<ScoringConfig, "mode" | "points">;
  settings?: LeagueSettings;
};

type LeagueDoc = LeaguePublicInfo & {
  visibility?: "private" | "public";
  joinCode?: string;
};

type LeaderboardDoc = {
  top?: Array<{ uid: string; pointsTotal: number; rank: number; displayName?: string | null }>;
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
  const router = useRouter();
  const leagueId = params?.leagueId ?? "";
  const [uid, setUid] = useState<string | null>(null);
  const [league, setLeague] = useState<LeagueDoc | null>(null);
  const [overview, setOverview] = useState<LeaguePublicInfo | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardDoc | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [members, setMembers] = useState<Array<MemberDoc & { id: string }>>([]);
  const [codeBusy, setCodeBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myLeagueOutside, setMyLeagueOutside] = useState<{ rank: number; pointsTotal: number } | null>(null);

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

    const overviewRef = doc(firestore, "leagues", leagueId, "overview", "public");
    const unsubOverview = onSnapshot(
      overviewRef,
      (snap) => setOverview(snap.exists() ? (snap.data() as LeaguePublicInfo) : null),
      () => null
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
      unsubOverview();
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

  const title = league?.name ?? "Liga";
  const canManageLeague = role === "owner" || role === "admin";

  /** Miembros reales en Firestore (subcolección); evita overview/league doc desactualizados. */
  const liveMembersCount = useMemo(
    () =>
      Math.max(
        members.length,
        Number(league?.membersCount ?? 0),
        Number(overview?.membersCount ?? 0)
      ),
    [members.length, league?.membersCount, overview?.membersCount]
  );

  useEffect(() => {
    if (!canManageLeague || !leagueId || overview || !league) return;
    void setDoc(
      doc(firestore, "leagues", leagueId, "overview", "public"),
      forFirestore({
        name: league.name,
        membersCount: liveMembersCount,
        entryFee: league.entryFee ?? null,
        plannedParticipants: league.plannedParticipants ?? null,
        prizeTiers: league.prizeTiers ?? [],
        prizeDescription: league.prizeDescription ?? null,
        scoringRules: league.scoringRules,
        settings: league.settings,
      }),
      { merge: true }
    );
  }, [canManageLeague, leagueId, overview, league, liveMembersCount]);

  useEffect(() => {
    if (!canManageLeague || !leagueId || members.length === 0) return;
    const stored = Number(league?.membersCount ?? overview?.membersCount ?? 0);
    if (liveMembersCount <= stored) return;
    void setDoc(
      doc(firestore, "leagues", leagueId),
      forFirestore({ membersCount: liveMembersCount }),
      { merge: true }
    );
    if (overview) {
      void setDoc(
        doc(firestore, "leagues", leagueId, "overview", "public"),
        forFirestore({ membersCount: liveMembersCount }),
        { merge: true }
      );
    }
  }, [canManageLeague, leagueId, members.length, liveMembersCount, league?.membersCount, overview?.membersCount, overview]);

  async function confirmDeleteLeague() {
    if (!leagueId || deleteConfirm !== title) return;
    setError(null);
    try {
      setDeleteBusy(true);
      const fn = httpsCallable(functions, "deleteLeague");
      await fn({ leagueId });
      router.push("/leagues");
    } catch (e) {
      const anyErr = e as { message?: string };
      setError(typeof anyErr?.message === "string" ? anyErr.message : "No se pudo eliminar la liga.");
    } finally {
      setDeleteBusy(false);
    }
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

  const isParticipant = useMemo(() => {
    if (!uid) return false;
    return members.some((m) => m.id === uid) || role != null;
  }, [uid, members, role]);

  const publicInfo = useMemo<LeaguePublicInfo>(() => {
    const base = overview ?? league ?? {};
    return {
      entryFee: base.entryFee,
      plannedParticipants: base.plannedParticipants,
      prizeTiers: base.prizeTiers,
      prizeDescription: base.prizeDescription,
      scoringRules: base.scoringRules,
      settings: base.settings,
      membersCount: liveMembersCount,
    };
  }, [overview, league, liveMembersCount]);

  const scoringForDisplay = publicInfo.scoringRules ?? DEFAULT_SCORING_CONFIG;
  const rulesSummary = useMemo(() => describeScoringRules(scoringForDisplay).resultPlusExactLabel, [scoringForDisplay]);
  const prizeSummary = useMemo(() => {
    const tiers = publicInfo.prizeTiers ?? [];
    if (tiers.length === 0) return "Sin premios en efectivo";
    const pool = computePrizePool({
      entryFee: publicInfo.entryFee,
      membersCount: liveMembersCount,
      plannedParticipants: publicInfo.plannedParticipants,
      tiers,
    });
    return pool.totalPool > 0 ? `Pozo ${formatMoney(pool.totalPool)}` : `${tiers.length} puestos`;
  }, [publicInfo, members.length]);
  const entries = useMemo(() => leaderboard?.top ?? [], [leaderboard]);

  const myTableEntry = useMemo(() => {
    if (!uid) return null;
    return entries.find((e) => e.uid === uid) ?? null;
  }, [entries, uid]);

  useEffect(() => {
    if (!uid || !leagueId) {
      setMyLeagueOutside(null);
      return;
    }
    if (myTableEntry) {
      setMyLeagueOutside(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const fn = httpsCallable(functions, "getMyLeagueRank");
        const res = await fn({ leagueId });
        const data = res.data as { rank?: number; pointsTotal?: number };
        if (!cancelled && typeof data?.rank === "number") {
          setMyLeagueOutside({ rank: data.rank, pointsTotal: Number(data.pointsTotal ?? 0) });
        }
      } catch {
        if (!cancelled) setMyLeagueOutside(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, leagueId, myTableEntry]);

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
            Miembros: {liveMembersCount}
          </span>
          {!uid ? (
            <span className="rounded-full bg-[#ffdad6] px-3 py-1 font-semibold text-[#93000a]">
              Inicia sesión para ver la tabla
            </span>
          ) : null}
        </div>
      </header>

      {error ? <div className="rounded-xl bg-[#ffdad6] px-3 py-2 text-sm text-[#93000a]">{error}</div> : null}

      {uid && myTableEntry ? (
        <div className="rounded-xl border border-[#9ff4c9]/60 bg-[#f0fff7] px-4 py-3 text-sm text-slate-800">
          Tu puesto en esta liga (tabla publicada):{" "}
          <span className="font-black text-[#3c0007]">#{myTableEntry.rank}</span> · {myTableEntry.pointsTotal} pts
        </div>
      ) : null}

      {uid && !myTableEntry && myLeagueOutside ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-[0_24px_48px_rgba(26,28,28,0.04)]">
          Tu puesto en esta liga: <span className="font-black text-[#3c0007]">#{myLeagueOutside.rank}</span> ·{" "}
          {myLeagueOutside.pointsTotal} pts (fuera del top 50 publicado).
        </div>
      ) : null}

      {!uid ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          <Link href="/login" className="font-semibold text-[#3c0007] underline">
            Inicia sesión
          </Link>{" "}
          para ver las reglas y premios de esta liga.
        </div>
      ) : uid && role === null && members.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          Cargando reglas y premios…
        </div>
      ) : !isParticipant ? (
        <div className="rounded-xl border border-[#ffdad6] bg-[#fff5f5] px-4 py-3 text-sm text-slate-800">
          Únete a la liga con el código de invitación para ver reglas y premios.{" "}
          <Link href="/leagues/join" className="font-semibold text-[#3c0007] underline">
            Unirme con código
          </Link>
        </div>
      ) : null}

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
                  <div className="min-w-0 truncate text-sm font-semibold text-slate-900">{userListLabel(e, uid)}</div>
                </div>
                <div className="text-sm font-black text-[#3c0007]">{e.pointsTotal} pts</div>
              </div>
            ))
          )}
        </div>
      </section>

      {isParticipant ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Información de la liga</p>

          <CollapsibleSection title="Reglas de la liga" subtitle={rulesSummary} accent="green">
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Torneo</dt>
                <dd>{publicInfo.settings?.tournament ?? "Copa Mundial 2026"}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Partidos</dt>
                <dd>{publicInfo.settings?.matchScope ?? "Fase de grupos y eliminatoria"}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pronósticos</dt>
                <dd>{publicInfo.settings?.predictionBy ?? "Por partido"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cierre de picks</dt>
                <dd>{publicInfo.settings?.pickDeadline ?? "Antes del kickoff oficial de cada partido"}</dd>
              </div>
            </dl>
            <div className="mt-4">
              <ScoringRulesPanel config={scoringForDisplay} />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Premios" subtitle={prizeSummary} accent="maroon">
            <LeaguePrizePanel
              embedded
              leagueId={leagueId}
              league={{
                entryFee: publicInfo.entryFee,
                plannedParticipants: publicInfo.plannedParticipants,
                prizeTiers: publicInfo.prizeTiers,
                prizeDescription: publicInfo.prizeDescription,
                membersCount: liveMembersCount,
              }}
              canEdit={canManageLeague}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Invitar"
            subtitle={league?.joinCode ? `Código ${league.joinCode}` : "Compartir código"}
            accent="wine"
          >
            {league?.joinCode ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-2xl font-black italic tracking-tight text-[#3c0007]">{league.joinCode}</div>
                <div className="flex flex-wrap gap-2">
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
                  {canManageLeague ? (
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
                <p className="text-sm text-slate-700">Esta liga no tiene código visible.</p>
                {canManageLeague ? (
                  <button
                    type="button"
                    onClick={regenerateCode}
                    disabled={codeBusy}
                    className="inline-flex w-fit items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-[#3c0007] disabled:opacity-60"
                  >
                    {codeBusy ? "Generando…" : "Generar código"}
                  </button>
                ) : (
                  <p className="text-xs text-slate-500">Pídele al administrador que genere el código.</p>
                )}
              </div>
            )}
          </CollapsibleSection>
        </div>
      ) : null}

      <CollapsibleSection
        title="Miembros"
        subtitle={`${members.length} participante${members.length === 1 ? "" : "s"}`}
        accent="green"
      >
        <div className="divide-y divide-slate-200/70 rounded-xl border border-slate-200/80">
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
                  <span className="mt-1 w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 sm:mt-0">
                    {String(m.role ?? "member")}
                  </span>
                </div>
              ))
          )}
        </div>
      </CollapsibleSection>

      {canManageLeague ? (
        <CollapsibleSection title="Administración" subtitle="Eliminar liga" accent="wine">
          {!deleteOpen ? (
            <button
              type="button"
              onClick={() => {
                setDeleteOpen(true);
                setDeleteConfirm("");
                setError(null);
              }}
              className="rounded-full border border-[#ffb4ab] bg-white px-4 py-2 text-sm font-bold text-[#93000a] hover:bg-[#ffdad6]/40"
            >
              Eliminar liga
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-800">
                Se borrarán miembros, estadísticas y el código. Escribe{" "}
                <span className="font-bold text-[#3c0007]">{title}</span> para confirmar.
              </p>
              <input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="h-11 rounded-xl bg-slate-50 px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#93000a]/20"
                placeholder={title}
                autoComplete="off"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={deleteBusy || deleteConfirm !== title}
                  onClick={() => void confirmDeleteLeague()}
                  className="rounded-full bg-[#93000a] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  {deleteBusy ? "Eliminando…" : "Confirmar eliminación"}
                </button>
                <button
                  type="button"
                  disabled={deleteBusy}
                  onClick={() => {
                    setDeleteOpen(false);
                    setDeleteConfirm("");
                  }}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-slate-800"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </CollapsibleSection>
      ) : null}

      <Link href="/leagues" className="text-sm font-semibold text-[#3c0007] underline underline-offset-2">
        Volver a ligas
      </Link>
    </div>
  );
}

