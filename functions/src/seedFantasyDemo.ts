/**
 * Crea una liga privada de prueba con usuarios Auth ficticios y picks en partidos seed (jornada 1).
 * Requiere Admin SDK (serviceAccountKey.json en functions/ o ADC).
 *
 * Uso:
 *   cd functions && npm run build && node lib/seedFantasyDemo.js --tag=lab1
 *
 * Opciones:
 *   --tag=lab1          sufijo único (emails y marcador idempotente)
 *   --players=6        total miembros (1 owner + N-1 competidores)
 *   --picks=8          cuántos partidos de la jornada 1 tendrán pick (en orden)
 *   --password=...     misma contraseña para todos los usuarios demo (default FantasyDemo2026!)
 *   --past-kickoff      pone md1-01 con kickoff hace 24h (picks cerrados + comunidad legible en UI)
 *   --force             ignora idempotencia y vuelve a crear liga (mismos usuarios si ya existen)
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import type { Firestore } from "firebase-admin/firestore";
import { Timestamp, getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

import { linkMemberToLeaguePeers } from "./leaguePeers.js";
import { SEED_MATCHDAYS } from "./seedData.js";
import { firestorePaths } from "./firestorePaths.js";

const DEFAULT_PASSWORD = "FantasyDemo2026!";

const BOT_NAMES = [
  "La Vinotinto FC",
  "Areperos United",
  "Café con Leche CF",
  "Los Llanos SC",
  "Sambil City",
  "El Ávila GK",
  "Los Teques FC",
  "Margarita Beach",
  "Catatumbo CF",
  "Orinoco Delta",
  "Los Andes 11",
  "Caracas Night",
];

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function randomJoinCode(length = 8) {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]!;
  }
  return `${out.slice(0, 4)}-${out.slice(4)}`;
}

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

function argVal(name: string, fallback: string) {
  const raw = process.argv.find((a) => a.startsWith(`${name}=`))?.slice(name.length + 1);
  return raw?.trim() || fallback;
}

function argInt(name: string, fallback: number, min: number, max: number) {
  const v = Number.parseInt(argVal(name, String(fallback)), 10);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, v));
}

function hasFlag(name: string) {
  return process.argv.includes(name);
}

function sanitizeProjectId() {
  return (detectProjectId() ?? "dev").replace(/[^a-zA-Z0-9]/g, "").slice(0, 16) || "dev";
}

function demoEmail(tag: string, role: "owner" | "bot", index: number) {
  const safe = tag.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 12) || "demo";
  const pid = sanitizeProjectId();
  if (role === "owner") return `fantasy-${pid}-${safe}-owner@example.com`;
  return `fantasy-${pid}-${safe}-bot-${String(index).padStart(2, "0")}@example.com`;
}

type DemoUser = { uid: string; email: string; displayName: string; role: "owner" | "member" };

async function ensureUser(email: string, password: string, displayName: string): Promise<string> {
  const auth = getAuth();
  try {
    const u = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: false,
      disabled: false,
    });
    return u.uid;
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "auth/email-already-exists") {
      const u = await auth.getUserByEmail(email);
      await auth.updateUser(u.uid, { password, displayName });
      return u.uid;
    }
    throw e;
  }
}

async function writeLeagueLeaderboardZeros(db: Firestore, leagueId: string, users: DemoUser[]) {
  const sorted = [...users].sort((a, b) => a.uid.localeCompare(b.uid));
  const refs = sorted.map((u) => db.doc(firestorePaths.userProfileDoc(u.uid)));
  const snaps = await db.getAll(...refs);
  const top = sorted.map((u, idx) => {
    const snap = snaps[idx]!;
    const dn = snap.exists ? String((snap.data() as { displayName?: string })?.displayName ?? "").trim() : "";
    return {
      uid: u.uid,
      pointsTotal: 0,
      rank: idx + 1,
      displayName: dn || null,
    };
  });
  await db.doc(firestorePaths.leagueLeaderboardDoc(leagueId)).set({
    top,
    updatedAt: Timestamp.now(),
    sourceVersion: 0,
  });
}

async function main() {
  const tag = argVal("--tag", "demo").replace(/[^a-zA-Z0-9_-]/g, "") || "demo";
  const players = argInt("--players", 6, 2, 24);
  const picksCount = argInt("--picks", 8, 1, SEED_MATCHDAYS[1].length);
  const password = argVal("--password", DEFAULT_PASSWORD);
  const pastKickoff = hasFlag("--past-kickoff");
  const force = hasFlag("--force");

  initAdmin();
  const db = getFirestore();
  const markerRef = db.doc(`seedMarkers/fantasyDemo_${tag}`);
  const markerSnap = await markerRef.get();
  if (markerSnap.exists && !force) {
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify(
        {
          ok: false,
          skipped: true,
          message: "Ya existe seed para este --tag. Usa --force o otro --tag.",
          existing: markerSnap.data(),
        },
        null,
        2
      )
    );
    return;
  }

  const j1 = SEED_MATCHDAYS[1];
  const matchIds = j1.slice(0, picksCount).map((m) => m.matchId);
  const now = Timestamp.now();

  const ownerEmail = demoEmail(tag, "owner", 0);
  const ownerUid = await ensureUser(ownerEmail, password, "Comisario Fantasy (demo)");
  await db.doc(firestorePaths.userProfileDoc(ownerUid)).set(
    { displayName: "Comisario Fantasy (demo)", email: ownerEmail, updatedAt: now },
    { merge: true }
  );

  const bots: DemoUser[] = [
    { uid: ownerUid, email: ownerEmail, displayName: "Comisario Fantasy (demo)", role: "owner" },
  ];

  for (let i = 1; i < players; i += 1) {
    const email = demoEmail(tag, "bot", i);
    const displayName = BOT_NAMES[(i - 1) % BOT_NAMES.length] ?? `Bot ${i}`;
    const uid = await ensureUser(email, password, displayName);
    await db.doc(firestorePaths.userProfileDoc(uid)).set(
      { displayName, email, updatedAt: now },
      { merge: true }
    );
    bots.push({ uid, email, displayName, role: "member" });
  }

  const joinCode = randomJoinCode();
  const joinCodeHash = sha256(joinCode);
  const leagueRef = db.collection("leagues").doc();
  const leagueId = leagueRef.id;
  const leagueName = `Fantasy demo (${tag})`;

  const batch = db.batch();
  batch.set(leagueRef, {
    name: leagueName,
    ownerUid,
    visibility: "private",
    joinCode,
    joinCodeHash,
    createdAt: now,
    membersCount: bots.length,
  });

  for (const u of bots) {
    const role = u.role === "owner" ? "owner" : "member";
    batch.set(db.doc(firestorePaths.leagueMemberDoc(leagueId, u.uid)), {
      uid: u.uid,
      displayName: u.displayName,
      email: u.email,
      role,
      joinedAt: now,
    });
    batch.set(db.doc(`users/${u.uid}/leagueMemberships/${leagueId}`), {
      leagueId,
      name: leagueName,
      role,
      displayName: u.displayName,
      joinedAt: now,
    });
    batch.set(
      db.doc(firestorePaths.leagueStatsDoc(leagueId, u.uid)),
      { pointsTotal: 0, updatedAt: now },
      { merge: true }
    );
  }

  await batch.commit();

  for (const u of bots) {
    await linkMemberToLeaguePeers({ leagueId, uid: u.uid, displayName: u.displayName });
  }

  let pickWrites = 0;
  for (let bi = 0; bi < bots.length; bi += 1) {
    const u = bots[bi]!;
    for (let mi = 0; mi < matchIds.length; mi += 1) {
      const matchId = matchIds[mi]!;
      const h = (mi + bi * 3) % 5;
      const a = (mi * 2 + bi) % 4;
      const pickRef = db.doc(firestorePaths.userPickDoc(u.uid, matchId));
      await pickRef.set(
        {
          matchId,
          prediction: { home: h, away: a },
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );
      pickWrites += 1;
    }
  }

  await writeLeagueLeaderboardZeros(db, leagueId, bots);

  if (pastKickoff) {
    const first = matchIds[0];
    if (first) {
      const ref = db.doc(firestorePaths.masterMatchDoc(first));
      const ago = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
      await ref.set(
        {
          kickoffAt: ago,
          status: "live",
          version: 1,
          updatedAt: now,
          updatedBy: "seedFantasyDemo",
        },
        { merge: true }
      );
    }
  }

  await markerRef.set(
    {
      leagueId,
      leagueName,
      tag,
      joinCode,
      players: bots.length,
      matchIds,
      pastKickoff,
      createdAt: now,
    },
    { merge: true }
  );

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        ok: true,
        projectId: detectProjectId(),
        leagueId,
        leagueName,
        joinCode,
        tag,
        players: bots.length,
        picksWritten: pickWrites,
        matchIdsWithPicks: matchIds,
        pastKickoff,
        logins: bots.map((b) => ({ email: b.email, displayName: b.displayName, role: b.role })),
        password,
        hint: pastKickoff
          ? "md1-01 quedó en vivo con kickoff en el pasado: en /matches podrás ver comunidad en ese partido."
          : "Para probar comunidad sin esperar 2026, vuelve a ejecutar con --past-kickoff (solo toca md1-01).",
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
