export const COST_PROTECTION_SCHEMA_VERSION = 1 as const;
export const COST_OPERATIONS = ['ocr', 'planning'] as const;
export type CostOperation = (typeof COST_OPERATIONS)[number];

export const DEFAULT_MONTHLY_BUDGET_USD = 10;
export const DEFAULT_OCR_COST_USD = 0.01;
export const DEFAULT_PLANNING_COST_USD = 0.1;
export const OCR_BLOCK_RATIO = 0.8;

export type CostGuardCode = 'allowed' | 'ocr-budget-near' | 'budget-exceeded';

export interface CostProtectionConfig {
  monthlyBudgetUsd: number;
  ocrCostUsd: number;
  planningCostUsd: number;
}

export interface OperationalUsage {
  schemaVersion: typeof COST_PROTECTION_SCHEMA_VERSION;
  month: string;
  estimatedCostUsd: number;
  counts: Record<CostOperation, number>;
  requestIds: string[];
  updatedAt: string;
}

export interface CostGuardResponse {
  schemaVersion: typeof COST_PROTECTION_SCHEMA_VERSION;
  operation: CostOperation;
  requestId: string;
  allowed: boolean;
  code: CostGuardCode;
  estimatedCostUsd: number;
  budgetUsd: number;
  thresholdUsd: number;
  message: string;
}

export interface CostReservationResult {
  usage: OperationalUsage;
  response: CostGuardResponse;
}

function positiveNumber(value: unknown, fallback: number) {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function readCostProtectionConfig(environment: NodeJS.ProcessEnv): CostProtectionConfig {
  return {
    monthlyBudgetUsd: positiveNumber(
      environment.POE_MONTHLY_BUDGET_USD,
      DEFAULT_MONTHLY_BUDGET_USD,
    ),
    ocrCostUsd: positiveNumber(environment.POE_OCR_COST_USD, DEFAULT_OCR_COST_USD),
    planningCostUsd: positiveNumber(environment.POE_PLANNING_COST_USD, DEFAULT_PLANNING_COST_USD),
  };
}

export function isCostOperation(value: unknown): value is CostOperation {
  return COST_OPERATIONS.includes(value as CostOperation);
}

export function isRequestId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{8,128}$/.test(value);
}

export function emptyOperationalUsage(month: string, now = new Date()): OperationalUsage {
  return {
    schemaVersion: COST_PROTECTION_SCHEMA_VERSION,
    month,
    estimatedCostUsd: 0,
    counts: { ocr: 0, planning: 0 },
    requestIds: [],
    updatedAt: now.toISOString(),
  };
}

function operationCost(config: CostProtectionConfig, operation: CostOperation) {
  return operation === 'ocr' ? config.ocrCostUsd : config.planningCostUsd;
}

function thresholdFor(config: CostProtectionConfig, operation: CostOperation) {
  return operation === 'ocr' ? config.monthlyBudgetUsd * OCR_BLOCK_RATIO : config.monthlyBudgetUsd;
}

function messageFor(operation: CostOperation, code: CostGuardCode, thresholdUsd: number) {
  if (code === 'ocr-budget-near') {
    return `Novos OCRs estão pausados ao atingir US$${thresholdUsd.toFixed(2)}; importe o texto manualmente.`;
  }
  if (code === 'budget-exceeded') {
    return `Novos jobs de ${operation === 'planning' ? 'planejamento' : 'OCR'} estão pausados até o próximo ciclo mensal.`;
  }
  return 'Operação autorizada dentro do orçamento operacional.';
}

export function reserveOperationalCost(
  input: OperationalUsage,
  operation: CostOperation,
  requestId: string,
  config: CostProtectionConfig,
  now = new Date(),
): CostReservationResult {
  const reservedKey = `${operation}:${requestId}`;
  const thresholdUsd = thresholdFor(config, operation);
  if (input.requestIds.includes(reservedKey)) {
    const response: CostGuardResponse = {
      schemaVersion: COST_PROTECTION_SCHEMA_VERSION,
      operation,
      requestId,
      allowed: true,
      code: 'allowed',
      estimatedCostUsd: input.estimatedCostUsd,
      budgetUsd: config.monthlyBudgetUsd,
      thresholdUsd,
      message: messageFor(operation, 'allowed', thresholdUsd),
    };
    return { usage: input, response };
  }

  const projectedCost = Number(
    (input.estimatedCostUsd + operationCost(config, operation)).toFixed(4),
  );
  const blocked = projectedCost >= thresholdUsd;
  const code: CostGuardCode = blocked
    ? operation === 'ocr' && projectedCost < config.monthlyBudgetUsd
      ? 'ocr-budget-near'
      : 'budget-exceeded'
    : 'allowed';
  if (blocked) {
    return {
      usage: input,
      response: {
        schemaVersion: COST_PROTECTION_SCHEMA_VERSION,
        operation,
        requestId,
        allowed: false,
        code,
        estimatedCostUsd: input.estimatedCostUsd,
        budgetUsd: config.monthlyBudgetUsd,
        thresholdUsd,
        message: messageFor(operation, code, thresholdUsd),
      },
    };
  }

  const usage: OperationalUsage = {
    ...input,
    estimatedCostUsd: projectedCost,
    counts: { ...input.counts, [operation]: input.counts[operation] + 1 },
    requestIds: [...input.requestIds, reservedKey],
    updatedAt: now.toISOString(),
  };
  return {
    usage,
    response: {
      schemaVersion: COST_PROTECTION_SCHEMA_VERSION,
      operation,
      requestId,
      allowed: true,
      code: 'allowed',
      estimatedCostUsd: projectedCost,
      budgetUsd: config.monthlyBudgetUsd,
      thresholdUsd,
      message: messageFor(operation, 'allowed', thresholdUsd),
    },
  };
}

export function parseCostGuardPayload(
  value: unknown,
): { operation: CostOperation; requestId: string } | null {
  if (typeof value !== 'object' || value === null) return null;
  const candidate = value as { operation?: unknown; requestId?: unknown };
  if (!isCostOperation(candidate.operation) || !isRequestId(candidate.requestId)) return null;
  return { operation: candidate.operation, requestId: candidate.requestId };
}

export function isCostGuardResponse(value: unknown): value is CostGuardResponse {
  if (typeof value !== 'object' || value === null) return false;
  const response = value as Partial<CostGuardResponse>;
  return (
    response.schemaVersion === COST_PROTECTION_SCHEMA_VERSION &&
    isCostOperation(response.operation) &&
    isRequestId(response.requestId) &&
    typeof response.allowed === 'boolean' &&
    typeof response.estimatedCostUsd === 'number' &&
    typeof response.budgetUsd === 'number' &&
    typeof response.thresholdUsd === 'number' &&
    typeof response.message === 'string'
  );
}
