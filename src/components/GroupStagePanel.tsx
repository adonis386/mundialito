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
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <header className="mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="group-stage-heading" className="text-lg font-semibold text-slate-900">
              Clasificación (fase de grupos)
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Top 2 clasifican directo. El 3° puede avanzar si entra en los 8 mejores terceros.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            Grupo
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value as typeof selectedGroupId)}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
              aria-label="Seleccionar grupo"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.id}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="rounded-t-2xl bg-emerald-700 px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-white sm:text-base">GRUPO {selectedGroup?.id}</div>
            <div className="text-xs font-medium text-emerald-100">
              {isLoading ? "Cargando..." : loadError ? "Error" : "Actualizado"}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto px-3 pb-4 pt-3 sm:px-4">
          {loadError ? (
            <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {loadError}
            </div>
          ) : null}

          <table className="min-w-max w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-emerald-800 px-2 py-2 text-center text-xs font-semibold text-white">#</th>
                <th className="bg-emerald-800 px-2 py-2 text-left text-xs font-semibold text-white">Equipo</th>
                {statLabels.map((label) => (
                  <th
                    key={label}
                    className="bg-emerald-800 px-2 py-2 text-center text-[11px] font-semibold text-white"
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
                const rowClass =
                  state === "next"
                    ? "border-l-4 border-emerald-500 bg-emerald-50/40"
                    : state === "third"
                      ? "border-l-4 border-amber-500 bg-amber-50/40"
                      : "border-l-4 border-rose-500 bg-rose-50/30";
                return (
                  <tr
                    key={`${selectedGroup.id}-${row.key}`}
                    className={`border-t border-slate-200 ${rowClass}`}
                  >
                    <td className="whitespace-nowrap px-2 py-2 text-center text-sm font-semibold text-slate-900">
                      {rank}
                    </td>
                    <td className="px-2 py-2 text-sm text-slate-900">
                      <TeamFlag team={row.team} size="sm" layout="inline" />
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

      <div className="mt-6 rounded-2xl bg-emerald-700 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-white">LEYENDA</div>
            <div className="text-xs font-medium text-emerald-100">Clasificación y estado</div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-xs font-medium text-white">
              <span className="h-4 w-4 rounded-sm bg-emerald-300" aria-hidden />
              Siguiente ronda
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-amber-100">
              <span className="h-4 w-4 rounded-sm bg-amber-400" aria-hidden />
              Mejor 3° (top 8)
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-rose-100">
              <span className="h-4 w-4 rounded-sm bg-rose-500" aria-hidden />
              Eliminado
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
