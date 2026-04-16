export default function JoinLeaguePage() {
  return (
    <div className="mx-auto w-full max-w-md">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Unirse a una liga</h1>
        <p className="mt-1 text-sm text-slate-700">
          Ingresa el código de invitación. Esta acción se valida en el servidor.
        </p>
      </header>

      <form className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium text-slate-900" htmlFor="code">
          Código
        </label>
        <input
          id="code"
          name="code"
          inputMode="text"
          autoComplete="one-time-code"
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-900/20"
          placeholder="Ej: ABCD-1234"
        />
        <button
          type="submit"
          className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
        >
          Unirme
        </button>
        <p className="mt-3 text-xs text-slate-500">
          Próximo paso: llamar a la Cloud Function `joinLeague`.
        </p>
      </form>
    </div>
  );
}

