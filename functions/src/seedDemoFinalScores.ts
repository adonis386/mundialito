/**
 * Marca partidos de la matriz master como final con marcadores ficticios (Admin SDK).
 * Dispara onMasterMatchWritten para puntos / tablas (en despliegue con Functions activas).
 *
 *   cd functions && npm run build && node lib/seedDemoFinalScores.js
 */

import fs from "node:fs";
import path from "node:path";

import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { Timestamp, getFirestore } from "firebase-admin/firestore";

import { firestorePaths } from "./firestorePaths.js";

const DEFAULT_FINALS: Array<{ matchId: string; home: number; away: number }> = [
  { matchId: "md1-01", home: 2, away: 1 },
  { matchId: "md1-02", home: 0, away: 0 },
  { matchId: "md1-03", home: 1, away: 2 },
  { matchId: "md1-04", home: 3, away: 3 },
];

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

async function main() {
  initAdmin();
  const db = getFirestore();
  const now = Timestamp.now();
  const out: Array<{ matchId: string; version: number; score: { home: number; away: number } }> = [];

  for (const row of DEFAULT_FINALS) {
    const ref = db.doc(firestorePaths.masterMatchDoc(row.matchId));
    const snap = await ref.get();
    if (!snap.exists) {
      // eslint-disable-next-line no-console
      console.warn(`skip missing match doc: ${row.matchId}`);
      continue;
    }
    const prev = snap.data() as { version?: number };
    const nextVersion = Math.max(1, Number(prev?.version ?? 1)) + 1;
    await ref.set(
      {
        status: "final",
        score: { home: row.home, away: row.away },
        version: nextVersion,
        updatedAt: now,
        updatedBy: "seedDemoFinalScores",
      },
      { merge: true }
    );
    out.push({ matchId: row.matchId, version: nextVersion, score: { home: row.home, away: row.away } });
  }

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        ok: true,
        projectId: detectProjectId(),
        updated: out,
        note: "Si Functions está desplegado, onMasterMatchWritten recalcula puntos por pick.",
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
