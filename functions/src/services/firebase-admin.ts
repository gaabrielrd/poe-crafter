import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

function ensureAdminApp() {
  return getApps()[0] ?? initializeApp();
}

export function adminAuth() {
  return getAuth(ensureAdminApp());
}

export function adminFirestore() {
  return getFirestore(ensureAdminApp());
}

export function adminBucket(): ReturnType<ReturnType<typeof getStorage>['bucket']> {
  return getStorage(ensureAdminApp()).bucket();
}

export function storagePathForUid(storagePath: string, uid: string) {
  return new RegExp(`^screenshots/${uid}/[A-Za-z0-9_-]{12,64}$`).test(storagePath);
}
