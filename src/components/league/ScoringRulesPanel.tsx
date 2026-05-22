import { describeScoringRules } from "@/lib/scoring/scoringRulesText";
import type { ScoringConfig } from "@/lib/domain/types";

type Props = {
  config: Pick<ScoringConfig, "mode" | "points">;
  compact?: boolean;
};

export function ScoringRulesPanel({ config, compact = false }: Props) {
  const copy = describeScoringRules(config);

  if (compact) {
    return (
      <p className="text-sm text-slate-700">
        <span className="font-semibold text-[#3c0007]">{copy.modeLabel}</span>
        <span className="text-slate-500"> · </span>
        {copy.resultPlusExactLabel}
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-[#3c0007]/10 bg-[#f9f9f9] p-4">
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3c0007]">Reparto de puntos</div>
      <p className="mt-1 text-sm font-bold text-slate-900">{copy.modeLabel}</p>
      <p className="mt-0.5 text-xs font-semibold text-[#096c4b]">{copy.resultPlusExactLabel}</p>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
        {copy.bullets.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
