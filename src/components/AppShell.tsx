import Link from "next/link";

type NavItem = {
  href: string;
  label: string;
};

const nav: NavItem[] = [
  { href: "/matches#grupos", label: "Grupos" },
  { href: "/matches", label: "Partidos" },
  { href: "/leagues", label: "Ligas" },
  { href: "/leaderboard", label: "Ranking" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-slate-900 focus:shadow"
      >
        Saltar a contenido principal
      </a>

      <header className="border-b border-slate-200/60 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-semibold text-slate-900">
              Quiniela 2026
            </Link>
            <span className="hidden text-xs text-slate-500 sm:inline">Matriz master + ligas</span>
          </div>

          <nav aria-label="Navegación principal" className="flex items-center gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="ml-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
            >
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}

