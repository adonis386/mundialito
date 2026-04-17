import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <h1 className="text-2xl font-black italic tracking-tighter text-slate-900">No encontramos esa página</h1>
      <p className="text-sm text-slate-700">Revisa el link o vuelve al inicio.</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-[#3c0007] to-[#630012] px-5 py-2.5 text-sm font-bold text-white"
        >
          Ir al inicio
        </Link>
        <Link
          href="/matches"
          className="inline-flex items-center justify-center rounded-full bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-900 hover:bg-slate-200"
        >
          Ver partidos
        </Link>
      </div>
    </div>
  );
}

