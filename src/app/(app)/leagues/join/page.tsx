"use client";

import { useEffect, useMemo, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { onAuthStateChanged } from "firebase/auth";
import { functions, firebaseAuth } from "@/lib/firebase/client";
import { useRouter } from "next/navigation";

export default function JoinLeaguePage() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  const normalized = useMemo(() => code.trim().toUpperCase(), [code]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!uid) {
      setError("Debes iniciar sesión para unirte a una liga.");
      return;
    }
    if (!normalized) {
      setError("Ingresa un código.");
      return;
    }

    try {
      setBusy(true);
      const fn = httpsCallable(functions, "joinLeague");
      const res = (await fn({ joinCode: normalized })) as any;
      const data = res.data as { ok?: boolean; leagueId?: string };
      if (!data?.ok || !data.leagueId) throw new Error("No se pudo unir a la liga.");
      router.push(`/leagues/${data.leagueId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error uniéndote a la liga.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Unirse a una liga</h1>
        <p className="mt-1 text-sm text-slate-700">Ingresa el código de invitación. Esta acción se valida en el servidor.</p>
      </header>

      <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-[0_24px_48px_rgba(26,28,28,0.04)]">
        <label className="block text-sm font-medium text-slate-900" htmlFor="code">
          Código
        </label>
        <input
          id="code"
          name="code"
          inputMode="text"
          autoComplete="one-time-code"
          className="mt-2 w-full rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-900/10"
          placeholder="Ej: ABCD-1234"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button
          type="submit"
          disabled={busy}
          className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-br from-[#3c0007] to-[#630012] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {busy ? "Uniéndome..." : "Unirme"}
        </button>
        {error ? <div className="mt-3 rounded-xl bg-[#ffdad6] px-3 py-2 text-sm text-[#93000a]">{error}</div> : null}
        <p className="mt-3 text-xs text-slate-500">Tip: el código lo genera el creador de la liga (ej. ABCD-1234).</p>
      </form>
    </div>
  );
}

