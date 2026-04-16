import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-md">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-slate-700">
          Para jugar necesitas una cuenta. Luego podrás crear o unirte a ligas privadas.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-700">
          Esta pantalla es un placeholder: el siguiente paso es conectar Firebase Auth.
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
          >
            Continuar con Google
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
          >
            Entrar con email
          </button>
        </div>

        <p className="mt-5 text-xs text-slate-500">
          Al continuar aceptas las reglas de tu liga.{" "}
          <Link className="underline underline-offset-2 hover:text-slate-700" href="/">
            Volver al inicio
          </Link>
        </p>
      </section>
    </div>
  );
}

