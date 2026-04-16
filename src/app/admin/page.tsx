"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  documentId,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { firebaseAuth, firestore } from "@/lib/firebase/client";
import { MATCHDAY_1 } from "@/data/matchday1";
import { MATCHDAY_2 } from "@/data/matchday2";
import { MATCHDAY_3 } from "@/data/matchday3";
import { TeamFlag } from "@/components/TeamFlag";
import { getGroupIdForMatch } from "@/lib/groups";

type MatchStatus = "scheduled" | "live" | "final";

type MasterMatchDoc = {
  status: MatchStatus;
  score?: { home: number; away: number };
  kickoffAt?: unknown;
  updatedAt?: unknown;
  updatedBy?: string;
};

function toMillis(ts: unknown): number | null {
  if (!ts) return null;
  if (typeof (ts as any).toMillis === "function") return (ts as any).toMillis();
  if (typeof (ts as any).seconds === "number") return (ts as any).seconds * 1000;
  return null;
}

function formatKickoffCaracas(ts: unknown, fallbackIsoLike: string) {
  const ms = toMillis(ts);
  const d = ms == null ? new Date(fallbackIsoLike) : new Date(ms);
  const parts = new Intl.DateTimeFormat("es-VE", {
    timeZone: "America/Caracas",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    day: "2-digit",
    month: "short",
  }).formatToParts(d);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = get("day");
  const month = get("month").toUpperCase();
  const time = `${get("hour")}:${get("minute")}`;

  return { time, dateLabel: `${Number(day)} ${month}` };
}

function clampNonNegInt(input: string) {
  const n = Number.parseInt(input, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export default function AdminPage() {
  const allowedEmail = "gonzalezadonis16@gmail.com";

  const [user, setUser] = useState<import("firebase/auth").User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [email, setEmail] = useState(allowedEmail);
  const [password, setPassword] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  const [matchday, setMatchday] = useState<"1" | "2" | "3">("1");
  const fixtures = useMemo(() => {
    const base = matchday === "3" ? MATCHDAY_3 : matchday === "2" ? MATCHDAY_2 : MATCHDAY_1;
    return [...base].sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt));
  }, [matchday]);

  const [docsById, setDocsById] = useState<Record<string, MasterMatchDoc>>({});
  const [draftById, setDraftById] = useState<
    Record<string, { status: MatchStatus; home: string; away: string }>
  >({});
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});
  const [rowError, setRowError] = useState<Record<string, string | null>>({});
  const [dirtyIds, setDirtyIds] = useState<Record<string, boolean>>({});
  const [globalMsg, setGlobalMsg] = useState<string | null>(null);

  const dirtyRef = useRef<Record<string, boolean>>({});
  useEffect(() => {
    dirtyRef.current = dirtyIds;
  }, [dirtyIds]);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, async (u) => {
      setUser(u);
      setAuthLoading(false);
      setAuthError(null);
      setGlobalMsg(null);
      setDocsById({});
      setDraftById({});
      setDirtyIds({});

      if (!u) {
        setIsAdmin(false);
        return;
      }

      try {
        const token = await u.getIdTokenResult(true);
        setIsAdmin(token.claims?.admin === true);
      } catch (e) {
        setIsAdmin(false);
        setAuthError(e instanceof Error ? e.message : "Error leyendo sesión.");
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user || !isAdmin) return;

    const ids = fixtures.map((f) => f.id);
    if (ids.length === 0) return;

    const col = collection(firestore, "tournaments", "2026", "matches");
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));

    const unsubs = chunks.map((chunk) => {
      const q = query(col, where(documentId(), "in", chunk));
      return onSnapshot(
        q,
        (snap) => {
          const incoming: Record<string, MasterMatchDoc> = {};
          for (const d of snap.docs) incoming[d.id] = d.data() as MasterMatchDoc;

          setDocsById((prev) => ({ ...prev, ...incoming }));

          setDraftById((prev) => {
            const next = { ...prev };
            for (const [matchId, data] of Object.entries(incoming)) {
              if (dirtyRef.current[matchId]) continue;
              next[matchId] = {
                status: data.status ?? "scheduled",
                home: String(data.score?.home ?? ""),
                away: String(data.score?.away ?? ""),
              };
            }
            return next;
          });

          setRowError((prev) => {
            const next = { ...prev };
            for (const id of Object.keys(incoming)) next[id] = null;
            return next;
          });
        },
        (err) => {
          setGlobalMsg(err?.message ?? "Error escuchando cambios en tiempo real.");
        }
      );
    });

    return () => {
      for (const u of unsubs) u();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin, matchday]);

  async function handleLogin() {
    setAuthError(null);
    setGlobalMsg(null);
    setLoginBusy(true);
    try {
      const normalized = email.trim().toLowerCase();
      if (normalized !== allowedEmail) {
        setAuthError("Este panel solo permite el correo admin configurado.");
        return;
      }

      await signInWithEmailAndPassword(firebaseAuth, normalized, password);
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : "Error iniciando sesión.");
    } finally {
      setLoginBusy(false);
    }
  }

  async function handleLogout() {
    setAuthError(null);
    setGlobalMsg(null);
    await signOut(firebaseAuth);
  }

  async function loadOne(matchId: string) {
    setLoadingIds((s) => ({ ...s, [matchId]: true }));
    try {
      const ref = doc(firestore, "tournaments", "2026", "matches", matchId);
      const snap = await getDoc(ref);
      const data = (snap.exists() ? (snap.data() as MasterMatchDoc) : undefined) ?? {
        status: "scheduled" as const,
      };

      setDocsById((s) => ({ ...s, [matchId]: data }));
      setRowError((s) => ({ ...s, [matchId]: null }));
      setDraftById((s) => ({
        ...s,
        [matchId]: {
          status: data.status ?? "scheduled",
          home: String(data.score?.home ?? ""),
          away: String(data.score?.away ?? ""),
        },
      }));
    } finally {
      setLoadingIds((s) => ({ ...s, [matchId]: false }));
    }
  }

  async function saveOne(matchId: string) {
    if (!user) return;
    setSavingIds((s) => ({ ...s, [matchId]: true }));
    setGlobalMsg(null);
    setRowError((s) => ({ ...s, [matchId]: null }));
    try {
      const draft = draftById[matchId];
      if (!draft) return;

      const status = draft.status;
      const score =
        status === "final"
          ? { home: clampNonNegInt(draft.home), away: clampNonNegInt(draft.away) }
          : undefined;

      const ref = doc(firestore, "tournaments", "2026", "matches", matchId);

      await setDoc(
        ref,
        {
          status,
          ...(score ? { score } : {}),
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        },
        { merge: true }
      );

      setDirtyIds((s) => ({ ...s, [matchId]: false }));
      setGlobalMsg(`Guardado: ${matchId}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error guardando.";
      setRowError((s) => ({ ...s, [matchId]: msg }));
      setGlobalMsg(msg);
    } finally {
      setSavingIds((s) => ({ ...s, [matchId]: false }));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Admin</h1>
        <p className="text-sm text-slate-700">
          Panel para cargar resultados oficiales en la matriz master (Firestore).
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {authLoading ? (
          <div className="text-sm text-slate-700">Cargando sesión...</div>
        ) : user ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-700">
              <div className="font-semibold text-slate-900">{user.displayName ?? user.email ?? user.uid}</div>
              <div className="text-xs text-slate-500">
                {isAdmin ? "Admin: sí" : "Admin: no (necesitas custom claim admin=true)"}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Cerrar sesión
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Correo
                <input
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  inputMode="email"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Contraseña
                <input
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={handleLogin}
              disabled={loginBusy}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loginBusy ? "Entrando..." : "Entrar"}
            </button>

            <p className="text-xs text-slate-500 sm:col-span-2">
              Este panel solo permite el correo <span className="font-semibold">{allowedEmail}</span>. Además, Firestore
              requiere el claim <span className="font-semibold">admin=true</span>.
            </p>
          </div>
        )}

        {authError ? (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {authError}
          </div>
        ) : null}
      </section>

      {user && !isAdmin ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          No tienes permisos de admin. Si este es tu usuario, asígnale el claim <code className="font-semibold">admin</code>{" "}
          y vuelve a cargar la página.
        </section>
      ) : null}

      {user && isAdmin ? (
        <>
          <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-700">
                Jornada{" "}
                <select
                  className="ml-2 h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-900 shadow-sm outline-none"
                  value={matchday}
                  onChange={(e) => setMatchday(e.target.value as "1" | "2" | "3")}
                >
                  <option value="1">Jornada 1</option>
                  <option value="2">Jornada 2</option>
                  <option value="3">Jornada 3</option>
                </select>
              </label>
            </div>
            <div className="text-xs text-slate-500">
              Actualiza en tiempo real desde Firestore. Cambia a <span className="font-semibold">Final</span> y carga el{" "}
              <span className="font-semibold">Resultado</span>.
            </div>
          </section>

          {globalMsg ? (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
              {globalMsg}
            </div>
          ) : null}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <ul className="divide-y divide-slate-200">
              {fixtures.map((fx) => {
                const master = docsById[fx.id];
                const { dateLabel, time } = formatKickoffCaracas(master?.kickoffAt, fx.kickoffAt);
                const draft = draftById[fx.id];
                const isLoading = loadingIds[fx.id];
                const isSaving = savingIds[fx.id];
                const err = rowError[fx.id];
                const statusValue = draft?.status ?? "scheduled";
                const isFinal = statusValue === "final";
                const statusLabel =
                  statusValue === "scheduled" ? "Programado" : statusValue === "live" ? "En vivo" : "Final";
                const statusTone =
                  statusValue === "scheduled"
                    ? "bg-slate-100 text-slate-700"
                    : statusValue === "live"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800";
                const groupId = getGroupIdForMatch(fx.home, fx.away);

                return (
                  <li key={fx.id} className="px-4 py-4 sm:px-6">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="grid w-full grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-6">
                          <div className="flex justify-start sm:justify-end">
                            <div className="min-w-0">
                              <TeamFlag team={fx.home} layout="inline" size="sm" inlineOrder="name-flag" />
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="text-xs font-medium text-slate-500">{fx.id}</div>
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusTone}`}>
                                {statusLabel}
                              </span>
                            </div>
                            {groupId ? (
                              <div className="mt-1">
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                                  Grupo {groupId}
                                </span>
                              </div>
                            ) : null}
                            <div className="text-lg font-semibold tracking-tight text-slate-900">{time}</div>
                            <div className="text-xs font-medium text-slate-500">{dateLabel}</div>
                            <div className="mt-1 text-[11px] font-medium text-slate-400">
                              Hora Venezuela (America/Caracas)
                            </div>
                          </div>

                          <div className="flex justify-start">
                            <div className="min-w-0">
                              <TeamFlag team={fx.away} layout="inline" size="sm" inlineOrder="flag-name" />
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => loadOne(fx.id)}
                          className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                        >
                          {isLoading ? "..." : "Refrescar"}
                        </button>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-1 flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                            Estado
                            <select
                              className="ml-2 h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-900 shadow-sm outline-none"
                              value={statusValue}
                              onChange={(e) =>
                                setDraftById((s) => ({
                                  ...s,
                                  [fx.id]: {
                                    status: e.target.value as MatchStatus,
                                    home: s[fx.id]?.home ?? "",
                                    away: s[fx.id]?.away ?? "",
                                  },
                                }))
                              }
                              onFocus={() => setDirtyIds((s) => ({ ...s, [fx.id]: true }))}
                            >
                              <option value="scheduled">Programado</option>
                              <option value="live">En vivo</option>
                              <option value="final">Final</option>
                            </select>
                          </label>

                          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                            <span className="text-xs font-semibold text-slate-700">Resultado</span>
                            <div className="flex items-center gap-2">
                              <input
                                className="h-8 w-12 rounded-lg border border-slate-300 bg-white px-2 text-center text-sm text-slate-900"
                                inputMode="numeric"
                                placeholder="0"
                                value={draft?.home ?? ""}
                                onChange={(e) =>
                                  setDraftById((s) => ({
                                    ...s,
                                    [fx.id]: {
                                      status: s[fx.id]?.status ?? "scheduled",
                                      home: e.target.value,
                                      away: s[fx.id]?.away ?? "",
                                    },
                                  }))
                                }
                                onFocus={() => setDirtyIds((s) => ({ ...s, [fx.id]: true }))}
                                aria-label="Goles local"
                                disabled={!isFinal}
                              />
                              <span className="text-slate-400">-</span>
                              <input
                                className="h-8 w-12 rounded-lg border border-slate-300 bg-white px-2 text-center text-sm text-slate-900"
                                inputMode="numeric"
                                placeholder="0"
                                value={draft?.away ?? ""}
                                onChange={(e) =>
                                  setDraftById((s) => ({
                                    ...s,
                                    [fx.id]: {
                                      status: s[fx.id]?.status ?? "scheduled",
                                      home: s[fx.id]?.home ?? "",
                                      away: e.target.value,
                                    },
                                  }))
                                }
                                onFocus={() => setDirtyIds((s) => ({ ...s, [fx.id]: true }))}
                                aria-label="Goles visitante"
                                disabled={!isFinal}
                              />
                            </div>
                            {!isFinal ? (
                              <span className="ml-1 text-[11px] font-medium text-slate-400">
                                (solo en Final)
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => saveOne(fx.id)}
                          disabled={isSaving}
                          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          {isSaving ? "Guardando..." : "Guardar"}
                        </button>
                      </div>

                      {err ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                          {err}
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}

