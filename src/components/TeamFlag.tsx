import type { GroupTeam } from "@/data/groupStage2026";
import { TEAM_FLAGS } from "@/components/teamFlagsMap";
import { getDisplayNameEs, getOfficialNameEs } from "@/lib/i18nCountry";

type TeamFlagProps = {
  team: GroupTeam;
  /** Tamaño visual de la bandera (ancho aprox. 3:2) */
  size?: "sm" | "md";
};

const sizeClass: Record<NonNullable<TeamFlagProps["size"]>, string> = {
  sm: "h-7 w-10 sm:h-8 sm:w-12",
  md: "h-9 w-14 sm:h-10 sm:w-16",
};

export function TeamFlag({ team, size = "sm" }: TeamFlagProps) {
  const Flag = TEAM_FLAGS[team.flag];
  const label = getDisplayNameEs(team);
  const official = getOfficialNameEs(team);

  return (
    <div
      className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center"
      title={official && official !== label ? `${label} (${official})` : label}
    >
      <span className="inline-flex shrink-0 rounded-md shadow-sm ring-1 ring-black/10">
        <Flag
          className={`${sizeClass[size]} rounded-md`}
          aria-hidden
        />
      </span>
      <span
        className="max-w-[5.5rem] text-[10px] font-medium leading-tight text-slate-800 sm:max-w-[6.5rem] sm:text-xs"
        lang="es"
      >
        {label}
      </span>
    </div>
  );
}
