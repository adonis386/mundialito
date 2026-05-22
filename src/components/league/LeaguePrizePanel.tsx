"use client";

import { useMemo, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { PrizeTiersEditor } from "@/components/league/PrizeTiersEditor";
import {
  computePrizePool,
  DEFAULT_PRIZE_TIERS,
  formatMoney,
  normalizeTiersForSubmit,
  sumPercents,
  type PrizeTier,
} from "@/lib/league/prizes";
import { functions } from "@/lib/firebase/client";

type LeaguePrizeData = {
  entryFee?: number | null;
  plannedParticipants?: number | null;
  prizeTiers?: PrizeTier[];
  prizeDescription?: string | null;
  membersCount?: number;
};

type Props = {
  leagueId: string;
  league: LeaguePrizeData | null;
  canEdit: boolean;
};

export function LeaguePrizePanel({ leagueId, league, canEdit }: Props) {
  const membersCount = Number(league?.membersCount ?? 0);
  const tiers = useMemo(() => {
    const raw = league?.prizeTiers;
    if (!Array.isArray(raw) || raw.length === 0) return [];
    return raw.map((t, i) => ({
      place: Number(t.place ?? i + 1),
      label: String(t.label ?? `Puesto ${i + 1}`),
      percent: Number(t.percent ?? 0),
    }));
  }, [league?.prizeTiers]);
  const hasTiers = tiers.length > 0;
  const hasLegacyText = Boolean(league?.prizeDescription?.trim()) && !hasTiers;

  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entryFeeInput, setEntryFeeInput] = useState("");
  const [plannedInput, setPlannedInput] = useState("");
  const [editTiers, setEditTiers] = useState<PrizeTier[]>(DEFAULT_PRIZE_TIERS);

  const pool = useMemo(
    () =>
      computePrizePool({
        entryFee: league?.entryFee,
        membersCount,
        plannedParticipants: league?.plannedParticipants,
        tiers: hasTiers ? tiers : [],
      }),
    [league, membersCount, tiers, hasTiers]
  );

  const parsedFeeEdit = useMemo(() => {
    const raw = entryFeeInput.trim();
    if (!raw) return null;
    const n = Number.parseFloat(raw.replace(",", "."));
    return Number.isFinite(n) && n >= 0 ? n : null;
  }, [entryFeeInput]);

  const parsedPlannedEdit = useMemo(() => {
    const raw = plannedInput.trim();
    if (!raw) return null;
    const n = Math.floor(Number.parseFloat(raw.replace(",", ".")));
    return Number.isFinite(n) && n >= 1 ? n : null;
  }, [plannedInput]);

  function startEdit() {
    setEntryFeeInput(league?.entryFee != null && league.entryFee > 0 ? String(league.entryFee) : "");
    setPlannedInput(league?.plannedParticipants != null ? String(league.plannedParticipants) : "");
    setEditTiers(hasTiers ? [...tiers] : [...DEFAULT_PRIZE_TIERS]);
    setEditing(true);
    setError(null);
  }

  async function save() {
    setError(null);
    const normalized = normalizeTiersForSubmit(editTiers);
    if (parsedFeeEdit != null && parsedFeeEdit > 0 && normalized.length > 0) {
      if (Math.abs(sumPercents(normalized) - 100) > 0.01) {
        setError("Los porcentajes deben sumar 100%.");
        return;
      }
    }
    try {
      setBusy(true);
      const fn = httpsCallable(functions, "updateLeaguePrizeSettings");
      await fn({
        leagueId,
        entryFee: parsedFeeEdit,
        plannedParticipants: parsedPlannedEdit,
        prizeTiers: normalized.length > 0 ? normalized : [],
      });
      setEditing(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo guardar.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  if (editing && canEdit) {
    return (
      <section className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_48px_rgba(26,28,28,0.04)]">
        <div className="bg-gradient-to-br from-[#630012] to-[#3c0007] px-4 py-3">
          <div className="text-sm font-black italic tracking-tighter text-white">Editar premios</div>
        </div>
        <div className="p-4">
          <PrizeTiersEditor
            entryFee={parsedFeeEdit}
            plannedParticipants={parsedPlannedEdit}
            previewMembersCount={membersCount}
            tiers={editTiers}
            onTiersChange={setEditTiers}
            entryFeeInput={entryFeeInput}
            plannedInput={plannedInput}
            onEntryFeeChange={setEntryFeeInput}
            onPlannedChange={setPlannedInput}
          />
          {error ? <div className="mt-3 text-sm text-[#93000a]">{error}</div> : null}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-slate-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void save()}
              className="rounded-full bg-[#3c0007] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {busy ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_48px_rgba(26,28,28,0.04)]">
      <div className="flex items-start justify-between gap-3 bg-gradient-to-br from-[#630012] to-[#3c0007] px-4 py-3">
        <div>
          <div className="text-sm font-black italic tracking-tighter text-white">Premios</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">
            Porcentajes del pozo · visible para participantes
          </div>
        </div>
        {canEdit ? (
          <button
            type="button"
            onClick={startEdit}
            className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white hover:bg-white/25"
          >
            Editar
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 p-4">
        {hasLegacyText ? (
          <div className="rounded-xl bg-[#f9f9f9] px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Acuerdo (texto)</div>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-800">{league?.prizeDescription}</p>
          </div>
        ) : null}

        {!hasTiers && !hasLegacyText ? (
          <p className="text-sm text-slate-600">
            Esta liga no tiene premios en efectivo configurados.
            {canEdit ? " Pulsa Editar para definir cuota, participantes y porcentajes." : null}
          </p>
        ) : null}

        {hasTiers ? (
          <>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cuota</dt>
                <dd className="font-semibold text-[#3c0007]">
                  {pool.entryFee > 0 ? formatMoney(pool.entryFee) : "Gratis"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Miembros unidos</dt>
                <dd className="font-semibold">{pool.membersCount}</dd>
              </div>
              {pool.plannedParticipants != null ? (
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Planificados</dt>
                  <dd>{pool.plannedParticipants}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pozo total</dt>
                <dd className="text-lg font-black text-[#3c0007]">
                  {pool.totalPool > 0 ? formatMoney(pool.totalPool) : "—"}
                </dd>
              </div>
            </dl>

            {pool.plannedParticipants != null && pool.membersCount > pool.plannedParticipants ? (
              <p className="rounded-lg bg-[#f0fff7] px-3 py-2 text-xs text-[#096c4b]">
                Hay más miembros unidos ({pool.membersCount}) que los planificados ({pool.plannedParticipants}). El
                pozo se calculó con los {pool.membersCount} actuales.
              </p>
            ) : null}

            <ul className="divide-y divide-slate-200/80 rounded-xl border border-slate-200/80">
              {pool.payouts.map((p) => (
                <li key={p.place} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{p.label}</div>
                    <div className="text-xs text-slate-500">{p.percent}% del pozo</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-[#3c0007]">
                      {pool.totalPool > 0 ? formatMoney(p.amount) : "—"}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </section>
  );
}
