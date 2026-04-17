"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup } from "firebase/auth";
import { BadgeCheck, Crown, Loader2, LogIn, Shield } from "lucide-react";

import { firebaseAuth } from "@/lib/firebase/client";

function GoogleMark(props: { className?: string }) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

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
    <main className="min-h-[calc(100vh-4rem)]">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 lg:min-h-[calc(100vh-6rem)] lg:grid-cols-2">
        {/* Left / cinematic */}
        <section className="relative hidden overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-[#3c0007]" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#3c0007]/95 to-[#630012]/80" />
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#9ff4c9]/10 blur-3xl" />

          <div className="relative z-10 flex w-full flex-col justify-between px-12 py-14">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-white/80">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 backdrop-blur">
                <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                Login seguro
              </span>
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 backdrop-blur">
                Hora Venezuela (America/Caracas)
              </span>
            </div>

            <div className="max-w-xl">
              <h1 className="text-5xl font-black italic tracking-tighter text-white xl:text-6xl">
                SIENTE EL <br /> <span className="text-[#ff5d66]">PULSO</span> <br /> DEL MUNDIAL
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-white/80">
                Entra, haz tus predicciones y compite con tus panas en ligas privadas. Esto se siente como evento, no
                como herramienta.
              </p>

              <div className="mt-10 flex gap-4">
                <div className="rotate-[-2deg] rounded-xl bg-white/10 p-6 backdrop-blur-xl">
                  <div className="text-xs font-semibold uppercase tracking-widest text-[#ff5d66]">Picks</div>
                  <div className="mt-1 text-3xl font-bold text-white">J1–J3</div>
                </div>
                <div className="translate-y-4 rotate-[3deg] rounded-xl bg-white/10 p-6 backdrop-blur-xl">
                  <div className="text-xs font-semibold uppercase tracking-widest text-[#9ff4c9]">Ranking</div>
                  <div className="mt-1 text-3xl font-bold text-white">Live</div>
                </div>
              </div>
            </div>

            <div className="text-xs font-semibold uppercase tracking-widest text-white/50">© 2026 Mundialito</div>
          </div>
        </section>

        {/* Right / form */}
        <section className="relative flex items-center justify-center bg-[#f9f9f9] px-6 py-10 sm:px-10">
          {/* Color line */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#3c0007] via-[#630012] to-[#096c4b]" />

          <div className="w-full max-w-md">
            <div className="mb-8">
              <div className="text-xs font-semibold uppercase tracking-widest text-[#45464f]">Bienvenido</div>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#1a1c1c]">Inicia sesión</h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-[#45464f]">
                Guarda tus picks y participa en el ranking. Se bloquean automáticamente al llegar el kickoff.
              </p>
            </div>

            <div className="rounded-2xl bg-[#ffffff] p-6 shadow-[0_24px_48px_rgba(26,28,28,0.04)]">
              {userEmail ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#9ff4c9]/35 text-[#096c4b]">
                      <BadgeCheck className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#1a1c1c]">Sesión activa</div>
                      <div className="truncate text-sm text-[#45464f]">{userEmail}</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Link
                      href="/matches"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#3c0007] to-[#630012] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#3c0007]/10 transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3c0007]/20"
                    >
                      <LogIn className="h-4 w-4" aria-hidden="true" />
                      Ir a Partidos
                    </Link>
                    <Link
                      href="/groups"
                      className="inline-flex flex-1 items-center justify-center rounded-full bg-[#f3f3f3] px-4 py-3 text-sm font-bold text-[#1a1c1c] hover:bg-[#eeeeee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3c0007]/20"
                    >
                      Ver Grupos
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={busy}
                    className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-[#c6c5d0]/40 bg-[#ffffff] px-4 py-3 text-sm font-semibold text-[#1a1c1c] transition-colors hover:bg-[#f3f3f3] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3c0007]/15"
                    aria-busy={busy}
                  >
                    <GoogleMark className="h-5 w-5" />
                    {busy ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Entrando...
                      </>
                    ) : (
                      <span>Continuar con Google</span>
                    )}
                  </button>

                  {error ? (
                    <div className="rounded-xl bg-[#ffdad6] px-3 py-2 text-sm text-[#93000a]" role="alert">
                      {error}
                    </div>
                  ) : null}

                  <div className="rounded-xl bg-[#f3f3f3] px-3 py-2 text-xs text-[#45464f]">
                    Tip: En <span className="font-semibold text-[#1a1c1c]">Partidos</span> guardas tu marcador. Picks
                    cerrados al kickoff.
                  </div>

                  <p className="text-xs text-[#45464f]">
                    Al continuar aceptas las reglas de tu liga.{" "}
                    <Link className="font-semibold underline underline-offset-2 hover:text-[#1a1c1c]" href="/">
                      Volver al inicio
                    </Link>
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-xl bg-[#eeeeee] px-3 py-2 text-xs text-[#45464f]">
              <Crown className="mt-0.5 h-4 w-4 text-[#3c0007]" aria-hidden="true" />
              <div>
                El panel <span className="font-semibold text-[#1a1c1c]">Admin</span> usa email/contraseña (sin Google).
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

