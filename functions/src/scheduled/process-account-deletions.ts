import { onSchedule } from 'firebase-functions/v2/scheduler';
import { adminAuth, adminBucket, adminFirestore } from '../services/firebase-admin';
import {
  processAccountDeletionRecord,
  type AccountDeletionRecord,
} from '../model/account-deletion';

async function deleteCrafts(uid: string) {
  const database = adminFirestore();
  const snapshot = await database.collection('crafts').where('ownerUid', '==', uid).get();
  for (let index = 0; index < snapshot.docs.length; index += 400) {
    const batch = database.batch();
    for (const document of snapshot.docs.slice(index, index + 400)) batch.delete(document.ref);
    await batch.commit();
  }
}

async function deleteScreenshots(uid: string) {
  const [files] = await adminBucket().getFiles({ prefix: `screenshots/${uid}/` });
  await Promise.all(files.map((file) => file.delete({ ignoreNotFound: true })));
}

async function deleteAuth(uid: string) {
  try {
    await adminAuth().deleteUser(uid);
  } catch (error: unknown) {
    if (!(error instanceof Error && 'code' in error && error.code === 'auth/user-not-found')) {
      throw error;
    }
  }
}

export const processAccountDeletions = onSchedule('every 15 minutes', async () => {
  const database = adminFirestore();
  const snapshot = await database
    .collection('accountDeletionRequests')
    .where('status', '==', 'pending')
    .where('scheduledFor', '<=', new Date().toISOString())
    .get();
  let completed = 0;
  let failed = 0;
  for (const document of snapshot.docs) {
    const record = document.data() as AccountDeletionRecord;
    const result = await processAccountDeletionRecord(record, {
      markProcessing: (current, now) =>
        (async () => {
          await document.ref.set(
            { ...current, status: 'processing', processingStartedAt: now },
            { merge: true },
          );
        })(),
      deleteCrafts,
      deleteScreenshots,
      deleteAuth,
      markCompleted: (current, now) =>
        (async () => {
          await document.ref.set(
            { ...current, status: 'completed', completedAt: now, failureMessage: null },
            { merge: true },
          );
        })(),
      markFailed: (current, now, message) =>
        (async () => {
          await document.ref.set(
            { ...current, status: 'failed', failedAt: now, failureMessage: message },
            { merge: true },
          );
        })(),
    });
    if (result === 'completed') completed += 1;
    if (result === 'failed') failed += 1;
  }
  console.log(`Exclusões processadas: ${completed} concluída(s), ${failed} falha(s).`);
});
