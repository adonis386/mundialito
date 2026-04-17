"use client";

import { GROUP_STAGE_2026 } from "@/data/groupStage2026";
import { MATCHDAY_1 } from "@/data/matchday1";
import { MATCHDAY_2 } from "@/data/matchday2";
import { MATCHDAY_3 } from "@/data/matchday3";
import { TeamFlag } from "@/components/TeamFlag";
import { firestore } from "@/lib/firebase/client";
import { collection, documentId, getDocs, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

export function GroupStagePanel() {
  const statLabels = ["PTS", "PJ", "PG", "PE", "PP", "GF", "GC", "DG"] as const;

  const groups = GROUP_STAGE_2026;
  const [selectedGroupId, setSelectedGroupId] = useState<(typeof groups)[number]["id"]>(
    groups[0]?.id ?? "A"
  );

  const selectedGroup = useMemo(() => {
    return groups.find((g) => g.id === selectedGroupId) ?? groups[0];
  }, [groups, selectedGroupId]);

  type MasterMatch = {
    status: "scheduled" | "live" | "final";
    score?: { home: number; away: number };
    kickoffAt?: unknown;
    version?: number;
  };

  const [isLoading, setIsLoading] = useState(false);
  const [masterById, setMasterById] = useState<Record<string, MasterMatch>>({});
  const [loadError, setLoadError] = useState<string | null>(null);

  const allFixtures = useMemo(() => [...MATCHDAY_1, ...MATCHDAY_2, ...MATCHDAY_3], []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoadError(null);
        setIsLoading(true);

        const ids = allFixtures.map((f) => f.id);
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
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Error cargando resultados.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [allFixtures]);

  type Row = {
    key: string;
    team: (typeof selectedGroup)["teams"][number];
    pts: number;
    pj: number;
    pg: number;
    pe: number;
    pp: number;
    gf: number;
    gc: number;
    dg: number;
  };

  function teamKey(team: { iso2?: string; flag: string }) {
    return team.iso2 ? team.iso2 : team.flag;
  }

  const fixturesByGroupId = useMemo(() => {
    const map: Record<string, typeof allFixtures> = {};

    for (const g of groups) {
      const keys = new Set(g.teams.map(teamKey));
      map[g.id] = allFixtures.filter((fx) => keys.has(teamKey(fx.home)) && keys.has(teamKey(fx.away)));
    }

    return map as Record<(typeof groups)[number]["id"], typeof allFixtures>;
  }, [allFixtures, groups]);

  const standingsByGroupId = useMemo(() => {
    const result: Record<(typeof groups)[number]["id"], Row[]> = {} as any;

    for (const g of groups) {
      const rows: Record<string, Row> = {};
      for (const t of g.teams) {
        const key = teamKey(t);
        rows[key] = {
          key,
          team: t,
          pts: 0,
          pj: 0,
          pg: 0,
          pe: 0,
          pp: 0,
          gf: 0,
          gc: 0,
          dg: 0,
        };
      }

      for (const fx of fixturesByGroupId[g.id] ?? []) {
        const master = masterById[fx.id];
        if (!master || master.status !== "final" || !master.score) continue;

        const home = rows[teamKey(fx.home)];
        const away = rows[teamKey(fx.away)];
        if (!home || !away) continue;

        home.pj += 1;
        away.pj += 1;
        home.gf += master.score.home;
        home.gc += master.score.away;
        away.gf += master.score.away;
        away.gc += master.score.home;

        if (master.score.home > master.score.away) {
          home.pg += 1;
          away.pp += 1;
          home.pts += 3;
        } else if (master.score.home < master.score.away) {
          away.pg += 1;
          home.pp += 1;
          away.pts += 3;
        } else {
          home.pe += 1;
          away.pe += 1;
          home.pts += 1;
          away.pts += 1;
        }
      }

      for (const r of Object.values(rows)) r.dg = r.gf - r.gc;

      result[g.id] = Object.values(rows).sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.dg !== a.dg) return b.dg - a.dg;
        if (b.gf !== a.gf) return b.gf - a.gf;
        return a.team.nameEs.localeCompare(b.team.nameEs, "es");
      });
    }

    return result;
  }, [fixturesByGroupId, groups, masterById]);

  const qualifiedThirdKeys = useMemo(() => {
    // Best 8 third-placed teams across 12 groups.
    const thirds: Array<Row & { groupId: (typeof groups)[number]["id"] }> = [];
    for (const g of groups) {
      const rows = standingsByGroupId[g.id] ?? [];
      if (rows.length >= 3) thirds.push({ ...rows[2]!, groupId: g.id });
    }

    thirds.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.dg !== a.dg) return b.dg - a.dg;
      if (b.gf !== a.gf) return b.gf - a.gf;
      // Fair play not implemented (no data). Keep deterministic fallback.
      return a.team.nameEs.localeCompare(b.team.nameEs, "es");
    });

    return new Set(thirds.slice(0, 8).map((t) => t.key));
  }, [groups, standingsByGroupId]);

  const tableRows = useMemo(() => {
    if (!selectedGroup) return [];
    return standingsByGroupId[selectedGroup.id] ?? [];
  }, [selectedGroup, standingsByGroupId]);

  type LegendState = "next" | "third" | "out";
  function legendState(rank: number, rowKey: string): LegendState {
    if (rank <= 2) return "next";
    if (rank === 3) return qualifiedThirdKeys.has(rowKey) ? "third" : "out";
    return "out";
  }

  return (
    <section
      aria-labelledby="group-stage-heading"
      className="rounded-2xl bg-[#f3f3f3] p-4 shadow-[0_24px_48px_rgba(26,28,28,0.04)] sm:p-6"
    >
      <header className="mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="group-stage-heading" className="text-lg font-black italic tracking-tighter text-slate-900 sm:text-xl">
              Group Standings
            </h2>
            <p className="mt-1 text-sm text-slate-600">Actualiza con la matriz master cuando existan resultados.</p>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-full bg-[#eeeeee] p-1 sm:justify-start">
            <span className="pl-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Grupo</span>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value as typeof selectedGroupId)}
              className="h-10 rounded-full bg-white px-4 text-sm font-bold text-slate-900 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#3c0007]/15"
              aria-label="Seleccionar grupo"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.id}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_48px_rgba(26,28,28,0.04)]">
        <div className="bg-gradient-to-br from-[#3c0007] to-[#630012] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-black italic tracking-tighter text-white sm:text-base">
              GRUPO {selectedGroup?.id}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">
              {isLoading ? "Cargando..." : loadError ? "Error" : "Actualizado"}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto px-3 pb-4 pt-3 sm:px-4">
          {loadError ? (
            <div className="mb-3 rounded-xl bg-[#ffdad6] px-3 py-2 text-sm text-[#93000a]">{loadError}</div>
          ) : null}

          <table className="min-w-max w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-[#eeeeee] px-2 py-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-600">
                  #
                </th>
                <th className="bg-[#eeeeee] px-2 py-2 text-left text-[10px] font-black uppercase tracking-widest text-slate-600">
                  Equipo
                </th>
                {statLabels.map((label) => (
                  <th
                    key={label}
                    className="bg-[#eeeeee] px-2 py-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-600"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, idx) => {
                const rank = idx + 1;
                const state = legendState(rank, row.key);
                const rowTone =
                  idx % 2 === 0 ? "bg-white" : "bg-[#f3f3f3]";
                const accent =
                  state === "next"
                    ? "bg-[#9ff4c9]/60 text-[#096c4b]"
                    : state === "third"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-[#ffdad6] text-[#93000a]";
                return (
                  <tr
                    key={`${selectedGroup.id}-${row.key}`}
                    className={rowTone}
                  >
                    <td className="whitespace-nowrap px-2 py-2 text-center text-sm font-semibold text-slate-900">
                      {rank}
                    </td>
                    <td className="px-2 py-2 text-sm text-slate-900">
                      <div className="flex items-center justify-between gap-3">
                        <TeamFlag team={row.team} size="sm" layout="inline" />
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${accent}`}>
                          {state === "next" ? "CLASIFICA" : state === "third" ? "3° TOP 8" : "OUT"}
                        </span>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-2 py-2 text-center text-sm font-semibold text-slate-900">
                      {row.pts}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-center text-sm text-slate-900">{row.pj}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-center text-sm text-slate-900">{row.pg}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-center text-sm text-slate-900">{row.pe}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-center text-sm text-slate-900">{row.pp}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-center text-sm text-slate-900">{row.gf}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-center text-sm text-slate-900">{row.gc}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-center text-sm text-slate-900">{row.dg}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-gradient-to-br from-[#3c0007] to-[#630012] p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-black italic tracking-tighter text-white">LEYENDA</div>
            <div className="text-xs font-medium text-white/70">Clasificación y estado</div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <span className="h-4 w-4 rounded-sm bg-[#9ff4c9]" aria-hidden />
              Siguiente ronda
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <span className="h-4 w-4 rounded-sm bg-amber-300" aria-hidden />
              Mejor 3° (top 8)
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <span className="h-4 w-4 rounded-sm bg-[#ffdad6]" aria-hidden />
              Eliminado
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
