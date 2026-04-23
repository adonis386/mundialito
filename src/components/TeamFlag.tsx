import type { GroupTeam } from "@/data/groupStage2026";
import { TEAM_FLAGS } from "@/components/teamFlagsMap";
import { getDisplayNameEs, getOfficialNameEs } from "@/lib/i18nCountry";

type TeamFlagProps = {
  team: GroupTeam;
  /** Tamaño visual de la bandera (ancho aprox. 3:2) */
  size?: "sm" | "md";
  /** Layout del componente dentro de tablas o cards */
  layout?: "stacked" | "inline";
  /** Orden del contenido cuando layout="inline" */
  inlineOrder?: "flag-name" | "name-flag";
};

const sizeClass: Record<NonNullable<TeamFlagProps["size"]>, string> = {
  sm: "h-7 w-10 sm:h-8 sm:w-12",
  md: "h-9 w-14 sm:h-10 sm:w-16",
};

export function TeamFlag({
  team,
  size = "sm",
  layout = "stacked",
  inlineOrder = "flag-name",
}: TeamFlagProps) {
  const Flag = TEAM_FLAGS[team.flag];
  const label = getDisplayNameEs(team);
  const official = getOfficialNameEs(team);

  const containerClass =
    layout === "inline"
      ? "flex min-w-0 items-center gap-2 text-left"
      : "flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center";

  const labelClass =
    layout === "inline"
      ? "whitespace-nowrap text-[11px] font-medium leading-tight text-slate-800 sm:text-xs"
      : "max-w-[5.5rem] text-[10px] font-medium leading-tight text-slate-800 sm:max-w-[6.5rem] sm:text-xs";

  const content =
    layout === "inline" && inlineOrder === "name-flag" ? (
      <>
        <span className={labelClass} lang="es">
          {label}
        </span>
        <span className="inline-flex shrink-0 rounded-lg shadow-sm ring-1 ring-black/10">
          <Flag className={`${sizeClass[size]} rounded-lg`} aria-hidden />
        </span>
      </>
    ) : (
      <>
        <span className="inline-flex shrink-0 rounded-lg shadow-sm ring-1 ring-black/10">
          <Flag className={`${sizeClass[size]} rounded-lg`} aria-hidden />
        </span>
        <span className={labelClass} lang="es">
          {label}
        </span>
      </>
    );

  return (
    <div
      className={containerClass}
      title={official && official !== label ? `${label} (${official})` : label}
    >
      {content}
    </div>
  );
}
