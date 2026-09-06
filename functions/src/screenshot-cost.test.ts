/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/require-await */
import assert from 'node:assert/strict';
import test from 'node:test';
import { processScreenshotRequest } from './api/screenshot-ocr.ts';

test('bloqueia OCR antes do provider quando a proteção de custo nega a reserva', async () => {
  let visionCalled = false;
  let removed = false;
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  await assert.rejects(
    processScreenshotRequest(
      {
        uid: 'user-1',
        storagePath: 'screenshots/user-1/request-123456',
        requestId: 'request-123456',
      },
      {
        store: {
          get: async () => ({
            contentType: 'image/png',
            size: png.length,
            createdAt: new Date().toISOString(),
            download: async () => png,
            remove: async () => {
              removed = true;
            },
          }),
          list: async () => [],
        },
        vision: {
          extractText: async () => {
            visionCalled = true;
            return 'never';
          },
        },
        quota: { reserve: async () => true },
        costBudget: {
          reserve: async () => ({
            schemaVersion: 1 as const,
            operation: 'ocr' as const,
            requestId: 'request-123456',
            allowed: false,
            code: 'ocr-budget-near' as const,
            estimatedCostUsd: 8,
            budgetUsd: 10,
            thresholdUsd: 8,
            message: 'OCR pausado.',
          }),
        },
        now: () => new Date('2026-09-06T12:00:00.000Z'),
      },
    ),
    (error: unknown) =>
      error instanceof Error && 'code' in error && error.code === 'cost-protection',
  );
  assert.equal(visionCalled, false);
  assert.equal(removed, true);
});
