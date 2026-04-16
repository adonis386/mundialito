import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";

export default function LeaguesPage() {
  const leaguesCount = 0;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Ligas</h1>
        <p className="text-sm text-slate-700">
          Crea ligas privadas y compite con tu grupo. Todos dependen de la misma matriz de
          resultados oficiales.
        </p>
      </header>

      {leaguesCount === 0 ? (
        <EmptyState
          title="Aún no perteneces a ninguna liga"
          description="Crea una liga o únete con un código de invitación."
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
              >
                Crear liga
              </button>
              <Link
                href="/leagues/join"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
              >
                Unirme con código
              </Link>
            </div>
          }
        />
      ) : null}
    </div>
  );
}

