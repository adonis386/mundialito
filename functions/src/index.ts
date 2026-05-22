import crypto from "node:crypto";

import { FieldValue, Timestamp, getFirestore, type Query } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";

import { TOURNAMENT_ID, firestorePaths } from "./firestorePaths.js";
import { linkMemberToLeaguePeers, rebuildAllLeaguePeersForUser, unlinkLeaguePeers } from "./leaguePeers.js";
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

type PrizeTierDoc = { place: number; label: string; percent: number };

function normalizePlannedParticipants(raw: unknown): number | null {
  if (raw == null) return null;
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n < 1 || n > 500) {
    throw new HttpsError("invalid-argument", "Participantes planificados inválido (1-500).");
  }
  return n;
}

function normalizePrizeTiers(raw: unknown): PrizeTierDoc[] {
  if (raw == null) return [];
  if (!Array.isArray(raw)) throw new HttpsError("invalid-argument", "Premios inválidos.");
  if (raw.length === 0) return [];
  const tiers = raw.map((item, i) => {
    const row = item as Record<string, unknown>;
    const label = String(row.label ?? "").trim().slice(0, 48);
    const percent = Number(row.percent);
    const place = Number(row.place ?? i + 1);
    if (!label || !Number.isFinite(percent) || percent < 0 || percent > 100) {
      throw new HttpsError("invalid-argument", "Cada puesto debe tener nombre y % entre 0 y 100.");
    }
    return { place: Math.floor(place), label, percent: Math.round(percent * 100) / 100 };
  });
  const sum = tiers.reduce((s, t) => s + t.percent, 0);
  if (Math.abs(sum - 100) > 0.05) {
    throw new HttpsError("invalid-argument", "Los porcentajes deben sumar 100.");
  }
  return tiers.sort((a, b) => a.place - b.place);
}

async function assertLeagueAdmin(leagueId: string, uid: string) {
  const memberSnap = await db.doc(firestorePaths.leagueMemberDoc(leagueId, uid)).get();
  if (!memberSnap.exists) throw new HttpsError("permission-denied", "No eres miembro de esta liga.");
  const role = String((memberSnap.data() as { role?: string })?.role ?? "member");
  if (role !== "owner" && role !== "admin") {
    throw new HttpsError("permission-denied", "Solo owner o admin pueden realizar esta acción.");
  }
}

type LeagueOverviewFields = {
  name?: string;
  membersCount?: number;
  entryFee?: number | null;
  plannedParticipants?: number | null;
  prizeTiers?: PrizeTierDoc[];
  prizeDescription?: string | null;
  scoringRules?: { mode: string; points: Record<string, number> };
  settings?: Record<string, string>;
};

function omitUndefinedFields<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

async function writeLeagueOverview(leagueId: string, fields: LeagueOverviewFields) {
  await db.doc(firestorePaths.leagueOverviewDoc(leagueId)).set(
    omitUndefinedFields({
      ...fields,
      updatedAt: Timestamp.now(),
    }),
    { merge: true }
  );
}

/** Fuente de verdad: subcolección members (evita desfase en overview / league doc). */
async function assertLeagueMember(leagueId: string, uid: string) {
  const memberSnap = await db.doc(firestorePaths.leagueMemberDoc(leagueId, uid)).get();
  if (!memberSnap.exists) throw new HttpsError("permission-denied", "No eres miembro de esta liga.");
}

/** Recalcula puntos por miembro desde picks + partidos final (misma matriz global). */
async function reconcileLeagueStats(leagueId: string) {
  const scoringConfig = await getScoringConfig();
  const membersSnap = await db.collection(`${firestorePaths.leagueDoc(leagueId)}/members`).get();
  const finalMatchesSnap = await db
    .collection(`tournaments/${TOURNAMENT_ID}/matches`)
    .where("status", "==", "final")
    .get();

  for (const memberDoc of membersSnap.docs) {
    const uid = memberDoc.id;
    let pointsTotal = 0;

    for (const matchDoc of finalMatchesSnap.docs) {
      const match = matchDoc.data() as MasterMatchDoc;
      if (!match.score) continue;
      const pickSnap = await db.doc(firestorePaths.userPickDoc(uid, matchDoc.id)).get();
      if (!pickSnap.exists) continue;
      const pick = pickSnap.data() as PickDoc;
      pointsTotal += scoreMatch({
        config: scoringConfig,
        prediction: pick.prediction,
        finalScore: match.score,
      }).points;
    }

    await db.doc(firestorePaths.leagueStatsDoc(leagueId, uid)).set(
      { pointsTotal, updatedAt: Timestamp.now() },
      { merge: true }
    );
  }
}

async function syncLeagueMembersCount(leagueId: string) {
  const countSnap = await db.collection(`${firestorePaths.leagueDoc(leagueId)}/members`).count().get();
  const count = countSnap.data().count;
  await db.doc(firestorePaths.leagueDoc(leagueId)).set({ membersCount: count }, { merge: true });
  const overviewRef = db.doc(firestorePaths.leagueOverviewDoc(leagueId));
  const overviewSnap = await overviewRef.get();
  if (overviewSnap.exists) {
    await overviewRef.set({ membersCount: count, updatedAt: Timestamp.now() }, { merge: true });
  }
  return count;
}

async function deleteQueryBatch(query: Query, batchSize = 400) {
  const snap = await query.limit(batchSize).get();
  if (snap.empty) return;
  const batch = db.batch();
  for (const docSnap of snap.docs) {
    batch.delete(docSnap.ref);
  }
  await batch.commit();
  if (snap.size >= batchSize) {
    await deleteQueryBatch(query, batchSize);
  }
}

export const createLeague = onCall(async (req) => {
  if (!req.auth?.uid) throw new HttpsError("unauthenticated", "Debe iniciar sesión.");

  const { name, entryFee, plannedParticipants, prizeTiers } = (req.data ?? {}) as {
    name?: string;
    entryFee?: number | null;
    plannedParticipants?: number | null;
    prizeTiers?: unknown;
  };
  const trimmed = (name ?? "").trim();
  if (trimmed.length < 3 || trimmed.length > 80) {
    throw new HttpsError("invalid-argument", "Nombre de liga inválido.");
  }

  let normalizedEntryFee: number | null = null;
  if (entryFee != null) {
    const n = Number(entryFee);
    if (!Number.isFinite(n) || n < 0 || n > 1_000_000) {
      throw new HttpsError("invalid-argument", "Monto de participación inválido.");
    }
    normalizedEntryFee = n === 0 ? null : Math.round(n * 100) / 100;
  }

  const planned = normalizePlannedParticipants(plannedParticipants);
  const tiers = normalizePrizeTiers(prizeTiers);
  if (tiers.length > 0 && (!normalizedEntryFee || normalizedEntryFee <= 0)) {
    throw new HttpsError("invalid-argument", "Define la cuota por participante si configuras premios por %.");
  }
  const scoringConfig = await getScoringConfig();

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
      entryFee: normalizedEntryFee,
      plannedParticipants: planned,
      prizeTiers: tiers,
      scoringRules: {
        mode: scoringConfig.mode,
        points: scoringConfig.points,
      },
      settings: {
        tournament: "Copa Mundial 2026",
        matchScope: "Fase de grupos y eliminatoria",
        predictionBy: "Por partido",
        pickDeadline: "Antes del kickoff oficial de cada partido (matriz master)",
        sortBy: "Puntos totales",
      },
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

  await writeLeagueOverview(leagueId, {
    name: trimmed,
    membersCount: 1,
    entryFee: normalizedEntryFee,
    plannedParticipants: planned,
    prizeTiers: tiers,
    scoringRules: {
      mode: scoringConfig.mode,
      points: scoringConfig.points,
    },
    settings: {
      tournament: "Copa Mundial 2026",
      matchScope: "Fase de grupos y eliminatoria",
      predictionBy: "Por partido",
      pickDeadline: "Antes del kickoff oficial de cada partido (matriz master)",
      sortBy: "Puntos totales",
    },
  });

  await recomputeLeagueLeaderboard(leagueId, 0);

  return { ok: true, leagueId, joinCode };
});

export const refreshLeagueLeaderboard = onCall(async (req) => {
  if (!req.auth?.uid) throw new HttpsError("unauthenticated", "Debe iniciar sesión.");
  const { leagueId } = (req.data ?? {}) as { leagueId?: string };
  const id = leagueId?.trim();
  if (!id) throw new HttpsError("invalid-argument", "Falta leagueId.");

  await assertLeagueMember(id, req.auth.uid);
  await recomputeLeagueLeaderboard(id, Date.now());

  return { ok: true };
});

export const updateLeaguePrizeSettings = onCall(async (req) => {
  if (!req.auth?.uid) throw new HttpsError("unauthenticated", "Debe iniciar sesión.");
  const { leagueId, entryFee, plannedParticipants, prizeTiers } = (req.data ?? {}) as {
    leagueId?: string;
    entryFee?: number | null;
    plannedParticipants?: number | null;
    prizeTiers?: unknown;
  };
  if (!leagueId?.trim()) throw new HttpsError("invalid-argument", "Falta leagueId.");

  const uid = req.auth.uid;
  await assertLeagueAdmin(leagueId.trim(), uid);

  let normalizedEntryFee: number | null = null;
  if (entryFee != null) {
    const n = Number(entryFee);
    if (!Number.isFinite(n) || n < 0 || n > 1_000_000) {
      throw new HttpsError("invalid-argument", "Monto de participación inválido.");
    }
    normalizedEntryFee = n === 0 ? null : Math.round(n * 100) / 100;
  }

  const planned = normalizePlannedParticipants(plannedParticipants);
  const tiers = normalizePrizeTiers(prizeTiers);
  if (tiers.length > 0 && (!normalizedEntryFee || normalizedEntryFee <= 0)) {
    throw new HttpsError("invalid-argument", "Define la cuota por participante si configuras premios por %.");
  }

  const id = leagueId.trim();
  await db.doc(firestorePaths.leagueDoc(id)).set(
    {
      entryFee: normalizedEntryFee,
      plannedParticipants: planned,
      prizeTiers: tiers,
      prizeSettingsUpdatedAt: Timestamp.now(),
    },
    { merge: true }
  );

  const membersCount = await syncLeagueMembersCount(id);
  await writeLeagueOverview(id, {
    entryFee: normalizedEntryFee,
    plannedParticipants: planned,
    prizeTiers: tiers,
    membersCount,
  });

  return { ok: true };
});

export const deleteLeague = onCall(async (req) => {
  if (!req.auth?.uid) throw new HttpsError("unauthenticated", "Debe iniciar sesión.");
  const { leagueId } = (req.data ?? {}) as { leagueId?: string };
  const id = leagueId?.trim();
  if (!id) throw new HttpsError("invalid-argument", "Falta leagueId.");

  const uid = req.auth.uid;
  await assertLeagueAdmin(id, uid);

  const leagueRef = db.doc(firestorePaths.leagueDoc(id));
  const leagueSnap = await leagueRef.get();
  if (!leagueSnap.exists) throw new HttpsError("not-found", "Liga no encontrada.");

  const membersSnap = await db.collection(`${firestorePaths.leagueDoc(id)}/members`).get();
  const memberUids = membersSnap.docs.map((memberDoc) =>
    String((memberDoc.data() as { uid?: string })?.uid ?? memberDoc.id)
  );
  for (const memberUid of memberUids) {
    await db.doc(`users/${memberUid}/leagueMemberships/${id}`).delete().catch(() => undefined);
  }
  await unlinkLeaguePeers(id, memberUids);

  await deleteQueryBatch(db.collection(`${firestorePaths.leagueDoc(id)}/members`));
  await deleteQueryBatch(db.collection(`${firestorePaths.leagueDoc(id)}/stats`));
  await deleteQueryBatch(db.collection(`${firestorePaths.leagueDoc(id)}/leaderboards`));
  await db.doc(firestorePaths.leagueOverviewDoc(id)).delete().catch(() => undefined);
  await leagueRef.delete();

  return { ok: true };
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

  const leagueSnap = await leagueRef.get();
  const overviewRef = db.doc(firestorePaths.leagueOverviewDoc(result.leagueId));
  const overviewSnap = await overviewRef.get();
  if (!overviewSnap.exists && leagueSnap.exists) {
    const d = leagueSnap.data() as LeagueOverviewFields & { name?: string };
    await writeLeagueOverview(result.leagueId, {
      name: d.name,
      entryFee: d.entryFee ?? null,
      plannedParticipants: d.plannedParticipants ?? null,
      prizeTiers: d.prizeTiers ?? [],
      prizeDescription: d.prizeDescription ?? null,
      scoringRules: d.scoringRules,
      settings: d.settings,
    });
  }
  await syncLeagueMembersCount(result.leagueId);

  await linkMemberToLeaguePeers({
    leagueId: result.leagueId,
    uid,
    displayName,
  });

  return { ok: true, leagueId: result.leagueId, leagueName: result.leagueName, joined: result.isNew };
});

export const syncMyLeaguePeers = onCall(async (req) => {
  if (!req.auth?.uid) throw new HttpsError("unauthenticated", "Debe iniciar sesión.");
  const uid = req.auth.uid;
  const displayName = String((req.auth.token as any)?.name ?? "").trim() || null;
  await rebuildAllLeaguePeersForUser(uid, displayName);
  return { ok: true };
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
      const membershipsSnap = await db.collection(`users/${uid}/leagueMemberships`).get();
      for (const membershipDoc of membershipsSnap.docs) {
        const leagueId = membershipDoc.id;
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
      await reconcileLeagueStats(leagueId);
      await recomputeLeagueLeaderboard(leagueId, match.version);
    }
  }
);

type TopRow = { uid: string; pointsTotal: number; rank: number };
type TopRowWithName = TopRow & { displayName: string | null };

async function enrichTopWithDisplayNames(rows: TopRow[]): Promise<TopRowWithName[]> {
  if (rows.length === 0) return [];
  const refs = rows.map((r) => db.doc(firestorePaths.userProfileDoc(r.uid)));
  const snaps = await db.getAll(...refs);
  return rows.map((r, i) => {
    const s = snaps[i]!;
    const raw = s.exists ? (s.data() as { displayName?: string })?.displayName : undefined;
    const displayName = raw != null && String(raw).trim() ? String(raw).trim() : null;
    return { ...r, displayName };
  });
}

async function recomputeGlobalLeaderboard(sourceVersion: number) {
  const snap = await db.collection("userStats").orderBy("pointsTotal", "desc").limit(50).get();
  const base: TopRow[] = snap.docs.map((d, idx) => ({
    uid: d.id,
    pointsTotal: Number((d.data() as any).pointsTotal ?? 0),
    rank: idx + 1,
  }));
  const top = await enrichTopWithDisplayNames(base);

  await db.doc(firestorePaths.globalLeaderboardDoc()).set({
    top,
    updatedAt: Timestamp.now(),
    sourceVersion,
  });
}

async function recomputeLeagueLeaderboard(leagueId: string, sourceVersion: number) {
  await reconcileLeagueStats(leagueId);

  const snap = await db
    .collection(`leagues/${leagueId}/stats`)
    .orderBy("pointsTotal", "desc")
    .limit(50)
    .get();

  const base: TopRow[] = snap.docs.map((d, idx) => ({
    uid: d.id,
    pointsTotal: Number((d.data() as any).pointsTotal ?? 0),
    rank: idx + 1,
  }));
  const top = await enrichTopWithDisplayNames(base);

  await db.doc(firestorePaths.leagueLeaderboardDoc(leagueId)).set({
    top,
    updatedAt: Timestamp.now(),
    sourceVersion,
  });
}

export const getMyGlobalRank = onCall(async (req) => {
  if (!req.auth?.uid) throw new HttpsError("unauthenticated", "Debe iniciar sesión.");
  const uid = req.auth.uid;
  const statSnap = await db.doc(firestorePaths.userStatsDoc(uid)).get();
  const myPoints = statSnap.exists ? Number((statSnap.data() as any).pointsTotal ?? 0) : 0;
  const higher = await db.collection("userStats").where("pointsTotal", ">", myPoints).count().get();
  const rank = higher.data().count + 1;
  return { ok: true, rank, pointsTotal: myPoints };
});

export const getMyLeagueRank = onCall(async (req) => {
  if (!req.auth?.uid) throw new HttpsError("unauthenticated", "Debe iniciar sesión.");
  const { leagueId } = (req.data ?? {}) as { leagueId?: string };
  if (!leagueId?.trim()) throw new HttpsError("invalid-argument", "Falta leagueId.");
  const uid = req.auth.uid;
  const statSnap = await db.doc(firestorePaths.leagueStatsDoc(leagueId.trim(), uid)).get();
  const myPoints = statSnap.exists ? Number((statSnap.data() as any).pointsTotal ?? 0) : 0;
  const higher = await db.collection(`leagues/${leagueId.trim()}/stats`).where("pointsTotal", ">", myPoints).count().get();
  const rank = higher.data().count + 1;
  return { ok: true, rank, pointsTotal: myPoints };
});

