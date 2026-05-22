import { FieldValue, Timestamp, getFirestore, type WriteBatch } from "firebase-admin/firestore";
import { firestorePaths } from "./firestorePaths.js";

const db = getFirestore();

const BATCH_LIMIT = 400;

async function commitBatches(ops: Array<(batch: WriteBatch) => void>) {
  for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    for (const op of ops.slice(i, i + BATCH_LIMIT)) op(batch);
    await batch.commit();
  }
}

/** Enlaza a un miembro con el resto de la liga (lectura de picks tras kickoff). */
export async function linkMemberToLeaguePeers(params: {
  leagueId: string;
  uid: string;
  displayName: string | null;
}) {
  const membersSnap = await db.collection(`${firestorePaths.leagueDoc(params.leagueId)}/members`).get();
  const now = Timestamp.now();
  const ops: Array<(batch: WriteBatch) => void> = [];

  for (const memberDoc of membersSnap.docs) {
    const otherUid = String((memberDoc.data() as { uid?: string })?.uid ?? memberDoc.id);
    if (otherUid === params.uid) continue;

    const otherDisplay =
      typeof (memberDoc.data() as { displayName?: unknown })?.displayName === "string"
        ? String((memberDoc.data() as { displayName: string }).displayName).trim() || null
        : null;

    ops.push((batch) => {
      batch.set(
        db.doc(`users/${params.uid}/leaguePeers/${otherUid}`),
        {
          peerUid: otherUid,
          displayName: otherDisplay,
          leagueIds: FieldValue.arrayUnion(params.leagueId),
          updatedAt: now,
        },
        { merge: true }
      );
      batch.set(
        db.doc(`users/${otherUid}/leaguePeers/${params.uid}`),
        {
          peerUid: params.uid,
          displayName: params.displayName,
          leagueIds: FieldValue.arrayUnion(params.leagueId),
          updatedAt: now,
        },
        { merge: true }
      );
    });
  }

  if (ops.length > 0) await commitBatches(ops);
}

/** Quita vínculos de peer de una liga eliminada. */
export async function unlinkLeaguePeers(leagueId: string, memberUids: string[]) {
  const unique = [...new Set(memberUids.filter(Boolean))];
  const ops: Array<(batch: WriteBatch) => void> = [];

  for (const uid of unique) {
    for (const otherUid of unique) {
      if (otherUid === uid) continue;
      const peerRef = db.doc(`users/${uid}/leaguePeers/${otherUid}`);
      const snap = await peerRef.get();
      if (!snap.exists) continue;

      const leagueIds = ((snap.data() as { leagueIds?: string[] })?.leagueIds ?? []).filter((id) => id !== leagueId);
      if (leagueIds.length === 0) {
        ops.push((batch) => batch.delete(peerRef));
      } else {
        ops.push((batch) => batch.set(peerRef, { leagueIds, updatedAt: Timestamp.now() }, { merge: true }));
      }
    }
  }

  if (ops.length > 0) await commitBatches(ops);
}

/** Reconstruye enlaces de peer para todas las ligas del usuario (backfill). */
export async function rebuildAllLeaguePeersForUser(uid: string, displayName: string | null) {
  const memberships = await db.collection(`users/${uid}/leagueMemberships`).get();
  for (const m of memberships.docs) {
    const leagueId = m.id;
    const memberRef = db.doc(firestorePaths.leagueMemberDoc(leagueId, uid));
    const memberSnap = await memberRef.get();
    if (!memberSnap.exists) continue;
    await linkMemberToLeaguePeers({ leagueId, uid, displayName });
  }
}
