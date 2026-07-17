/**
 * Materializa resultados oficiales Mundial 2026 (archivo) en la matriz master.
 * - 72 partidos de grupos → status final + score
 * - Partidos KO (ko-*) → final si jugados; bronce/final scheduled
 *
 * Dispara onMasterMatchWritten al escribir cada doc (Functions desplegadas).
 *
 *   cd functions && npm run build && npm run seed:wc2026-archive
 */

import fs from "node:fs";
import path from "node:path";

import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";

import { firestorePaths } from "./firestorePaths.js";
import { SEED_MATCHDAYS, toTimestampUtc } from "./seedData.js";
import { GROUP_FINAL_SCORES, KNOCKOUT_ARCHIVE } from "./wc2026Archive.js";

function detectProjectId(): string | undefined {
  const env = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_CONFIG;
  if (env && !env.trim().startsWith("{")) return env;
  if (env && env.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(env);
      if (typeof parsed?.projectId === "string") return parsed.projectId;
    } catch {
      // ignore
    }
  }
  const firebasercPath = path.resolve(process.cwd(), "..", ".firebaserc");
  if (fs.existsSync(firebasercPath)) {
    try {
      const raw = fs.readFileSync(firebasercPath, "utf8");
      const parsed = JSON.parse(raw) as { projects?: { default?: string } };
      if (typeof parsed?.projects?.default === "string") return parsed.projects.default;
    } catch {
      // ignore
    }
  }
  return undefined;
}

function initAdmin() {
  if (getApps().length > 0) return;
  const projectId = detectProjectId();
  const keyPath = path.join(process.cwd(), "serviceAccountKey.json");
  if (fs.existsSync(keyPath)) {
    initializeApp({ credential: cert(keyPath), projectId });
    return;
  }
  initializeApp({ credential: applicationDefault(), projectId });
}

function kickoffByMatchId(): Map<string, ReturnType<typeof toTimestampUtc>> {
  const map = new Map<string, ReturnType<typeof toTimestampUtc>>();
  for (const day of [1, 2, 3] as const) {
    for (const row of SEED_MATCHDAYS[day]) {
      map.set(row.matchId, toTimestampUtc(row.kickoffAt));
    }
  }
  return map;
}

/** Interpreta ISO local-like (sin Z) como America/Caracas → UTC Timestamp. */
function kickoffFromIsoLocal(iso: string): Timestamp {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!m) return Timestamp.now();
  return toTimestampUtc({
    y: Number(m[1]),
    m: Number(m[2]),
    d: Number(m[3]),
    hh: Number(m[4]),
    mm: Number(m[5]),
  });
}

async function writeMatch(params: {
  matchId: string;
  status: "scheduled" | "live" | "final";
  score?: { home: number; away: number };
  pens?: { home: number; away: number };
  kickoffAt: Timestamp;
  stage: string;
  homeNameEs?: string;
  awayNameEs?: string;
}) {
  const db = getFirestore();
  const ref = db.doc(firestorePaths.masterMatchDoc(params.matchId));
  const snap = await ref.get();
  const prev = snap.exists ? (snap.data() as { version?: number }) : undefined;
  const nextVersion = Math.max(1, Number(prev?.version ?? 0) + 1);
  const now = Timestamp.now();

  const payload: Record<string, unknown> = {
    status: params.status,
    version: nextVersion,
    kickoffAt: params.kickoffAt,
    stage: params.stage,
    updatedAt: now,
    updatedBy: "seedWc2026Archive",
  };
  if (params.homeNameEs) payload.homeNameEs = params.homeNameEs;
  if (params.awayNameEs) payload.awayNameEs = params.awayNameEs;
  if (params.status === "final" && params.score) {
    payload.score = params.score;
  } else {
    payload.score = FieldValue.delete();
  }
  if (params.pens) payload.pens = params.pens;

  await ref.set(payload, { merge: true });
  return { matchId: params.matchId, version: nextVersion, status: params.status };
}

async function main() {
  initAdmin();
  const kickoffs = kickoffByMatchId();
  const groupIds = Object.keys(GROUP_FINAL_SCORES).sort();
  const out: Array<{ matchId: string; version: number; status: string }> = [];

  // eslint-disable-next-line no-console
  console.log(`Writing ${groupIds.length} group finals…`);

  for (const matchId of groupIds) {
    const score = GROUP_FINAL_SCORES[matchId]!;
    const kickoffAt = kickoffs.get(matchId);
    if (!kickoffAt) {
      // eslint-disable-next-line no-console
      console.warn(`missing kickoff for ${matchId}, skipping`);
      continue;
    }
    const row = await writeMatch({
      matchId,
      status: "final",
      score,
      kickoffAt,
      stage: "group",
    });
    out.push(row);
  }

  // eslint-disable-next-line no-console
  console.log(`Writing ${KNOCKOUT_ARCHIVE.length} knockout matches…`);

  for (const m of KNOCKOUT_ARCHIVE) {
    const row = await writeMatch({
      matchId: m.id,
      status: m.status,
      score: m.score,
      pens: m.pens,
      kickoffAt: kickoffFromIsoLocal(m.kickoffAt),
      stage: m.stage,
      homeNameEs: m.homeNameEs,
      awayNameEs: m.awayNameEs,
    });
    out.push(row);
  }

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ ok: true, written: out.length, sample: out.slice(0, 5) }, null, 2));
  // eslint-disable-next-line no-console
  console.log(
    "Tip: abre cada liga y usa «Actualizar tabla» (refreshLeagueLeaderboard) si algún ranking quedó desfasado."
  );
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});
