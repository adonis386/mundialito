import { EmptyState } from "@/components/EmptyState";
import { GroupStagePanel } from "@/components/GroupStagePanel";
import { Skeleton } from "@/components/Skeleton";

export default function MatchesPage() {
  const isLoading = false;
  const matchesCount = 0;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Partidos</h1>
        <p className="text-sm text-slate-700">
          Tus picks se cierran automáticamente antes del kickoff (según la matriz master).
        </p>
      </header>

      <div id="grupos">
        <GroupStagePanel />
      </div>

      <section aria-labelledby="matches-calendar-heading" className="flex flex-col gap-3">
        <h2 id="matches-calendar-heading" className="text-base font-semibold text-slate-900">
          Calendario de partidos
        </h2>
        <p className="text-sm text-slate-600">
          Cuando la matriz master tenga fechas y cruces, aparecerán aquí.
        </p>
      </section>

      {isLoading ? (
        <section className="grid gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Skeleton className="h-5 w-40" />
            <div className="mt-3 grid gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Skeleton className="h-5 w-48" />
            <div className="mt-3 grid gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </section>
      ) : matchesCount === 0 ? (
        <EmptyState
          title="Todavía no hay partidos cargados"
          description="Un admin debe cargar el calendario del Mundial 2026 en la matriz master (Firestore)."
        />
      ) : null}
    </div>
  );
}

