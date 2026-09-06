import type { NormalizedItemTarget } from '@poe-crafter/shared-types';

export const PLANNER_SCHEMA_VERSION = 1 as const;
export const PLANNER_ENGINE_VERSION = '0.1.0';
export const MAX_STRATEGIES = 4;
export const PLANNER_JOB_TIMEOUT_MS = 5 * 60 * 1000;

export const PLANNER_PHASES = [
  'queued',
  'validating',
  'searching',
  'simulating',
  'succeeded',
  'failed',
] as const;
export type PlannerPhase = (typeof PLANNER_PHASES)[number];

export type PlannerObjective = 'recommended' | 'cheapest' | 'safest' | 'premium';

export interface PlannerPlanningRequest {
  schemaVersion: 1;
  objective: PlannerObjective;
  excludedMechanics: string[];
  priceOverrides: Array<{ resource: string; chaos: number }>;
}

export interface PlannerTarget {
  item: NormalizedItemTarget;
  classifications: Record<string, string>;
}

export interface PlannerStepDefinition {
  id: string;
  operationId: string;
  label: string;
  mechanic: string;
  resource: string;
  costChaos: number;
  successProbability: number;
  expectedAttempts: number;
  validation: 'accepted';
  retry: string;
  restart: string;
  expectedState: string;
  skippable: boolean;
}

export interface PlannerRecipe {
  id: string;
  label: string;
  mechanics: string[];
  requiredAffixCodes: string[];
  minItemLevel: number;
  steps: PlannerStepDefinition[];
}

export interface PlannerDataset {
  schemaVersion: 1;
  gameDataVersion: string;
  priceSnapshotId: string;
  recipes: PlannerRecipe[];
}

export interface PlannerCraftability {
  status: 'accepted' | 'rejected' | 'unsupported';
}

export interface PlannerInput {
  request: PlannerPlanningRequest;
  target: PlannerTarget;
  craftability: PlannerCraftability;
  dataset: PlannerDataset;
}

export type PlannerIssueCode =
  'craftability_not_accepted' | 'invalid_dataset' | 'no_valid_strategy' | 'job-timeout';

export interface PlannerIssue {
  code: PlannerIssueCode;
  message: string;
}

export interface PlannerStrategyStep extends PlannerStepDefinition {
  effectiveCostChaos: number;
}

export interface PlannerStrategy {
  id: string;
  recipeId: string;
  label: string;
  objective: PlannerObjective;
  gameDataVersion: string;
  priceSnapshotId: string;
  steps: PlannerStrategyStep[];
  expectedCostChaos: number;
  p90CostChaos: number;
  expectedAttempts: number;
  successProbability: number;
  riskScore: number;
  signature: string;
  target: {
    baseName: string;
    itemLevel: number;
    influences: string[];
  };
}

export interface PlannerResult {
  schemaVersion: typeof PLANNER_SCHEMA_VERSION;
  plannerVersion: typeof PLANNER_ENGINE_VERSION;
  phase: 'succeeded' | 'failed';
  strategies: PlannerStrategy[];
  omitted: {
    equivalent: number;
    ineligible: number;
  };
  issues: PlannerIssue[];
}

export const PLANNER_PLAN_VERSION_SCHEMA_VERSION = 1 as const;

export interface PlannerPlanVersion {
  schemaVersion: typeof PLANNER_PLAN_VERSION_SCHEMA_VERSION;
  id: string;
  number: number;
  createdAt: string;
  request: PlannerPlanningRequest;
  gameDataVersion: string;
  priceSnapshotId: string;
  result: PlannerResult;
}

export interface PlannerPlanVersionMetadata {
  id: string;
  number: number;
  createdAt: string;
}

function clonePlannerResult(result: PlannerResult): PlannerResult {
  return {
    ...result,
    strategies: result.strategies.map((strategy) => ({
      ...strategy,
      steps: strategy.steps.map((step) => ({ ...step })),
      target: {
        ...strategy.target,
        influences: [...strategy.target.influences],
      },
    })),
    omitted: { ...result.omitted },
    issues: result.issues.map((issue) => ({ ...issue })),
  };
}

export function createPlannerPlanVersion(
  result: PlannerResult,
  request: PlannerPlanningRequest,
  metadata: PlannerPlanVersionMetadata,
): PlannerPlanVersion {
  if (result.phase !== 'succeeded' || result.strategies.length === 0) {
    throw new Error('Somente um resultado bem-sucedido pode virar uma versão de plano.');
  }
  if (!metadata.id.trim() || metadata.number < 1 || !Number.isInteger(metadata.number)) {
    throw new Error('A versão do plano precisa de identificador e número válidos.');
  }
  if (Number.isNaN(Date.parse(metadata.createdAt))) {
    throw new Error('A versão do plano precisa de um timestamp válido.');
  }
  const firstStrategy = result.strategies[0]!;
  return {
    schemaVersion: PLANNER_PLAN_VERSION_SCHEMA_VERSION,
    id: metadata.id,
    number: metadata.number,
    createdAt: metadata.createdAt,
    request: {
      ...request,
      excludedMechanics: [...request.excludedMechanics],
      priceOverrides: request.priceOverrides.map((override) => ({ ...override })),
    },
    gameDataVersion: firstStrategy.gameDataVersion,
    priceSnapshotId: firstStrategy.priceSnapshotId,
    result: clonePlannerResult(result),
  };
}

export interface PlannerJobUpdate {
  phase: PlannerPhase;
  result?: PlannerResult;
}

export interface PlannerJobOptions {
  onUpdate?: (update: PlannerJobUpdate) => void;
  timeoutMs?: number;
  now?: () => number;
}

export interface StarterPlannerDataset extends PlannerDataset {
  source: 'starter-fixture';
}

export const STARTER_PLANNER_DATASET: StarterPlannerDataset = {
  schemaVersion: 1,
  source: 'starter-fixture',
  gameDataVersion: 'starter-0.1.0',
  priceSnapshotId: 'starter-manual-2026-09-06',
  recipes: [
    {
      id: 'bench-life',
      label: 'Bancada de vida',
      mechanics: ['bench'],
      requiredAffixCodes: ['IncreasedLife9'],
      minItemLevel: 1,
      steps: [
        {
          id: 'bench-life-step',
          operationId: 'bench-life',
          label: 'Aplicar Increased Life na bancada',
          mechanic: 'bench',
          resource: 'Bench craft: Increased Life',
          costChaos: 4,
          successProbability: 1,
          expectedAttempts: 1,
          validation: 'accepted',
          retry: 'Não há retry: a operação é determinística.',
          restart: 'Não há restart nesta receita.',
          expectedState: 'O alvo recebe o modificador de vida da receita.',
          skippable: false,
        },
      ],
    },
    {
      id: 'essence-life',
      label: 'Essência de vida',
      mechanics: ['essence'],
      requiredAffixCodes: ['IncreasedLife9'],
      minItemLevel: 1,
      steps: [
        {
          id: 'essence-life-step',
          operationId: 'essence-life',
          label: 'Rolar Essência de Vida',
          mechanic: 'essence',
          resource: 'Essence of Greed',
          costChaos: 8,
          successProbability: 0.35,
          expectedAttempts: 2.8571428571,
          validation: 'accepted',
          retry: 'Repetir a essência até atingir o alvo.',
          restart: 'Recomeçar na base atual após consumir a tentativa.',
          expectedState: 'A base mantém a melhor rolagem obtida até atingir o alvo.',
          skippable: false,
        },
      ],
    },
    {
      id: 'fossil-life',
      label: 'Fóssil de vida',
      mechanics: ['fossil'],
      requiredAffixCodes: ['IncreasedLife9'],
      minItemLevel: 1,
      steps: [
        {
          id: 'fossil-life-step',
          operationId: 'fossil-life',
          label: 'Rolar combinação de fósseis de vida',
          mechanic: 'fossil',
          resource: 'Pristine Fossil',
          costChaos: 12,
          successProbability: 0.5,
          expectedAttempts: 2,
          validation: 'accepted',
          retry: 'Repetir o ressonador até atingir o alvo.',
          restart: 'Recomeçar com outro ressonador.',
          expectedState: 'O ressonador produz uma nova combinação de afixos na base.',
          skippable: false,
        },
      ],
    },
    {
      id: 'bench-lightning',
      label: 'Bancada de resistência elétrica',
      mechanics: ['bench'],
      requiredAffixCodes: ['LightningResist8'],
      minItemLevel: 1,
      steps: [
        {
          id: 'bench-lightning-step',
          operationId: 'bench-lightning',
          label: 'Aplicar Lightning Resistance na bancada',
          mechanic: 'bench',
          resource: 'Bench craft: Lightning Resistance',
          costChaos: 4,
          successProbability: 1,
          expectedAttempts: 1,
          validation: 'accepted',
          retry: 'Não há retry: a operação é determinística.',
          restart: 'Não há restart nesta receita.',
          expectedState: 'O alvo recebe a resistência elétrica da receita.',
          skippable: false,
        },
      ],
    },
    {
      id: 'harvest-life-lightning',
      label: 'Harvest de vida e resistência',
      mechanics: ['harvest'],
      requiredAffixCodes: ['IncreasedLife9', 'LightningResist8'],
      minItemLevel: 1,
      steps: [
        {
          id: 'harvest-life-lightning-step',
          operationId: 'harvest-life-lightning',
          label: 'Reforjar com Harvest priorizando vida e resistência',
          mechanic: 'harvest',
          resource: 'Harvest reforge',
          costChaos: 18,
          successProbability: 0.25,
          expectedAttempts: 4,
          validation: 'accepted',
          retry: 'Repetir o reforjamento até atingir os dois afixos.',
          restart: 'Recomeçar após consumir a tentativa sem os afixos.',
          expectedState:
            'O item mantém os afixos que já atendem ao alvo e tenta completar os demais.',
          skippable: false,
        },
      ],
    },
  ],
};

function isFiniteNonNegative(value: number) {
  return Number.isFinite(value) && value >= 0;
}

function isValidStep(step: PlannerStepDefinition) {
  return (
    Boolean(step.id && step.operationId && step.label && step.mechanic && step.resource) &&
    isFiniteNonNegative(step.costChaos) &&
    Number.isFinite(step.successProbability) &&
    step.successProbability > 0 &&
    step.successProbability <= 1 &&
    Number.isFinite(step.expectedAttempts) &&
    step.expectedAttempts > 0 &&
    step.validation === 'accepted'
  );
}

export interface PlannerDatasetIssue {
  path: string;
  code: 'invalid-schema' | 'missing-field' | 'invalid-value';
  message: string;
}

export interface PlannerDatasetValidation {
  valid: boolean;
  issues: PlannerDatasetIssue[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function textField(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0;
}

function addMissingIssue(issues: PlannerDatasetIssue[], path: string, label: string) {
  issues.push({ path, code: 'missing-field', message: `${label} é obrigatório.` });
}

export function validatePlannerDataset(value: unknown): PlannerDatasetValidation {
  const issues: PlannerDatasetIssue[] = [];
  if (!isRecord(value)) {
    return {
      valid: false,
      issues: [{ path: '', code: 'invalid-schema', message: 'Dataset deve ser um objeto JSON.' }],
    };
  }
  if (value.schemaVersion !== 1) {
    issues.push({
      path: 'schemaVersion',
      code: 'invalid-value',
      message: 'schemaVersion deve ser 1.',
    });
  }
  if (!textField(value.gameDataVersion))
    addMissingIssue(issues, 'gameDataVersion', 'gameDataVersion');
  if (!textField(value.priceSnapshotId))
    addMissingIssue(issues, 'priceSnapshotId', 'priceSnapshotId');
  if (!Array.isArray(value.recipes) || value.recipes.length === 0) {
    issues.push({
      path: 'recipes',
      code: 'invalid-value',
      message: 'recipes deve conter pelo menos uma receita.',
    });
  } else {
    value.recipes.forEach((rawRecipe, recipeIndex) => {
      const path = `recipes[${recipeIndex}]`;
      if (!isRecord(rawRecipe)) {
        issues.push({ path, code: 'invalid-schema', message: 'Receita deve ser um objeto.' });
        return;
      }
      for (const [field, label] of [
        ['id', 'id da receita'],
        ['label', 'label da receita'],
      ] as const) {
        if (!textField(rawRecipe[field])) addMissingIssue(issues, `${path}.${field}`, label);
      }
      if (
        !Array.isArray(rawRecipe.mechanics) ||
        !rawRecipe.mechanics.every((mechanic) => textField(mechanic))
      ) {
        issues.push({
          path: `${path}.mechanics`,
          code: 'invalid-value',
          message: 'mechanics deve conter textos não vazios.',
        });
      }
      if (
        !Array.isArray(rawRecipe.requiredAffixCodes) ||
        !rawRecipe.requiredAffixCodes.every((code) => textField(code))
      ) {
        issues.push({
          path: `${path}.requiredAffixCodes`,
          code: 'invalid-value',
          message: 'requiredAffixCodes deve conter textos não vazios.',
        });
      }
      if (!Number.isInteger(rawRecipe.minItemLevel) || (rawRecipe.minItemLevel as number) < 1) {
        issues.push({
          path: `${path}.minItemLevel`,
          code: 'invalid-value',
          message: 'minItemLevel deve ser um inteiro positivo.',
        });
      }
      if (!Array.isArray(rawRecipe.steps) || rawRecipe.steps.length === 0) {
        issues.push({
          path: `${path}.steps`,
          code: 'invalid-value',
          message: 'steps deve conter pelo menos uma transição.',
        });
      } else {
        rawRecipe.steps.forEach((rawStep, stepIndex) => {
          const stepPath = `${path}.steps[${stepIndex}]`;
          if (!isRecord(rawStep) || !isValidStep(rawStep as unknown as PlannerStepDefinition)) {
            issues.push({
              path: stepPath,
              code: 'invalid-value',
              message: 'Step contém campos ou valores inválidos.',
            });
          }
        });
      }
    });
  }
  return { valid: issues.length === 0, issues };
}

function hasRequiredAffixes(target: PlannerTarget, codes: string[]) {
  const available = new Set<string>();
  for (const [index, affix] of [...target.item.prefixes, ...target.item.suffixes].entries()) {
    const source = index < target.item.prefixes.length ? 'prefix' : 'suffix';
    const sourceIndex = source === 'prefix' ? index : index - target.item.prefixes.length;
    if (target.classifications[`${source}-${sourceIndex}`] === 'required' && affix.code) {
      available.add(affix.code);
    }
  }
  return codes.every((code) => available.has(code));
}

function overrideCost(request: PlannerPlanningRequest, resource: string, fallback: number) {
  const override = request.priceOverrides.find(
    (entry) => entry.resource.trim().toLowerCase() === resource.trim().toLowerCase(),
  );
  return override?.chaos ?? fallback;
}

function compareNumber(left: number, right: number) {
  return left - right;
}

function compareStrategies(
  objective: PlannerObjective,
  left: PlannerStrategy,
  right: PlannerStrategy,
) {
  if (objective === 'cheapest') {
    return (
      compareNumber(left.expectedCostChaos, right.expectedCostChaos) ||
      compareNumber(left.riskScore, right.riskScore) ||
      left.id.localeCompare(right.id)
    );
  }
  if (objective === 'safest') {
    return (
      compareNumber(left.riskScore, right.riskScore) ||
      compareNumber(left.p90CostChaos, right.p90CostChaos) ||
      left.id.localeCompare(right.id)
    );
  }
  if (objective === 'premium') {
    return (
      compareNumber(left.p90CostChaos, right.p90CostChaos) ||
      compareNumber(left.expectedCostChaos, right.expectedCostChaos) ||
      left.id.localeCompare(right.id)
    );
  }
  const leftScore = left.expectedCostChaos + left.p90CostChaos * 0.25 + left.riskScore * 10;
  const rightScore = right.expectedCostChaos + right.p90CostChaos * 0.25 + right.riskScore * 10;
  return compareNumber(leftScore, rightScore) || left.id.localeCompare(right.id);
}

function createStrategy(
  recipe: PlannerRecipe,
  request: PlannerPlanningRequest,
  target: PlannerTarget,
  dataset: PlannerDataset,
): PlannerStrategy {
  const steps = recipe.steps.map((step) => {
    const effectiveCostChaos = overrideCost(request, step.resource, step.costChaos);
    return { ...step, effectiveCostChaos };
  });
  const expectedCostChaos = steps.reduce(
    (total, step) => total + step.effectiveCostChaos * step.expectedAttempts,
    0,
  );
  const p90CostChaos = steps.reduce(
    (total, step) =>
      total +
      step.effectiveCostChaos *
        (step.expectedAttempts + 1.645 * Math.sqrt(Math.max(step.expectedAttempts - 1, 0))),
    0,
  );
  const successProbability = steps.reduce((total, step) => total * step.successProbability, 1);
  const expectedAttempts = steps.reduce((total, step) => total + step.expectedAttempts, 0);
  const riskScore = Math.min(
    100,
    steps.reduce((total, step) => total + (1 - step.successProbability) * 100, 0),
  );
  return {
    id: `strategy-${recipe.id}`,
    recipeId: recipe.id,
    label: recipe.label,
    objective: request.objective,
    gameDataVersion: dataset.gameDataVersion,
    priceSnapshotId: dataset.priceSnapshotId,
    steps,
    expectedCostChaos,
    p90CostChaos,
    expectedAttempts,
    successProbability,
    riskScore,
    signature: steps.map((step) => step.operationId).join('>'),
    target: {
      baseName: target.item.baseName,
      itemLevel: target.item.itemLevel ?? 0,
      influences: [...target.item.influences],
    },
  };
}

export function generateStrategies(input: PlannerInput): PlannerResult {
  const fail = (issue: PlannerIssue): PlannerResult => ({
    schemaVersion: PLANNER_SCHEMA_VERSION,
    plannerVersion: PLANNER_ENGINE_VERSION,
    phase: 'failed',
    strategies: [],
    omitted: { equivalent: 0, ineligible: 0 },
    issues: [issue],
  });

  if (input.craftability.status !== 'accepted') {
    return fail({
      code: 'craftability_not_accepted',
      message: 'Somente alvos aceitos pelo crafting-engine podem gerar estratégias.',
    });
  }
  if (
    input.dataset.schemaVersion !== 1 ||
    !input.dataset.gameDataVersion ||
    !input.dataset.priceSnapshotId
  ) {
    return fail({
      code: 'invalid_dataset',
      message: 'O dataset de planejamento não possui versões de dados e preços válidas.',
    });
  }

  const excluded = new Set(input.request.excludedMechanics);
  let ineligible = 0;
  let equivalent = 0;
  const seen = new Set<string>();
  const strategies: PlannerStrategy[] = [];
  for (const recipe of input.dataset.recipes) {
    const eligible =
      recipe.minItemLevel <= (input.target.item.itemLevel ?? 0) &&
      recipe.mechanics.every((mechanic) => !excluded.has(mechanic)) &&
      hasRequiredAffixes(input.target, recipe.requiredAffixCodes) &&
      recipe.steps.length > 0 &&
      recipe.steps.every(isValidStep);
    if (!eligible) {
      ineligible += 1;
      continue;
    }
    const strategy = createStrategy(recipe, input.request, input.target, input.dataset);
    if (seen.has(strategy.signature)) {
      equivalent += 1;
      continue;
    }
    seen.add(strategy.signature);
    strategies.push(strategy);
  }

  strategies.sort((left, right) => compareStrategies(input.request.objective, left, right));
  if (strategies.length === 0) {
    return {
      ...fail({
        code: 'no_valid_strategy',
        message: 'Nenhum caminho completo e validado foi encontrado para este alvo.',
      }),
      omitted: { equivalent, ineligible },
    };
  }
  return {
    schemaVersion: PLANNER_SCHEMA_VERSION,
    plannerVersion: PLANNER_ENGINE_VERSION,
    phase: 'succeeded',
    strategies: strategies.slice(0, MAX_STRATEGIES),
    omitted: {
      equivalent: equivalent + Math.max(0, strategies.length - MAX_STRATEGIES),
      ineligible,
    },
    issues: [],
  };
}

export async function runPlannerJob(
  input: PlannerInput,
  options: PlannerJobOptions = {},
): Promise<PlannerResult> {
  const startedAt = (options.now ?? Date.now)();
  const timeoutMs = options.timeoutMs ?? PLANNER_JOB_TIMEOUT_MS;
  const publish = (phase: PlannerPhase, result?: PlannerResult) =>
    options.onUpdate?.({ phase, result });
  const timeoutResult = (): PlannerResult => ({
    schemaVersion: PLANNER_SCHEMA_VERSION,
    plannerVersion: PLANNER_ENGINE_VERSION,
    phase: 'failed',
    strategies: [],
    omitted: { equivalent: 0, ineligible: 0 },
    issues: [
      {
        code: 'job-timeout',
        message: 'O job ultrapassou cinco minutos e foi encerrado. Tente novamente.',
      },
    ],
  });
  const timedOut = () => (options.now ?? Date.now)() - startedAt >= timeoutMs;
  const failIfTimedOut = () => {
    if (!timedOut()) return false;
    const result = timeoutResult();
    publish('failed', result);
    return result;
  };
  publish('queued');
  await Promise.resolve();
  const queuedTimeout = failIfTimedOut();
  if (queuedTimeout) return queuedTimeout;
  publish('validating');
  await Promise.resolve();
  const validatingTimeout = failIfTimedOut();
  if (validatingTimeout) return validatingTimeout;
  publish('searching');
  await Promise.resolve();
  const searchingTimeout = failIfTimedOut();
  if (searchingTimeout) return searchingTimeout;
  publish('simulating');
  await Promise.resolve();
  const simulatingTimeout = failIfTimedOut();
  if (simulatingTimeout) return simulatingTimeout;
  const result = generateStrategies(input);
  publish(result.phase, result);
  return result;
}

export {
  appendExecutionEvent,
  createExecutionState,
  summarizeExecution,
  EXECUTION_OUTCOMES,
  EXECUTION_SCHEMA_VERSION,
} from './execution.ts';
export type {
  ExecutionEvent,
  ExecutionIssue,
  ExecutionIssueCode,
  ExecutionOutcome,
  ExecutionResourceInput,
  ExecutionState,
  ExecutionSummary,
  ExecutionSummaryStep,
} from './execution.ts';
