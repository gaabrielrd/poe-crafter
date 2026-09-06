import { onRequest } from 'firebase-functions/v2/https';
import { type DocumentSnapshot } from 'firebase-admin/firestore';
import { adminFirestore } from '../services/firebase-admin';
import { authenticateAdmin } from './admin-auth';
import {
  activateDataset,
  canActivateDataset,
  createDatasetAuditEvent,
  createImportedDatasetRecord,
  parseDatasetActionPayload,
  retireDataset,
  validateDatasetRecord,
  type AdminDatasetRecord,
  type DatasetAction,
} from '../model/dataset-lifecycle';

const DATASET_COLLECTION = 'ops/datasets';
const ACTIVE_DATASET_PATH = 'ops/activeDataset';
const AUDIT_COLLECTION = 'ops/auditEvents';

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function datasetRef(database: ReturnType<typeof adminFirestore>, version: string) {
  return database.collection(DATASET_COLLECTION).doc(version);
}

function recordFromSnapshot(snapshot: DocumentSnapshot): AdminDatasetRecord | null {
  if (!snapshot.exists) return null;
  const value = snapshot.data();
  return value ? (value as AdminDatasetRecord) : null;
}

function actionResponse(record: AdminDatasetRecord, action: DatasetAction, extra = {}) {
  return {
    action,
    version: record.version,
    status: record.status,
    ...extra,
  };
}

export const manageAdminDataset = onRequest(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.status(405).json({ code: 'method-not-allowed', message: 'Use POST.' });
    return;
  }

  const authorization = await authenticateAdmin(request);
  if (!authorization.ok) {
    response
      .status(authorization.status)
      .json({ code: authorization.code, message: authorization.message });
    return;
  }

  const payload = parseDatasetActionPayload(request.body);
  if (!payload) {
    response
      .status(400)
      .json({ code: 'invalid-dataset-action', message: 'Ação de dataset inválida.' });
    return;
  }

  const database = adminFirestore();
  const now = new Date();

  try {
    if (payload.action === 'import') {
      const result = await database.runTransaction(async (transaction) => {
        const reference = datasetRef(database, payload.version);
        const existing = recordFromSnapshot(await transaction.get(reference));
        if (existing) {
          if (canonicalJson(existing.dataset) !== canonicalJson(payload.dataset)) {
            transaction.create(
              database.collection(AUDIT_COLLECTION).doc(),
              createDatasetAuditEvent(
                authorization.uid,
                'import',
                payload.version,
                'rejected',
                now,
              ),
            );
            return { conflict: true as const };
          }
          transaction.create(
            database.collection(AUDIT_COLLECTION).doc(),
            createDatasetAuditEvent(authorization.uid, 'import', payload.version, 'accepted', now),
          );
          return { existing };
        }

        const record = createImportedDatasetRecord(payload.version, payload.dataset, now);
        transaction.create(reference, record);
        transaction.create(
          database.collection(AUDIT_COLLECTION).doc(),
          createDatasetAuditEvent(authorization.uid, 'import', payload.version, 'accepted', now),
        );
        return { record };
      });
      if ('conflict' in result) {
        response.status(409).json({
          code: 'dataset-version-conflict',
          message: 'A versão já existe com outro conteúdo.',
        });
        return;
      }
      if ('existing' in result) {
        response.status(200).json(actionResponse(result.existing!, 'import', { idempotent: true }));
        return;
      }
      response.status(201).json(actionResponse(result.record, 'import'));
      return;
    }

    if (payload.action === 'validate') {
      const result = await database.runTransaction(async (transaction) => {
        const reference = datasetRef(database, payload.version);
        const record = recordFromSnapshot(await transaction.get(reference));
        if (!record) return { missing: true as const };
        const validated = validateDatasetRecord(record, now);
        transaction.update(reference, validated.record);
        transaction.create(
          database.collection(AUDIT_COLLECTION).doc(),
          createDatasetAuditEvent(
            authorization.uid,
            'validate',
            payload.version,
            validated.issues.length === 0 ? 'accepted' : 'rejected',
            now,
            validated.issues.length,
          ),
        );
        return { record: validated.record, issues: validated.issues };
      });
      if ('missing' in result) {
        response
          .status(404)
          .json({ code: 'dataset-not-found', message: 'Dataset não encontrado.' });
        return;
      }
      const status = result.issues.length === 0 ? 200 : 422;
      response
        .status(status)
        .json(actionResponse(result.record, 'validate', { issues: result.issues }));
      return;
    }

    const result = await database.runTransaction(async (transaction) => {
      const targetReference = datasetRef(database, payload.version);
      const activeReference = database.doc(ACTIVE_DATASET_PATH);
      const target = recordFromSnapshot(await transaction.get(targetReference));
      const activeSnapshot = await transaction.get(activeReference);
      if (!target) return { missing: true as const };
      if (
        !canActivateDataset(target) ||
        (payload.action === 'publish' && target.status !== 'validated')
      ) {
        return { notReady: true as const, target };
      }

      const activeData = activeSnapshot.data() as unknown as { version?: unknown } | undefined;
      const activeVersion = activeData?.version;
      let previous: AdminDatasetRecord | null = null;
      let previousReference;
      if (typeof activeVersion === 'string' && activeVersion !== target.version) {
        previousReference = datasetRef(database, activeVersion);
        previous = recordFromSnapshot(await transaction.get(previousReference));
      }

      const activated = activateDataset(target, payload.action as 'publish' | 'reactivate', now);
      transaction.set(targetReference, activated);
      if (previous && previousReference)
        transaction.set(previousReference, retireDataset(previous, now));
      transaction.set(activeReference, {
        schemaVersion: 1,
        version: activated.version,
        status: 'active',
        source: 'admin-dataset',
        updatedAt: now.toISOString(),
        activatedAt: activated.activatedAt,
        gameDataVersion:
          typeof (activated.dataset as Record<string, unknown>)?.gameDataVersion === 'string'
            ? (activated.dataset as Record<string, string>).gameDataVersion
            : '',
        priceSnapshotId:
          typeof (activated.dataset as Record<string, unknown>)?.priceSnapshotId === 'string'
            ? (activated.dataset as Record<string, string>).priceSnapshotId
            : '',
      });
      transaction.create(
        database.collection(AUDIT_COLLECTION).doc(),
        createDatasetAuditEvent(
          authorization.uid,
          payload.action,
          payload.version,
          'accepted',
          now,
        ),
      );
      return { record: activated };
    });

    if ('missing' in result) {
      response.status(404).json({ code: 'dataset-not-found', message: 'Dataset não encontrado.' });
      return;
    }
    if ('notReady' in result) {
      response.status(409).json({
        code: 'dataset-not-ready',
        message: 'Dataset precisa estar validado antes de ser ativado.',
      });
      return;
    }
    response.status(200).json(actionResponse(result.record, payload.action));
  } catch {
    response.status(503).json({
      code: 'dataset-operation-unavailable',
      message: 'Não foi possível concluir a operação do dataset.',
    });
  }
});
