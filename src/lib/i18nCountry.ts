import type { GroupTeam } from "@/data/groupStage2026";
import countries from "i18n-iso-countries";
import es from "i18n-iso-countries/langs/es.json";

countries.registerLocale(es);

/** Texto visible: el que validaste en datos (`nameEs`). */
export function getDisplayNameEs(team: GroupTeam): string {
  return team.nameEs;
}

/** Nombre oficial ES desde i18n (si hay ISO); útil para accesibilidad / tooltips. */
export function getOfficialNameEs(team: GroupTeam): string | undefined {
  if (!team.iso2) return undefined;
  return countries.getName(team.iso2, "es") ?? undefined;
}
