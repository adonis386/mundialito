"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup } from "firebase/auth";

import { firebaseAuth } from "@/lib/firebase/client";

export default function LoginPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (u) => {
      setUserEmail(u?.email ?? null);
    });
    return () => unsub();
  }, []);

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(firebaseAuth, provider);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error iniciando sesión.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-slate-700">
          Para jugar necesitas una cuenta. Luego podrás crear o unirte a ligas privadas.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {userEmail ? (
          <p className="text-sm text-slate-700">
            Sesión activa como <span className="font-semibold text-slate-900">{userEmail}</span>.
          </p>
        ) : (
          <p className="text-sm text-slate-700">Entra con Google para guardar tus picks y participar en rankings.</p>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
          >
            {busy ? "Entrando..." : "Continuar con Google"}
          </button>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            El panel <span className="font-semibold">Admin</span> usa email/contraseña (sin Google).
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
        ) : null}

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

