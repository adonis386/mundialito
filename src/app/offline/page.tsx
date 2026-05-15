import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#f9f9f9] px-6 text-center">
      <div className="rounded-2xl bg-white p-8 shadow-[0_24px_48px_rgba(26,28,28,0.06)]">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#3c0007]">Sin conexión</p>
        <h1 className="mt-2 text-2xl font-black italic tracking-tight text-[#1a1c1c]">Estás offline</h1>
        <p className="mt-3 max-w-sm text-sm text-[#45464f]">
          No hay red. Revisa tu conexión y vuelve a intentar. Los datos en caché pueden seguir disponibles en algunas
          pantallas.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-[#3c0007] to-[#630012] px-6 py-3 text-sm font-bold text-white"
        >
          Reintentar
        </Link>
      </div>
    </div>
  );
}
