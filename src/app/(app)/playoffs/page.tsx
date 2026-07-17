"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, documentId, onSnapshot, query, where } from "firebase/firestore";
import { Trophy } from "lucide-react";

import { buildKnockoutRounds2026, type KnockoutMatch } from "@/data/knockoutBracket2026";
import { firestore } from "@/lib/firebase/client";

type MasterKo = {
  status?: "scheduled" | "live" | "final";
  score?: { home: number; away: number };
  pens?: { home: number; away: number };
};

function statusLabel(status: KnockoutMatch["status"]) {
  if (status === "final") return "FT";
  if (status === "live") return "EN VIVO";
  return "PROGRAMADO";
}

function statusTone(status: KnockoutMatch["status"]) {
  if (status === "final") return "bg-[#9ff4c9]/50 text-[#096c4b]";
  if (status === "live") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-600";
}

function MatchCard({ match }: { match: KnockoutMatch }) {
  const isFinal = match.status === "final" && match.score;
  return (
    <article className="rounded-2xl bg-white p-5 shadow-[0_24px_48px_rgba(26,28,28,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[#3c0007]">{match.roundLabel}</div>
        <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${statusTone(match.status)}`}>
          {statusLabel(match.status)}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-2 rounded-2xl bg-[#f3f3f3] p-1">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3">
          <span className="text-sm font-bold text-slate-900">{match.home.label}</span>
          {isFinal ? (
            <span className="font-black tabular-nums text-[#3c0007]">{match.score!.home}</span>
          ) : (
            <span className="text-xs font-semibold text-slate-400">—</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3">
          <span className="text-sm font-bold text-slate-900">{match.away.label}</span>
          {isFinal ? (
            <span className="font-black tabular-nums text-[#3c0007]">{match.score!.away}</span>
          ) : (
            <span className="text-xs font-semibold text-slate-400">—</span>
          )}
        </div>
      </div>

      {match.pens ? (
        <p className="mt-2 text-center text-[11px] font-semibold text-slate-500">
          Penales {match.pens.home}–{match.pens.away}
        </p>
      ) : null}
    </article>
  );
}

export default function PlayoffsPage() {
  const baseRounds = useMemo(() => buildKnockoutRounds2026(), []);
  const allIds = useMemo(() => baseRounds.flatMap((r) => r.matches.map((m) => m.id)), [baseRounds]);
  const [liveById, setLiveById] = useState<Record<string, MasterKo>>({});

  useEffect(() => {
    if (allIds.length === 0) return;
    const col = collection(firestore, "tournaments", "2026", "matches");
    const chunks: string[][] = [];
    for (let i = 0; i < allIds.length; i += 10) chunks.push(allIds.slice(i, i + 10));

    const unsubs = chunks.map((chunk) => {
      const q = query(col, where(documentId(), "in", chunk));
      return onSnapshot(q, (snap) => {
        const next: Record<string, MasterKo> = {};
        for (const d of snap.docs) next[d.id] = d.data() as MasterKo;
        setLiveById((prev) => ({ ...prev, ...next }));
      });
    });

    return () => {
      for (const u of unsubs) u();
    };
  }, [allIds]);

  const rounds = useMemo(() => {
    return baseRounds.map((round) => ({
      ...round,
      matches: round.matches.map((m) => {
        const live = liveById[m.id];
        if (!live) return m;
        return {
          ...m,
          status: live.status ?? m.status,
          score: live.score ?? m.score,
          pens: live.pens ?? m.pens,
        };
      }),
    }));
  }, [baseRounds, liveById]);

  const finalMatch = rounds.find((r) => r.key === "final")?.matches[0];
  const bronzeMatch = rounds.find((r) => r.key === "third")?.matches[0];

  return (
    <div className="relative overflow-hidden rounded-3xl">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/assets/wallpaper.jpg)" }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#f9f9f9]/90 via-[#f9f9f9]/70 to-[#f9f9f9]" />

      <div className="relative flex flex-col gap-10 p-4 sm:p-6">
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#9ff4c9]/50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-[#096c4b]">
              Bracket 2026
            </span>
            <span className="rounded-full bg-white/70 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-600 shadow-sm">
              Resultados oficiales
            </span>
          </div>

          <h1 className="text-3xl font-black italic tracking-tighter text-slate-900 sm:text-4xl">Fase eliminatoria</h1>
          <p className="max-w-2xl text-sm text-slate-700">
            Bracket completo del Mundial 2026. Semifinales ya definidas:{" "}
            <span className="font-bold">España</span> y <span className="font-bold">Argentina</span> a la final (19 jul).
            Francia e Inglaterra disputan el 3er puesto (18 jul).
          </p>
        </header>

        <section className="grid gap-4 rounded-2xl bg-white p-6 shadow-[0_24px_48px_rgba(26,28,28,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[#3c0007]">Estructura de llaves</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">R32 → Final</div>
            </div>
            <Link
              href="/groups"
              className="cursor-pointer rounded-full bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-900 transition-colors duration-200 ease-out hover:bg-[#3c0007]/10 hover:text-[#3c0007]"
            >
              Ver grupos
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: "Dieciseisavos", value: "16" },
              { label: "Octavos", value: "8" },
              { label: "Cuartos", value: "4" },
              { label: "Semis", value: "2" },
              { label: "Final / 3er", value: "2" },
            ].map((x) => (
              <div key={x.label} className="rounded-xl bg-[#f3f3f3] p-1">
                <div className="rounded-lg bg-white px-4 py-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">{x.label}</div>
                  <div className="mt-1 text-2xl font-black italic tracking-tight text-[#3c0007]">{x.value}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <header className="flex flex-col gap-1">
            <div className="text-xs font-black uppercase tracking-[0.25em] text-[#3c0007]">Bracket</div>
            <p className="text-sm text-slate-700">Resultados oficiales. Bronce y final se actualizan en vivo desde la matriz master.</p>
          </header>

          <div className="overflow-x-auto pb-6">
            <div className="min-w-max">
              <div className="flex items-start gap-6 pr-2">
                {rounds
                  .filter((r) => r.key !== "final" && r.key !== "third")
                  .map((round) => (
                    <section key={round.key} className="w-[20rem] shrink-0">
                      <div className="mb-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">{round.title}</div>
                        <div className="text-sm font-semibold text-slate-900">{round.subtitle}</div>
                      </div>
                      <div className="flex flex-col gap-4">
                        {round.matches.map((m) => (
                          <MatchCard key={m.id} match={m} />
                        ))}
                      </div>
                    </section>
                  ))}

                <section className="w-[22rem] shrink-0">
                  <div className="mb-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Decisivos</div>
                    <div className="text-sm font-semibold text-slate-900">3er puesto · Final</div>
                  </div>

                  <div className="flex flex-col gap-4">
                    {bronzeMatch ? <MatchCard match={bronzeMatch} /> : null}

                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#3c0007] to-[#630012] p-6 text-white shadow-[0_40px_80px_rgba(26,28,28,0.10)]">
                      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#ff5d66]/20 blur-2xl" aria-hidden />
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
                          <Trophy className="h-6 w-6 text-white" aria-hidden />
                        </div>
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/70">Grand final</div>
                          <div className="text-lg font-black italic tracking-tight">19 JUL 2026 · MetLife</div>
                        </div>
                      </div>

                      {finalMatch ? (
                        <div className="mt-5 grid gap-2 rounded-2xl bg-white/10 p-2 ring-1 ring-white/10">
                          <div className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold">
                            <span>{finalMatch.home.label}</span>
                            <span className="tabular-nums font-black">
                              {finalMatch.status === "final" && finalMatch.score ? finalMatch.score.home : "—"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold">
                            <span>{finalMatch.away.label}</span>
                            <span className="tabular-nums font-black">
                              {finalMatch.status === "final" && finalMatch.score ? finalMatch.score.away : "—"}
                            </span>
                          </div>
                          <div className={`mx-auto mt-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                            finalMatch.status === "final"
                              ? "bg-[#9ff4c9]/30 text-[#9ff4c9]"
                              : "bg-white/15 text-white/80"
                          }`}>
                            {statusLabel(finalMatch.status)}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
