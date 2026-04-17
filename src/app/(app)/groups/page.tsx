import { GroupStagePanel } from "@/components/GroupStagePanel";

export default function GroupsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="text-xs font-black uppercase tracking-[0.25em] text-[#3c0007]">Group Stage</div>
        <h1 className="text-3xl font-black italic tracking-tighter text-slate-900 sm:text-4xl">Clasificación</h1>
        <p className="text-sm text-slate-700">
          Top 2 clasifican directo. El 3° puede avanzar si entra en los 8 mejores terceros (según criterios).
        </p>
      </header>

      <GroupStagePanel />
    </div>
  );
}

