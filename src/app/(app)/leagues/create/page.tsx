"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { firebaseAuth, functions } from "@/lib/firebase/client";

function formatCallableError(err: unknown) {
  const anyErr = err as any;
  const code = typeof anyErr?.code === "string" ? anyErr.code : null;
  const message = typeof anyErr?.message === "string" ? anyErr.message : null;

  // Firebase Functions often yields codes like "functions/internal", "functions/not-found", etc.
  const normalizedCode = code?.startsWith("functions/") ? code : code ? `functions/${code}` : null;

  if (normalizedCode && message) return `${normalizedCode}: ${message}`;
  if (normalizedCode) return normalizedCode;
  if (message) return message;
  return "Error creando liga.";
}

export default function CreateLeaguePage() {
  const [uid, setUid] = useState<string | null>(null);
  const [name, setName] = useState("Panas del trabajo");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ leagueId: string; joinCode: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  const trimmed = useMemo(() => name.trim(), [name]);
  const canSubmit = Boolean(uid) && trimmed.length >= 3 && trimmed.length <= 80 && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCopied(false);
    setResult(null);

    if (!uid) {
      setError("Debes iniciar sesión para crear una liga.");
      return;
    }
    if (trimmed.length < 3 || trimmed.length > 80) {
      setError("Nombre inválido. Usa entre 3 y 80 caracteres.");
      return;
    }

    try {
      setBusy(true);
      const fn = httpsCallable(functions, "createLeague");
      const res = (await fn({ name: trimmed })) as any;
      const data = res.data as { ok?: boolean; leagueId?: string; joinCode?: string };
      if (!data?.ok || !data.leagueId || !data.joinCode) throw new Error("No se pudo crear la liga.");
      setResult({ leagueId: data.leagueId, joinCode: data.joinCode });
    } catch (err) {
      setError(formatCallableError(err));
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    if (!result?.joinCode) return;
    try {
      await navigator.clipboard.writeText(result.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <header className="mb-6 flex flex-col gap-2">
        <div className="text-xs font-black uppercase tracking-[0.25em] text-[#3c0007]">Leagues</div>
        <h1 className="text-3xl font-black italic tracking-tighter text-slate-900 sm:text-4xl">Crear liga privada</h1>
        <p className="text-sm text-slate-700">
          Ponle un nombre. Te daremos un código de invitación para compartir con tus panas.
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_48px_rgba(26,28,28,0.04)]">
        <div className="h-1 w-full bg-gradient-to-r from-[#3c0007] via-[#630012] to-[#096c4b]" />
        <form onSubmit={submit} className="flex flex-col gap-4 p-6">
          <label className="grid gap-2 text-sm font-semibold text-slate-900" htmlFor="leagueName">
            Nombre de la liga
            <input
              id="leagueName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 w-full rounded-xl bg-slate-50 px-4 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#3c0007]/15"
              placeholder="Ej: Panas del trabajo"
              autoComplete="off"
            />
          </label>

          {!uid ? (
            <div className="rounded-xl bg-[#ffdad6] px-3 py-2 text-sm text-[#93000a]">
              Debes iniciar sesión para crear una liga.{" "}
              <Link className="font-semibold underline underline-offset-2" href="/login">
                Ir a /login
              </Link>
              .
            </div>
          ) : null}

          {error ? <div className="rounded-xl bg-[#ffdad6] px-3 py-2 text-sm text-[#93000a]">{error}</div> : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-br from-[#3c0007] to-[#630012] px-6 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Creando..." : "Crear liga"}
          </button>
        </form>
      </section>

      {result ? (
        <section className="mt-6 rounded-2xl bg-[#f3f3f3] p-5">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Código de invitación</div>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-2xl font-black italic tracking-tight text-[#3c0007]">{result.joinCode}</div>
            <button
              type="button"
              onClick={copyCode}
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-900 shadow-sm hover:bg-slate-50"
            >
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <div className="mt-3 text-sm text-slate-700">
            Comparte este código. Luego pueden unirse desde{" "}
            <Link className="font-semibold underline underline-offset-2" href="/leagues/join">
              /leagues/join
            </Link>
            .
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/leagues/${result.leagueId}`}
              className="inline-flex flex-1 items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-[#3c0007]"
            >
              Ver tabla
            </Link>
            <Link
              href="/leagues"
              className="inline-flex flex-1 items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-900 shadow-sm hover:bg-slate-50"
            >
              Volver a ligas
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}

