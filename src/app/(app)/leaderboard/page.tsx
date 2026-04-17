import { EmptyState } from "@/components/EmptyState";

export default function LeaderboardPage() {
  const hasLeaderboard = false;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Ranking global</h1>
        <p className="text-sm text-slate-700">
          Tabla materializada para lectura rápida. Se recalcula cuando se finaliza un partido en la matriz master.
        </p>
      </header>

      {!hasLeaderboard ? (
        <EmptyState
          title="Aún no hay ranking"
          description="Cuando un admin finalice el primer partido, Functions generará el leaderboard global."
        />
      ) : null}
    </div>
  );
}

