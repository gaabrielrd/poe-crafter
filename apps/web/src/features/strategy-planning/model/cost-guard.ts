export const COST_GUARD_SCHEMA_VERSION = 1 as const;

export type CostGuardOperation = 'ocr' | 'planning';
export type CostGuardCode = 'allowed' | 'ocr-budget-near' | 'budget-exceeded';

export interface CostGuardResponse {
  schemaVersion: typeof COST_GUARD_SCHEMA_VERSION;
  operation: CostGuardOperation;
  requestId: string;
  allowed: boolean;
  code: CostGuardCode;
  estimatedCostUsd: number;
  budgetUsd: number;
  thresholdUsd: number;
  message: string;
}

function isOperation(value: unknown): value is CostGuardOperation {
  return value === 'ocr' || value === 'planning';
}

export function isCostGuardResponse(value: unknown): value is CostGuardResponse {
  if (typeof value !== 'object' || value === null) return false;
  const response = value as Partial<CostGuardResponse>;
  return (
    response.schemaVersion === COST_GUARD_SCHEMA_VERSION &&
    isOperation(response.operation) &&
    typeof response.requestId === 'string' &&
    response.requestId.length >= 8 &&
    typeof response.allowed === 'boolean' &&
    (response.code === 'allowed' ||
      response.code === 'ocr-budget-near' ||
      response.code === 'budget-exceeded') &&
    typeof response.estimatedCostUsd === 'number' &&
    typeof response.budgetUsd === 'number' &&
    typeof response.thresholdUsd === 'number' &&
    typeof response.message === 'string'
  );
}
