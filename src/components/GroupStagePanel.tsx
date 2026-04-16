import { GROUP_STAGE_2026 } from "@/data/groupStage2026";
import { TeamFlag } from "@/components/TeamFlag";

export function GroupStagePanel() {
  return (
    <section
      aria-labelledby="group-stage-heading"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="group-stage-heading" className="text-lg font-semibold text-slate-900">
            Fase de grupos
          </h2>
          <p className="text-sm text-slate-600">
            12 grupos (A–L), 4 selecciones por grupo. Banderas:{" "}
            <span className="font-medium text-slate-800">country-flag-icons</span>. Nombres mostrados según la
            tabla validada; si hay código ISO, el nombre oficial en español aparece en el tooltip al pasar el
            cursor (<span className="font-medium text-slate-800">i18n-iso-countries</span>).
          </p>
        </div>
      </div>

      <ul className="flex flex-col divide-y divide-slate-100">
        {GROUP_STAGE_2026.map((group) => (
          <li key={group.id} className="grid grid-cols-1 gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,7rem)_1fr] sm:items-center sm:gap-4">
            <div className="text-sm font-semibold text-slate-800 sm:text-base">{group.label}</div>
            <div className="flex flex-wrap justify-start gap-4 sm:gap-6">
              {group.teams.map((team) => (
                <TeamFlag key={`${group.id}-${team.flag}-${team.nameEs}`} team={team} size="md" />
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
