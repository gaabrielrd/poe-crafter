import { onSchedule } from 'firebase-functions/v2/scheduler';
export const SCREENSHOT_TTL_MS = 24 * 60 * 60 * 1000;

export interface ExpiredFile {
  name: string;
  timeCreated?: string;
  createdAt?: string;
  delete(): Promise<void>;
}

export async function removeExpiredScreenshots(
  files: ReadonlyArray<ExpiredFile>,
  now = new Date(),
) {
  const threshold = now.getTime() - SCREENSHOT_TTL_MS;
  let removed = 0;
  for (const file of files) {
    if (!file.name.startsWith('screenshots/')) continue;
    const createdAt = file.createdAt ?? file.timeCreated;
    if (!createdAt || Number.isNaN(Date.parse(createdAt)) || Date.parse(createdAt) >= threshold)
      continue;
    await file.delete();
    removed += 1;
  }
  return removed;
}

export const cleanupExpiredScreenshots = onSchedule('every 60 minutes', async () => {
  const { adminBucket } = await import('../services/firebase-admin');
  const [files] = await adminBucket().getFiles({ prefix: 'screenshots/' });
  const removed = await removeExpiredScreenshots(
    files.map((file) => ({
      name: file.name,
      timeCreated: file.metadata.timeCreated,
      createdAt:
        typeof file.metadata.metadata?.createdAt === 'string'
          ? file.metadata.metadata.createdAt
          : undefined,
      delete: async () => file.delete({ ignoreNotFound: true }).then(() => undefined),
    })),
  );
  console.log(`Limpeza de screenshots: ${removed} objeto(s) removido(s).`);
});
