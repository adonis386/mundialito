"use client";

import Link from "next/link";
import Image from "next/image";
import { Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type NavItem = {
  href: string;
  label: string;
};

const nav: NavItem[] = [
  { href: "/groups", label: "Grupos" },
  { href: "/matches", label: "Partidos" },
  { href: "/playoffs", label: "Eliminatoria" },
  { href: "/leagues", label: "Ligas" },
  { href: "/leaderboard", label: "Ranking" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (u) => {
      setUserEmail(u?.email ?? null);
    });
    return () => unsub();
  }, []);

  function isActive(href: string) {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="min-h-dvh bg-[#f9f9f9]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-slate-900 focus:shadow"
      >
        Saltar a contenido principal
      </a>

      <header className="sticky top-0 z-40 bg-[#f9f9f9]/80 backdrop-blur">
        {/* Color line */}
        <div className="h-1 w-full bg-gradient-to-r from-[#3c0007] via-[#630012] to-[#096c4b]" />

        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="flex min-w-0 items-center gap-2">
              <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                <Image
                  src="/assets/logocopadel-mundo.jpg"
                  alt="Logo Mundialito 2026"
                  fill
                  sizes="36px"
                  className="object-cover"
                  priority
                />
              </span>
              <span className="truncate text-sm font-black italic tracking-tighter text-[#1a1c1c]">
                MUNDIALITO 2026
              </span>
            </Link>
            <span className="hidden items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#45464f] shadow-sm sm:inline-flex">
              <Shield className="h-3.5 w-3.5 text-[#3c0007]" aria-hidden="true" />
              Matriz master
            </span>
          </div>

          <nav aria-label="Navegación principal" className="flex flex-wrap items-center justify-end gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={[
                  "cursor-pointer rounded-full px-3 py-2 text-sm font-semibold shadow-sm transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3c0007]/15",
                  isActive(item.href)
                    ? "bg-[#3c0007]/10 text-[#3c0007]"
                    : "bg-white/60 text-[#1a1c1c] hover:bg-[#3c0007]/10 hover:text-[#3c0007]",
                ].join(" ")}
              >
                {item.label}
              </Link>
            ))}

            {userEmail ? (
              <div className="ml-1 flex items-center gap-2">
                <span className="hidden max-w-[180px] truncate rounded-full bg-white/80 px-3 py-2 text-xs font-semibold text-[#45464f] shadow-sm sm:inline-block">
                  {userEmail}
                </span>
                <button
                  type="button"
                  onClick={() => signOut(firebaseAuth)}
                  className="cursor-pointer rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-[#1a1c1c] transition-colors duration-200 ease-out hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3c0007]/15"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="ml-1 cursor-pointer rounded-full bg-gradient-to-br from-[#3c0007] to-[#630012] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[#3c0007]/10 transition-all duration-200 ease-out hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3c0007]/20"
              >
                Entrar
              </Link>
            )}
          </nav>
        </div>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={pathname ?? "app"}
          id="main"
          className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6"
          initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {children}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}

