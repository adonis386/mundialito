export default function HomePage() {
  return (
    <main className="min-h-dvh bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-medium text-slate-600">Quiniela</p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Mundial 2026
          </h1>
          <p className="max-w-prose text-pretty text-slate-700">
            Crea tu liga privada, invita amigos y compite en el ranking global. Tus
            puntos se calculan con una matriz master de resultados oficiales.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Ligas privadas</h2>
            <p className="mt-1 text-sm text-slate-700">
              Ranking por liga, código de invitación, y control de miembros.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Ranking global</h2>
            <p className="mt-1 text-sm text-slate-700">
              Tabla precalculada para carga rápida en móvil.
            </p>
          </div>
        </section>

        <footer className="text-xs text-slate-500">
          Próximo paso: conectar Firebase Auth + Firestore + Functions.
        </footer>
      </div>
    </main>
  );
}

