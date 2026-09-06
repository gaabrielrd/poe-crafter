import { adminFirestore } from './firebase-admin';
import {
  emptyOperationalUsage,
  readCostProtectionConfig,
  reserveOperationalCost,
  type CostGuardResponse,
  type CostOperation,
} from '../model/cost-protection';

export interface OperationalBudget {
  reserve(operation: CostOperation, requestId: string, now?: Date): Promise<CostGuardResponse>;
}

function monthFor(now: Date) {
  return now.toISOString().slice(0, 7);
}

export class FirestoreOperationalBudget implements OperationalBudget {
  async reserve(operation: CostOperation, requestId: string, now = new Date()) {
    const month = monthFor(now);
    const database = adminFirestore();
    const reference = database.doc(`ops/operationalUsage-${month}`);
    const config = readCostProtectionConfig(process.env);
    return database.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      const stored = snapshot.data();
      const current = emptyOperationalUsage(month, now);
      if (stored?.schemaVersion === current.schemaVersion) {
        current.estimatedCostUsd =
          typeof stored.estimatedCostUsd === 'number' ? stored.estimatedCostUsd : 0;
        const storedCounts = stored.counts as Record<string, unknown> | undefined;
        current.counts = {
          ocr: typeof storedCounts?.ocr === 'number' ? storedCounts.ocr : 0,
          planning: typeof storedCounts?.planning === 'number' ? storedCounts.planning : 0,
        };
        current.requestIds = Array.isArray(stored.requestIds)
          ? stored.requestIds.filter((value): value is string => typeof value === 'string')
          : [];
        current.updatedAt =
          typeof stored.updatedAt === 'string' ? stored.updatedAt : now.toISOString();
      }
      const result = reserveOperationalCost(current, operation, requestId, config, now);
      if (result.usage !== current) transaction.set(reference, result.usage, { merge: true });
      return result.response;
    });
  }
}
