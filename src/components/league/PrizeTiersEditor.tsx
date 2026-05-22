"use client";

import { Plus, Trash2 } from "lucide-react";
import {
  computePrizePool,
  formatMoney,
  sumPercents,
  type PrizeTier,
} from "@/lib/league/prizes";

type Props = {
  entryFee: number | null;
  plannedParticipants: number | null;
  previewMembersCount: number;
  tiers: PrizeTier[];
  onTiersChange: (tiers: PrizeTier[]) => void;
  onEntryFeeChange?: (value: string) => void;
  onPlannedChange?: (value: string) => void;
  entryFeeInput?: string;
  plannedInput?: string;
  showFeeInputs?: boolean;
};

export function PrizeTiersEditor({
  entryFee,
  plannedParticipants,
  previewMembersCount,
  tiers,
  onTiersChange,
  onEntryFeeChange,
  onPlannedChange,
  entryFeeInput = "",
  plannedInput = "",
  showFeeInputs = true,
}: Props) {
  const pool = computePrizePool({
    entryFee,
    membersCount: previewMembersCount,
    plannedParticipants,
    tiers,
  });
  const percentSum = sumPercents(tiers);
  const percentOk = tiers.length === 0 || Math.abs(percentSum - 100) < 0.01;

  function updateTier(index: number, patch: Partial<PrizeTier>) {
    onTiersChange(tiers.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function addTier() {
    const nextPlace = tiers.length > 0 ? Math.max(...tiers.map((t) => t.place)) + 1 : 1;
    onTiersChange([...tiers, { place: nextPlace, label: `${nextPlace}º lugar`, percent: 0 }]);
  }

  function removeTier(index: number) {
    onTiersChange(tiers.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-4">
      {showFeeInputs ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-slate-900">
            Cuota por participante (USD)
            <input
              inputMode="decimal"
              value={entryFeeInput}
              onChange={(e) => onEntryFeeChange?.(e.target.value)}
              className="h-11 rounded-xl bg-slate-50 px-4 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#3c0007]/15"
              placeholder="Ej: 10"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-900">
            Participantes planificados
            <input
              inputMode="numeric"
              value={plannedInput}
              onChange={(e) => onPlannedChange?.(e.target.value)}
              className="h-11 rounded-xl bg-slate-50 px-4 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#3c0007]/15"
              placeholder="Ej: 20"
            />
            <span className="text-xs font-normal text-slate-500">
              Referencia para estimar el pozo. Si se unen más, el cálculo usa los miembros reales.
            </span>
          </label>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-bold text-slate-900">Reparto en % del pozo</div>
        <button
          type="button"
          onClick={addTier}
          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-200"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Puesto
        </button>
      </div>

      {tiers.length === 0 ? (
        <p className="text-sm text-slate-600">Sin premios en efectivo configurados.</p>
      ) : (
        <ul className="space-y-2">
          {tiers.map((tier, index) => (
            <li
              key={`${tier.place}-${index}`}
              className="grid grid-cols-[1fr_5rem_auto] items-center gap-2 rounded-xl bg-slate-50 p-2 sm:grid-cols-[1fr_4.5rem_5rem_auto]"
            >
              <input
                value={tier.label}
                onChange={(e) => updateTier(index, { label: e.target.value })}
                className="h-10 rounded-lg bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#3c0007]/15"
                aria-label="Nombre del puesto"
              />
              <input
                inputMode="decimal"
                value={String(tier.percent)}
                onChange={(e) => {
                  const n = Number.parseFloat(e.target.value.replace(",", "."));
                  updateTier(index, { percent: Number.isFinite(n) ? n : 0 });
                }}
                className="h-10 rounded-lg bg-white px-3 text-sm text-right outline-none focus-visible:ring-2 focus-visible:ring-[#3c0007]/15"
                aria-label="Porcentaje"
              />
              <span className="hidden text-xs font-semibold text-slate-500 sm:inline">%</span>
              <button
                type="button"
                onClick={() => removeTier(index)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-[#ffdad9] hover:text-[#3c0007]"
                aria-label="Quitar puesto"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {tiers.length > 0 ? (
        <p className={`text-xs font-semibold ${percentOk ? "text-[#096c4b]" : "text-[#93000a]"}`}>
          Suma de porcentajes: {percentSum.toFixed(1)}% {percentOk ? "(ok)" : "— debe ser 100%"}
        </p>
      ) : null}

      {entryFee != null && entryFee > 0 && tiers.length > 0 ? (
        <div className="rounded-xl border border-[#3c0007]/15 bg-[#fff5f5] p-4">
          <div className="text-[10px] font-black uppercase tracking-wider text-[#3c0007]">Vista previa del pozo</div>
          <p className="mt-1 text-sm text-slate-800">
            <span className="font-bold text-[#3c0007]">{formatMoney(pool.totalPool)}</span>
            {" "}= {formatMoney(entryFee)} × <span className="font-semibold">{pool.membersCount}</span> miembro(s) unidos
          </p>
          {plannedParticipants != null && plannedParticipants !== pool.membersCount ? (
            <p className="mt-1 text-xs text-slate-600">
              Planificaste {plannedParticipants} participantes ({formatMoney(pool.plannedPool ?? 0)}). Si entran más, el
              pozo crece automáticamente.
            </p>
          ) : null}
          <ul className="mt-3 space-y-1 border-t border-[#3c0007]/10 pt-3">
            {pool.payouts.map((p) => (
              <li key={p.place} className="flex justify-between text-sm">
                <span>
                  {p.label} <span className="text-slate-500">({p.percent}%)</span>
                </span>
                <span className="font-bold text-[#3c0007]">{formatMoney(p.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-xs text-slate-500">
        La app calcula montos; el cobro y pago entre panas es responsabilidad del administrador de la liga.
      </p>
    </div>
  );
}
