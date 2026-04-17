import crypto from "node:crypto";

import { FieldPath, FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";

import { TOURNAMENT_ID, firestorePaths } from "./firestorePaths.js";
import { scoreMatch, type ScoringConfig, type SoccerScore } from "./scoring.js";
import { SEED_MATCHDAYS, toTimestampUtc } from "./seedData.js";

initializeApp();
const db = getFirestore();

type MasterMatchDoc = {
  status: "scheduled" | "live" | "final";
  score?: SoccerScore;
  version: number;
  kickoffAt: Timestamp;
};

function isEmulator() {
  // Present when running Functions emulator.
  return Boolean(process.env.FUNCTIONS_EMULATOR);
}

type PickDoc = {
  matchId: string;
  prediction: SoccerScore;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

type MatchPointsDoc = {
  matchId: string;
  points: number;
  correctResult: boolean;
  exactScore: boolean;
  sourceVersion: number;
  updatedAt: Timestamp;
};

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

async function getScoringConfig(): Promise<ScoringConfig> {
  const snap = await db.doc(firestorePaths.scoringConfigDoc()).get();
  const data = snap.data() as Partial<ScoringConfig> | undefined;

  if (!data?.mode || !data?.points) {
    return { mode: "hybrid", points: { correctResult: 3, correctDraw: 4, exactScoreBonus: 3 } };
  }

  return {
    mode: data.mode,
    points: {
      correctResult: Number(data.points.correctResult ?? 3),
      correctDraw: Number((data.points as any).correctDraw ?? 4),
      exactScoreBonus: Number(data.points.exactScoreBonus ?? 3),
    },
  };
}

function randomJoinCode(length = 8) {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(Math.random() * alphabet.length);
    out += alphabet[idx];
  }
  return `${out.slice(0, 4)}-${out.slice(4)}`;
}

export const createLeague = onCall(async (req) => {
  if (!req.auth?.uid) throw new HttpsError("unauthenticated", "Debe iniciar sesión.");

  const { name } = (req.data ?? {}) as { name?: string };
  const trimmed = (name ?? "").trim();
  if (trimmed.length < 3 || trimmed.length > 80) {
    throw new HttpsError("invalid-argument", "Nombre de liga inválido.");
  }

  const ownerUid = req.auth.uid;
  const ownerDisplayName = String((req.auth.token as any)?.name ?? "").trim() || null;
  const ownerEmail = String((req.auth.token as any)?.email ?? "").trim() || null;
  const leagueRef = db.collection("leagues").doc();
  const leagueId = leagueRef.id;
  const joinCode = randomJoinCode();
  const now = Timestamp.now();

  await db.runTransaction(async (tx) => {
    tx.set(leagueRef, {
      name: trimmed,
      ownerUid,
      visibility: "private",
      joinCode,
      joinCodeHash: sha256(joinCode),
      createdAt: now,
      membersCount: 1,
    });

    const memberRef = db.doc(firestorePaths.leagueMemberDoc(leagueId, ownerUid));
    tx.set(memberRef, {
      uid: ownerUid,
      displayName: ownerDisplayName,
      email: ownerEmail,
      role: "owner",
      joinedAt: now,
    });

    const membershipRef = db.doc(`users/${ownerUid}/leagueMemberships/${leagueId}`);
    tx.set(membershipRef, {
      leagueId,
      name: trimmed,
      role: "owner",
      displayName: ownerDisplayName,
      joinedAt: now,
    });
  });

  return { ok: true, leagueId, joinCode };
});

export const regenerateLeagueJoinCode = onCall(async (req) => {
  if (!req.auth?.uid) throw new HttpsError("unauthenticated", "Debe iniciar sesión.");
  const { leagueId } = (req.data ?? {}) as { leagueId?: string };
  if (!leagueId) throw new HttpsError("invalid-argument", "Faltan datos.");

  const uid = req.auth.uid;
  const leagueRef = db.doc(firestorePaths.leagueDoc(leagueId));
  const memberRef = db.doc(firestorePaths.leagueMemberDoc(leagueId, uid));

  const joinCode = randomJoinCode();
  await db.runTransaction(async (tx) => {
    const memberSnap = await tx.get(memberRef);
    if (!memberSnap.exists) throw new HttpsError("permission-denied", "No eres miembro de esta liga.");
    const role = String((memberSnap.data() as any)?.role ?? "member");
    if (role !== "owner" && role !== "admin") throw new HttpsError("permission-denied", "Solo el owner puede regenerar el código.");

    tx.set(
      leagueRef,
      {
        joinCode,
        joinCodeHash: sha256(joinCode),
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  });

  return { ok: true, joinCode };
});

export const joinLeague = onCall(async (req) => {
  if (!req.auth?.uid) throw new HttpsError("unauthenticated", "Debe iniciar sesión.");

  const { leagueId: maybeLeagueId, joinCode } = (req.data ?? {}) as { leagueId?: string; joinCode?: string };
  const normalizedCode = (joinCode ?? "").trim().toUpperCase();
  if (!normalizedCode) throw new HttpsError("invalid-argument", "Faltan datos.");

  // Preferred: join only with code (no need to know leagueId).
  let leagueId = maybeLeagueId?.trim();
  if (!leagueId) {
    const hash = sha256(normalizedCode);
    const leaguesSnap = await db
      .collection("leagues")
      .where("visibility", "==", "private")
      .where("joinCodeHash", "==", hash)
      .limit(2)
      .get();

    if (leaguesSnap.empty) throw new HttpsError("permission-denied", "Código inválido.");
    if (leaguesSnap.docs.length > 1) throw new HttpsError("failed-precondition", "Código duplicado. Contacta soporte.");
    leagueId = leaguesSnap.docs[0]!.id;
  }

  const leagueRef = db.doc(firestorePaths.leagueDoc(leagueId));
  const uid = req.auth.uid;
  const displayName = String((req.auth.token as any)?.name ?? "").trim() || null;
  const email = String((req.auth.token as any)?.email ?? "").trim() || null;
  const now = Timestamp.now();

  const result = await db.runTransaction(async (tx) => {
    const leagueSnap = await tx.get(leagueRef);
    if (!leagueSnap.exists) throw new HttpsError("not-found", "Liga no existe.");

    const league = leagueSnap.data() as { joinCodeHash?: string; visibility?: string; name?: string };
    if (league.visibility !== "private") {
      throw new HttpsError("failed-precondition", "Esta liga no admite uniones por código.");
    }

    // Back-compat: if caller still sends leagueId, validate code hash too.
    if (maybeLeagueId?.trim()) {
      if (!league.joinCodeHash || sha256(normalizedCode) !== league.joinCodeHash) {
        throw new HttpsError("permission-denied", "Código inválido.");
      }
    }

    const memberRef = db.doc(firestorePaths.leagueMemberDoc(leagueId!, uid));
    const memberSnap = await tx.get(memberRef);
    const isNew = !memberSnap.exists;

    if (isNew) {
      tx.set(memberRef, { uid, displayName, email, role: "member", joinedAt: now }, { merge: false });
      tx.set(
        leagueRef,
        { membersCount: FieldValue.increment(1) },
        { merge: true }
      );
    }

    const membershipRef = db.doc(`users/${uid}/leagueMemberships/${leagueId}`);
    tx.set(
      membershipRef,
      { leagueId, name: String(league.name ?? "Liga"), role: isNew ? "member" : (memberSnap.data() as any)?.role ?? "member", displayName, joinedAt: now },
      { merge: true }
    );

    return { leagueId, leagueName: String(league.name ?? "Liga"), isNew };
  });

  // Ensure the league leaderboard exists/refreshes after joins.
  await recomputeLeagueLeaderboard(result.leagueId, 0);

  return { ok: true, leagueId: result.leagueId, leagueName: result.leagueName, joined: result.isNew };
});

export const seedMasterMatches = onCall(async (req) => {
  if (!req.auth?.uid) throw new HttpsError("unauthenticated", "Debe iniciar sesión.");

  const isAdmin = req.auth.token?.admin === true;
  if (!isAdmin && !isEmulator()) {
    throw new HttpsError("permission-denied", "Solo admin puede ejecutar el seeding.");
  }

  const { matchday, overwrite } = (req.data ?? {}) as {
    matchday?: 1 | 2 | 3;
    overwrite?: boolean;
  };

  const days: (1 | 2 | 3)[] = matchday ? [matchday] : [1, 2, 3];
  const now = Timestamp.now();

  let written = 0;
  for (const day of days) {
    for (const item of SEED_MATCHDAYS[day]) {
      const ref = db.doc(firestorePaths.masterMatchDoc(item.matchId));
      const kickoffAt = toTimestampUtc(item.kickoffAt);

      await db.runTransaction(async (tx) => {
        const prev = await tx.get(ref);
        if (prev.exists && !overwrite) return;

        tx.set(
          ref,
          {
            status: "scheduled",
            version: 1,
            kickoffAt,
            updatedAt: now,
            updatedBy: req.auth?.uid ?? "seed",
          } as MasterMatchDoc & { updatedAt: Timestamp; updatedBy: string },
          { merge: overwrite ? false : true }
        );

        written += 1;
      });
    }
  }

  return { ok: true, written, days };
});

export const onMasterMatchWritten = onDocumentWritten(
  `tournaments/${TOURNAMENT_ID}/matches/{matchId}`,
  async (event) => {
    const matchId = (event.params as { matchId: string }).matchId;

    const after = event.data?.after;
    if (!after?.exists) return;

    const match = after.data() as MasterMatchDoc;
    if (match.status !== "final" || !match.score) return;

    // Compute points for all picks of this match
    const scoringConfig = await getScoringConfig();

    const picksSnap = await db
      .collectionGroup("picks")
      .where("matchId", "==", matchId)
      .get();

    if (picksSnap.empty) {
      logger.info("No picks found for match", { matchId });
      return;
    }

    const touchedLeagueIds = new Set<string>();

    // For small scale: sequential per user (keeps logic simple + idempotent).
    for (const pickDocSnap of picksSnap.docs) {
      const pick = pickDocSnap.data() as PickDoc;
      const uid = pickDocSnap.ref.parent.parent?.id;
      if (!uid) continue;

      const breakdown = scoreMatch({
        config: scoringConfig,
        prediction: pick.prediction,
        finalScore: match.score,
      });

      const matchPointsRef = db.doc(`users/${uid}/matchPoints/${matchId}`);

      const deltas = await db.runTransaction(async (tx) => {
        const prev = await tx.get(matchPointsRef);
        const prevData = prev.exists ? (prev.data() as MatchPointsDoc) : undefined;

        if (prevData?.sourceVersion === match.version) {
          return { deltaPoints: 0, deltaCorrect: 0, deltaExact: 0 };
        }

        const prevPoints = prevData?.points ?? 0;
        const prevCorrect = prevData?.correctResult ? 1 : 0;
        const prevExact = prevData?.exactScore ? 1 : 0;

        const deltaPoints = breakdown.points - prevPoints;
        const deltaCorrect = (breakdown.correctResult ? 1 : 0) - prevCorrect;
        const deltaExact = (breakdown.exactScore ? 1 : 0) - prevExact;

        tx.set(matchPointsRef, {
          matchId,
          points: breakdown.points,
          correctResult: breakdown.correctResult,
          exactScore: breakdown.exactScore,
          sourceVersion: match.version,
          updatedAt: Timestamp.now(),
        } satisfies MatchPointsDoc);

        const userStatsRef = db.doc(firestorePaths.userStatsDoc(uid));
        tx.set(
          userStatsRef,
          {
            pointsTotal: FieldValue.increment(deltaPoints),
            correctResults: FieldValue.increment(deltaCorrect),
            exactScores: FieldValue.increment(deltaExact),
            updatedAt: Timestamp.now(),
          },
          { merge: true }
        );

        return { deltaPoints, deltaCorrect, deltaExact };
      });

      if (deltas.deltaPoints === 0 && deltas.deltaCorrect === 0 && deltas.deltaExact === 0) {
        continue;
      }

      // Update per-league stats for leagues where uid is a member
      const leaguesSnap = await db
        .collectionGroup("members")
        .where(FieldPath.documentId(), "==", uid)
        .get();

      for (const memberSnap of leaguesSnap.docs) {
        const leagueId = memberSnap.ref.parent.parent?.id;
        if (!leagueId) continue;

        touchedLeagueIds.add(leagueId);

        await db.doc(firestorePaths.leagueStatsDoc(leagueId, uid)).set(
          {
            pointsTotal: FieldValue.increment(deltas.deltaPoints),
            updatedAt: Timestamp.now(),
          },
          { merge: true }
        );
      }
    }

    // Recompute global leaderboard (top 50) and touched league leaderboards.
    await recomputeGlobalLeaderboard(match.version);
    for (const leagueId of touchedLeagueIds) {
      await recomputeLeagueLeaderboard(leagueId, match.version);
    }
  }
);

async function recomputeGlobalLeaderboard(sourceVersion: number) {
  const snap = await db.collection("userStats").orderBy("pointsTotal", "desc").limit(50).get();
  const top = snap.docs.map((d, idx) => ({
    uid: d.id,
    pointsTotal: Number((d.data() as any).pointsTotal ?? 0),
    rank: idx + 1,
  }));

  await db.doc(firestorePaths.globalLeaderboardDoc()).set({
    top,
    updatedAt: Timestamp.now(),
    sourceVersion,
  });
}

async function recomputeLeagueLeaderboard(leagueId: string, sourceVersion: number) {
  const snap = await db
    .collection(`leagues/${leagueId}/stats`)
    .orderBy("pointsTotal", "desc")
    .limit(50)
    .get();

  const top = snap.docs.map((d, idx) => ({
    uid: d.id,
    pointsTotal: Number((d.data() as any).pointsTotal ?? 0),
    rank: idx + 1,
  }));

  await db.doc(firestorePaths.leagueLeaderboardDoc(leagueId)).set({
    top,
    updatedAt: Timestamp.now(),
    sourceVersion,
  });
}

