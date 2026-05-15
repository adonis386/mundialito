"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "mundialito-pwa-install-dismissed";

export function PwaInstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") {
      setDismissed(true);
      return;
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setDismissed(false);
    };

    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  if (dismissed || !deferred) return null;

  async function install() {
    if (!deferred) return;
    setInstalling(true);
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } finally {
      setInstalling(false);
      setDeferred(null);
      setDismissed(true);
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
    setDeferred(null);
  }

  return (
    <div
      role="region"
      aria-label="Instalar aplicación"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg rounded-2xl border border-[#3c0007]/10 bg-white p-4 shadow-[0_24px_48px_rgba(26,28,28,0.12)] sm:left-auto sm:right-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ffdad9] text-[#3c0007]">
          <Download className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#1a1c1c]">Instalar Mundialito</p>
          <p className="mt-0.5 text-xs text-[#45464f]">Acceso rápido desde tu pantalla de inicio, como una app.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void install()}
              disabled={installing}
              className="inline-flex cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-[#3c0007] to-[#630012] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              {installing ? "Instalando…" : "Instalar"}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex cursor-pointer items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-800"
            >
              Ahora no
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
