import { GroupStagePanel } from "@/components/GroupStagePanel";

export default function GroupsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Grupos</h1>
        <p className="text-sm text-slate-700">
          Clasificación por grupo. Se recalculará automáticamente con la matriz master cuando existan resultados.
        </p>
      </header>

      <GroupStagePanel />
    </div>
  );
}

