"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PrizeTiersEditor } from "@/components/league/PrizeTiersEditor";
import { ScoringRulesPanel } from "@/components/league/ScoringRulesPanel";
import {
  computePrizePool,
  DEFAULT_PRIZE_TIERS,
  formatMoney,
  normalizeTiersForSubmit,
  sumPercents,
  type PrizeTier,
} from "@/lib/league/prizes";
import { DEFAULT_SCORING_CONFIG } from "@/lib/scoring/defaultConfig";
import { describeScoringRules } from "@/lib/scoring/scoringRulesText";
import type { ScoringConfig } from "@/lib/domain/types";
import { firebaseAuth, firestore, functions } from "@/lib/firebase/client";
import { forFirestore } from "@/lib/firestore/sanitize";

const STEPS = [
  { id: 1, title: "Nombre" },
  { id: 2, title: "Participación" },
  { id: 3, title: "Puntos" },
  { id: 4, title: "Resumen" },
] as const;

function formatCallableError(err: unknown) {
  const anyErr = err as { code?: string; message?: string };
  const code = typeof anyErr?.code === "string" ? anyErr.code : null;
  const message = typeof anyErr?.message === "string" ? anyErr.message : null;
  const normalizedCode = code?.startsWith("functions/") ? code : code ? `functions/${code}` : null;
  if (normalizedCode && message) return `${normalizedCode}: ${message}`;
  if (normalizedCode) return normalizedCode;
  if (message) return message;
  return "Error creando liga.";
}

export default function CreateLeaguePage() {
  const [uid, setUid] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("Panas del trabajo");
  const [entryFee, setEntryFee] = useState("");
  const [plannedParticipants, setPlannedParticipants] = useState("20");
  const [prizeTiers, setPrizeTiers] = useState<PrizeTier[]>(DEFAULT_PRIZE_TIERS);
  const [scoringConfig, setScoringConfig] = useState<Pick<ScoringConfig, "mode" | "points">>(
    DEFAULT_SCORING_CONFIG
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ leagueId: string; joinCode: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    const ref = doc(firestore, "scoring", "config");
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data() as Partial<ScoringConfig> | undefined;
        if (data?.mode && data?.points) {
          setScoringConfig({
            mode: data.mode,
            points: {
              correctResult: Number(data.points.correctResult ?? 3),
              correctDraw: Number(data.points.correctDraw ?? 4),
              exactScoreBonus: Number(data.points.exactScoreBonus ?? 3),
            },
          });
        }
      },
      () => null
    );
    return () => unsub();
  }, []);

  const trimmed = useMemo(() => name.trim(), [name]);
  const parsedFee = useMemo(() => {
    const raw = entryFee.trim();
    if (!raw) return null;
    const n = Number.parseFloat(raw.replace(",", "."));
    return Number.isFinite(n) && n >= 0 ? n : null;
  }, [entryFee]);

  const parsedPlanned = useMemo(() => {
    const raw = plannedParticipants.trim();
    if (!raw) return null;
    const n = Math.floor(Number.parseFloat(raw.replace(",", ".")));
    return Number.isFinite(n) && n >= 1 ? n : null;
  }, [plannedParticipants]);

  const normalizedTiers = useMemo(() => normalizeTiersForSubmit(prizeTiers), [prizeTiers]);
  const percentSum = useMemo(() => sumPercents(normalizedTiers), [normalizedTiers]);
  const prizePreview = useMemo(
    () =>
      computePrizePool({
        entryFee: parsedFee,
        membersCount: parsedPlanned ?? 1,
        plannedParticipants: parsedPlanned,
        tiers: normalizedTiers,
      }),
    [parsedFee, parsedPlanned, normalizedTiers]
  );

  const scoringCopy = useMemo(() => describeScoringRules(scoringConfig), [scoringConfig]);

  const step2Valid = useMemo(() => {
    if (entryFee.trim() !== "" && parsedFee == null) return false;
    if (normalizedTiers.length === 0) return true;
    if (parsedFee == null || parsedFee <= 0) return false;
    if (parsedPlanned == null) return false;
    return Math.abs(percentSum - 100) < 0.01;
  }, [entryFee, parsedFee, normalizedTiers, parsedPlanned, percentSum]);

  const canNext =
    step === 1
      ? trimmed.length >= 3 && trimmed.length <= 80
      : step === 2
        ? step2Valid
        : true;

  async function submit() {
    setError(null);
    setCopied(false);
    if (!uid) {
      setError("Debes iniciar sesión para crear una liga.");
      return;
    }
    if (!step2Valid) {
      setError("Revisa participación y premios: cuota, participantes planificados y % que sumen 100.");
      setStep(2);
      return;
    }
    const tiersToSend = normalizedTiers.length > 0 ? normalizedTiers : [];
    if (tiersToSend.length > 0 && (parsedFee == null || parsedFee <= 0)) {
      setError("Indica la cuota por participante si configuras premios por %.");
      setStep(2);
      return;
    }
    try {
      setBusy(true);
      const fn = httpsCallable(functions, "createLeague");
      const res = (await fn({
        name: trimmed,
        entryFee: parsedFee,
        plannedParticipants: parsedPlanned,
        prizeTiers: tiersToSend,
      })) as { data: { ok?: boolean; leagueId?: string; joinCode?: string } };
      const data = res.data;
      if (!data?.ok || !data.leagueId || !data.joinCode) throw new Error("No se pudo crear la liga.");

      const hasPrizeConfig =
        tiersToSend.length > 0 || (parsedFee != null && parsedFee > 0) || parsedPlanned != null;
      if (hasPrizeConfig) {
        await setDoc(
          doc(firestore, "leagues", data.leagueId),
          {
            entryFee: parsedFee != null && parsedFee > 0 ? parsedFee : null,
            plannedParticipants: parsedPlanned,
            prizeTiers: tiersToSend,
          },
          { merge: true }
        );
      }

      await setDoc(
        doc(firestore, "leagues", data.leagueId, "overview", "public"),
        forFirestore({
          name: trimmed,
          membersCount: 1,
          entryFee: parsedFee != null && parsedFee > 0 ? parsedFee : null,
          plannedParticipants: parsedPlanned,
          prizeTiers: tiersToSend,
          scoringRules: scoringConfig,
          settings: {
            tournament: "Copa Mundial 2026",
            matchScope: "Fase de grupos y eliminatoria",
            predictionBy: "Por partido",
            pickDeadline: "Antes del kickoff oficial de cada partido (matriz master)",
            sortBy: "Puntos totales",
          },
        }),
        { merge: true }
      );

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

  if (result) {
    return (
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-6">
          <div className="text-xs font-black uppercase tracking-[0.25em] text-[#096c4b]">Liga creada</div>
          <h1 className="mt-1 text-2xl font-black italic tracking-tight text-slate-900">{trimmed}</h1>
        </header>
        <section className="rounded-2xl bg-[#f3f3f3] p-5">
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
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/leagues/${result.leagueId}`}
              className="inline-flex flex-1 items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-[#3c0007]"
            >
              Ver liga
            </Link>
            <Link
              href="/leagues"
              className="inline-flex flex-1 items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-900 shadow-sm"
            >
              Mis ligas
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <header className="mb-6 flex flex-col gap-2">
        <div className="text-xs font-black uppercase tracking-[0.25em] text-[#3c0007]">Leagues</div>
        <h1 className="text-3xl font-black italic tracking-tighter text-slate-900 sm:text-4xl">Crear liga privada</h1>
        <p className="text-sm text-slate-700">
          Paso {step} de {STEPS.length}: {STEPS[step - 1]?.title}. Al final verás el resumen antes de crear.
        </p>
        <div className="flex gap-1">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={[
                "h-1 flex-1 rounded-full transition-colors",
                s.id <= step ? "bg-[#3c0007]" : "bg-slate-200",
              ].join(" ")}
              aria-hidden
            />
          ))}
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_48px_rgba(26,28,28,0.04)]">
        <div className="h-1 w-full bg-gradient-to-r from-[#3c0007] via-[#630012] to-[#096c4b]" />

        <div className="p-6">
          {step === 1 ? (
            <label className="grid gap-2 text-sm font-semibold text-slate-900" htmlFor="leagueName">
              Nombre de la liga
              <input
                id="leagueName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 w-full rounded-xl bg-slate-50 px-4 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#3c0007]/15"
                placeholder="Ej: Panas del trabajo"
                autoComplete="off"
              />
              <span className="text-xs font-normal text-slate-500">Entre 3 y 80 caracteres.</span>
            </label>
          ) : null}

          {step === 2 ? (
            <PrizeTiersEditor
              entryFee={parsedFee}
              plannedParticipants={parsedPlanned}
              previewMembersCount={parsedPlanned ?? 1}
              tiers={prizeTiers}
              onTiersChange={setPrizeTiers}
              entryFeeInput={entryFee}
              plannedInput={plannedParticipants}
              onEntryFeeChange={setEntryFee}
              onPlannedChange={setPlannedParticipants}
            />
          ) : null}

          {step === 3 ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-slate-700">
                Las reglas de puntos vienen de la <span className="font-semibold">matriz master</span> del Mundial
                2026. Todos los miembros de la liga compiten con el mismo criterio.
              </p>
              <ScoringRulesPanel config={scoringConfig} />
            </div>
          ) : null}

          {step === 4 ? (
            <div className="flex flex-col gap-4 text-sm text-slate-800">
              <p className="font-semibold text-slate-900">Tu liga se creará con estos datos:</p>
              <dl className="divide-y divide-slate-200/80 rounded-xl border border-slate-200/80 bg-[#f9f9f9]">
                <div className="grid gap-1 px-4 py-3 sm:grid-cols-[9rem_1fr]">
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Nombre</dt>
                  <dd className="font-semibold text-slate-900">{trimmed}</dd>
                </div>
                <div className="grid gap-1 px-4 py-3 sm:grid-cols-[9rem_1fr]">
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Participación</dt>
                  <dd className="font-semibold text-[#3c0007]">
                    {parsedFee != null && parsedFee > 0 ? formatMoney(parsedFee) : "Gratis"}
                  </dd>
                </div>
                {parsedPlanned != null ? (
                  <div className="grid gap-1 px-4 py-3 sm:grid-cols-[9rem_1fr]">
                    <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Planificados</dt>
                    <dd>{parsedPlanned} participantes (referencia)</dd>
                  </div>
                ) : null}
                {normalizedTiers.length > 0 && parsedFee != null && parsedFee > 0 ? (
                  <div className="grid gap-1 px-4 py-3 sm:grid-cols-[9rem_1fr]">
                    <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Premios</dt>
                    <dd>
                      <ul className="space-y-1">
                        {prizePreview.payouts.map((p) => (
                          <li key={p.place}>
                            {p.label}: {p.percent}%
                            {prizePreview.totalPool > 0 ? (
                              <span className="text-slate-600"> → {formatMoney(p.amount)}</span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                      {prizePreview.totalPool > 0 ? (
                        <p className="mt-2 text-xs text-slate-600">
                          Pozo estimado con {parsedPlanned} miembros: {formatMoney(prizePreview.totalPool)}. Si se unen
                          más, el pozo se recalcula con los miembros reales.
                        </p>
                      ) : null}
                    </dd>
                  </div>
                ) : null}
                <div className="grid gap-1 px-4 py-3 sm:grid-cols-[9rem_1fr]">
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Torneo</dt>
                  <dd>Copa Mundial 2026 · grupos y eliminatoria</dd>
                </div>
                <div className="grid gap-1 px-4 py-3 sm:grid-cols-[9rem_1fr]">
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Pronóstico</dt>
                  <dd>Por partido · antes del kickoff oficial</dd>
                </div>
                <div className="grid gap-1 px-4 py-3 sm:grid-cols-[9rem_1fr]">
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Puntos</dt>
                  <dd>
                    <span className="font-semibold text-[#3c0007]">{scoringCopy.resultPlusExactLabel}</span>
                    <span className="block text-xs text-slate-600">{scoringCopy.modeLabel}</span>
                  </dd>
                </div>
                <div className="grid gap-1 px-4 py-3 sm:grid-cols-[9rem_1fr]">
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Orden</dt>
                  <dd>Puntos totales en la tabla de la liga</dd>
                </div>
              </dl>
            </div>
          ) : null}

          {!uid ? (
            <div className="mt-4 rounded-xl bg-[#ffdad6] px-3 py-2 text-sm text-[#93000a]">
              Debes iniciar sesión.{" "}
              <Link className="font-semibold underline" href="/login">
                Ir a login
              </Link>
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-xl bg-[#ffdad6] px-3 py-2 text-sm text-[#93000a]">{error}</div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-2">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-900"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Regresar
              </button>
            ) : (
              <Link
                href="/leagues"
                className="inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-900"
              >
                Cancelar
              </Link>
            )}

            {step < 4 ? (
              <button
                type="button"
                disabled={!canNext || !uid}
                onClick={() => setStep((s) => Math.min(4, s + 1))}
                className="ml-auto inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-[#3c0007] to-[#630012] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                disabled={!canNext || !uid || busy}
                onClick={() => void submit()}
                className="ml-auto inline-flex rounded-full bg-gradient-to-br from-[#3c0007] to-[#630012] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy ? "Creando…" : "Crear liga"}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
