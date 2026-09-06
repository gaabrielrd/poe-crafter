import { FieldValue } from 'firebase-admin/firestore';
import { adminFirestore } from './firebase-admin';

export const MAX_MONTHLY_OCR = 1_000;

export interface OcrQuota {
  reserve(month: string, requestId: string): Promise<boolean>;
}

export class FirestoreOcrQuota implements OcrQuota {
  async reserve(month: string, requestId: string) {
    const reference = adminFirestore().doc(`ops/ocrQuota-${month}`);
    return adminFirestore().runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      const data = snapshot.data() ?? {};
      const requests = Array.isArray(data.requests) ? (data.requests as string[]) : [];
      if (requests.includes(requestId)) return true;
      const count = typeof data.count === 'number' ? data.count : 0;
      if (count >= MAX_MONTHLY_OCR) return false;
      transaction.set(
        reference,
        { count: FieldValue.increment(1), requests: [...requests, requestId], month },
        { merge: true },
      );
      return true;
    });
  }
}
