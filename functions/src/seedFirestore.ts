import fs from "node:fs";
import path from "node:path";

import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";

import { SEED_MATCHDAYS, toTimestampUtc } from "./seedData.js";
import { firestorePaths } from "./firestorePaths.js";

type Args = {
  overwrite: boolean;
};

function parseArgs(): Args {
  const overwrite = process.argv.includes("--overwrite");
  return { overwrite };
}

function initAdmin() {
  const projectId = detectProjectId();
  const keyPath = path.join(process.cwd(), "serviceAccountKey.json");
  if (fs.existsSync(keyPath)) {
    initializeApp({ credential: cert(keyPath), projectId });
    return;
  }

  // Fallback to ADC (e.g. GOOGLE_APPLICATION_CREDENTIALS, gcloud auth application-default login)
  initializeApp({ credential: applicationDefault(), projectId });
}

function detectProjectId(): string | undefined {
  const env =
    process.env.GCLOUD_PROJECT ||
    process.env.FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_CONFIG;
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
      const parsed = JSON.parse(raw) as any;
      if (typeof parsed?.projects?.default === "string") return parsed.projects.default;
    } catch {
      // ignore
    }
  }

  return undefined;
}

async function seedScoringConfig() {
  const db = getFirestore();
  await db.doc(firestorePaths.scoringConfigDoc()).set(
    {
      mode: "hybrid",
      points: {
        correctResult: 3,
        correctDraw: 4,
        exactScoreBonus: 3,
      },
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

async function seedMatches(overwrite: boolean) {
  const db = getFirestore();
  const now = Timestamp.now();

  const all = [...SEED_MATCHDAYS[1], ...SEED_MATCHDAYS[2], ...SEED_MATCHDAYS[3]];
  let written = 0;
  let skipped = 0;

  // Firestore batch max: 500
  for (let i = 0; i < all.length; i += 400) {
    const batch = db.batch();
    const slice = all.slice(i, i + 400);

    for (const item of slice) {
      const ref = db.doc(firestorePaths.masterMatchDoc(item.matchId));
      const snap = await ref.get();
      if (snap.exists && !overwrite) {
        skipped += 1;
        continue;
      }

      batch.set(
        ref,
        {
          status: "scheduled",
          kickoffAt: toTimestampUtc(item.kickoffAt),
          version: 1,
          updatedAt: now,
          updatedBy: "seedFirestore",
        },
        { merge: overwrite ? false : true }
      );
      written += 1;
    }

    await batch.commit();
  }

  return { written, skipped, total: all.length };
}

async function main() {
  const { overwrite } = parseArgs();
  initAdmin();

  await seedScoringConfig();
  const res = await seedMatches(overwrite);

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        ok: true,
        projectId: detectProjectId(),
        overwrite,
        ...res,
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

