import fs from "node:fs";
import path from "node:path";

import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

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

function initAdmin() {
  const projectId = detectProjectId();
  const keyPath = path.join(process.cwd(), "serviceAccountKey.json");
  if (fs.existsSync(keyPath)) {
    initializeApp({ credential: cert(keyPath), projectId });
    return;
  }

  initializeApp({ credential: applicationDefault(), projectId });
}

function parseArgs() {
  const uid = process.argv.find((a) => a.startsWith("--uid="))?.split("=", 2)[1];
  const email = process.argv.find((a) => a.startsWith("--email="))?.split("=", 2)[1];
  const adminRaw = process.argv.find((a) => a.startsWith("--admin="))?.split("=", 2)[1];
  const admin = adminRaw ? adminRaw === "true" : true;

  if (!uid && !email) {
    throw new Error("Usage: node lib/setAdminClaim.js --uid=<UID> [--admin=true|false]");
  }

  return { uid, email, admin };
}

async function main() {
  const { uid, email, admin } = parseArgs();
  initAdmin();

  const auth = getAuth();
  const targetUid = uid ?? (await auth.getUserByEmail(email!)).uid;
  await auth.setCustomUserClaims(targetUid, { admin });

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ ok: true, uid: targetUid, admin }, null, 2));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});

