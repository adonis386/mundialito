import crypto from "node:crypto";

import { FieldPath, FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";

import { TOURNAMENT_ID, firestorePaths } from "./firestorePaths.js";
import { scoreMatch, type ScoringConfig, type SoccerScore } from "./scoring.js";

initializeApp();
const db = getFirestore();

type MasterMatchDoc = {
  status: "scheduled" | "live" | "final";
  score?: SoccerScore;
  version: number;
  kickoffAt: Timestamp;
};

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
    return { mode: "hybrid", points: { correctResult: 3, exactScoreBonus: 2 } };
  }

  return {
    mode: data.mode,
    points: {
      correctResult: Number(data.points.correctResult ?? 3),
      exactScoreBonus: Number(data.points.exactScoreBonus ?? 2),
    },
  };
}

export const joinLeague = onCall(async (req) => {
  if (!req.auth?.uid) throw new HttpsError("unauthenticated", "Debe iniciar sesión.");

  const { leagueId, joinCode } = (req.data ?? {}) as { leagueId?: string; joinCode?: string };
  if (!leagueId || !joinCode) throw new HttpsError("invalid-argument", "Faltan datos.");

  const leagueRef = db.doc(firestorePaths.leagueDoc(leagueId));
  const leagueSnap = await leagueRef.get();
  if (!leagueSnap.exists) throw new HttpsError("not-found", "Liga no existe.");

  const league = leagueSnap.data() as { joinCodeHash?: string; visibility?: string };
  if (league.visibility !== "private") {
    throw new HttpsError("failed-precondition", "Esta liga no admite uniones por código.");
  }

  if (!league.joinCodeHash || sha256(joinCode) !== league.joinCodeHash) {
    throw new HttpsError("permission-denied", "Código inválido.");
  }

  const memberRef = db.doc(firestorePaths.leagueMemberDoc(leagueId, req.auth.uid));
  await memberRef.set(
    {
      role: "member",
      joinedAt: Timestamp.now(),
    },
    { merge: false }
  );

  return { ok: true };
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

