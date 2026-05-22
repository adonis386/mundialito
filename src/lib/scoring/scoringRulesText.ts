import type { ScoringConfig } from "@/lib/domain/types";

export type ScoringRulesCopy = {
  modeLabel: string;
  resultPlusExactLabel: string;
  bullets: string[];
  maxPointsPerMatch: number;
};

export function describeScoringRules(config: Pick<ScoringConfig, "mode" | "points">): ScoringRulesCopy {
  const { correctResult, correctDraw, exactScoreBonus } = config.points;

  if (config.mode === "resultOnly") {
    const max = Math.max(correctResult, correctDraw);
    return {
      modeLabel: "Solo resultado",
      resultPlusExactLabel: `Victoria ${correctResult} · Empate ${correctDraw}`,
      bullets: [
        "Solo cuenta acertar ganador o empate (no importa el marcador exacto).",
        `Victoria del equipo que gana: ${correctResult} punto(s).`,
        `Empate: ${correctDraw} punto(s).`,
        "Si fallas el resultado: 0 puntos en ese partido.",
      ],
      maxPointsPerMatch: max,
    };
  }

  if (config.mode === "exactScore") {
    const max = correctResult + exactScoreBonus;
    return {
      modeLabel: "Solo marcador exacto",
      resultPlusExactLabel: `Exacto: hasta ${max}`,
      bullets: [
        "Solo sumas si aciertas el marcador exacto (goles local y visitante).",
        `Marcador exacto: ${correctResult + exactScoreBonus} punto(s) (base ${correctResult} + bonus ${exactScoreBonus}).`,
        "Resultado correcto sin marcador exacto: 0 puntos.",
      ],
      maxPointsPerMatch: max,
    };
  }

  const maxWin = correctResult + exactScoreBonus;
  const maxDraw = correctDraw + exactScoreBonus;
  const max = Math.max(maxWin, maxDraw);

  return {
    modeLabel: "Mixto (resultado + marcador exacto)",
    resultPlusExactLabel: `${correctResult} + ${exactScoreBonus} (victoria) · ${correctDraw} + ${exactScoreBonus} (empate)`,
    bullets: [
      "Primero se evalúa si acertaste el resultado (ganador o empate).",
      `Victoria acertada: ${correctResult} punto(s). Empate acertado: ${correctDraw} punto(s).`,
      `Si además aciertas el marcador exacto, sumas +${exactScoreBonus} punto(s) de bonus.`,
      `Máximo por partido: ${max} pts (ej. victoria + exacto = ${maxWin}; empate + exacto = ${maxDraw}).`,
      "Los puntos se calculan con la matriz master oficial cuando el admin marca el partido como final.",
    ],
    maxPointsPerMatch: max,
  };
}
