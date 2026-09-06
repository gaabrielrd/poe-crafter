import type { PlannerStrategy } from './index.ts';

export const EXECUTION_SCHEMA_VERSION = 1 as const;
export const EXECUTION_OUTCOMES = ['success', 'retry', 'restart', 'skipped'] as const;
export type ExecutionOutcome = (typeof EXECUTION_OUTCOMES)[number];

export interface ExecutionResourceInput {
  resource: string;
  chaos: number | null;
}

export interface ExecutionEvent {
  id: string;
  sequence: number;
  stepId: string;
  outcome: ExecutionOutcome;
  resources: ExecutionResourceInput[];
  totalCostChaos: number | null;
  recordedAt: string;
}

export interface ExecutionState {
  schemaVersion: typeof EXECUTION_SCHEMA_VERSION;
  strategyId: string;
  planVersionId: string;
  currentStepIndex: number;
  status: 'active' | 'completed';
  events: ExecutionEvent[];
  totalCostChaos: number;
  hasUnavailableCost: boolean;
}

export interface ExecutionSummaryStep {
  stepId: string;
  label: string;
  attempts: number;
}

export interface ExecutionSummary {
  schemaVersion: typeof EXECUTION_SCHEMA_VERSION;
  strategyId: string;
  planVersionId: string;
  expectedCostChaos: number;
  realCostChaos: number | null;
  knownRealCostChaos: number;
  differenceChaos: number | null;
  hasUnavailableCost: boolean;
  attemptsByStep: ExecutionSummaryStep[];
  path: ExecutionEvent[];
}

export type ExecutionIssueCode =
  'execution_complete' | 'invalid_step' | 'invalid_resource' | 'outcome_not_allowed';

export interface ExecutionIssue {
  code: ExecutionIssueCode;
  field: string;
  message: string;
}

export function createExecutionState(
  strategy: Pick<PlannerStrategy, 'id' | 'steps'>,
  planVersionId = strategy.id,
): ExecutionState {
  return {
    schemaVersion: EXECUTION_SCHEMA_VERSION,
    strategyId: strategy.id,
    planVersionId,
    currentStepIndex: 0,
    status: 'active',
    events: [],
    totalCostChaos: 0,
    hasUnavailableCost: false,
  };
}

export function appendExecutionEvent(
  state: ExecutionState,
  strategy: Pick<PlannerStrategy, 'id' | 'steps'>,
  input: {
    outcome: ExecutionOutcome;
    resources: ExecutionResourceInput[];
    recordedAt: string;
  },
): { state: ExecutionState; event: ExecutionEvent } | { issues: ExecutionIssue[] } {
  if (state.status === 'completed') {
    return {
      issues: [
        {
          code: 'execution_complete',
          field: 'outcome',
          message: 'Esta execução já foi concluída e não aceita novos eventos.',
        },
      ],
    };
  }
  const step = strategy.steps[state.currentStepIndex];
  if (!step || strategy.id !== state.strategyId) {
    return {
      issues: [
        {
          code: 'invalid_step',
          field: 'currentStepIndex',
          message: 'O passo atual não pertence à estratégia em execução.',
        },
      ],
    };
  }
  const issues: ExecutionIssue[] = [];
  if (input.outcome === 'skipped' && !step.skippable) {
    issues.push({
      code: 'outcome_not_allowed',
      field: 'outcome',
      message: 'Este passo não permite ser ignorado.',
    });
  }
  const resources = input.resources.map((resource, index) => ({
    resource: resource.resource.trim(),
    chaos: resource.chaos,
    index,
  }));
  for (const resource of resources) {
    if (!resource.resource) {
      issues.push({
        code: 'invalid_resource',
        field: `resources[${resource.index}].resource`,
        message: 'Informe o nome da moeda ou recurso gasto.',
      });
    }
    if (resource.chaos !== null && (!Number.isFinite(resource.chaos) || resource.chaos < 0)) {
      issues.push({
        code: 'invalid_resource',
        field: `resources[${resource.index}].chaos`,
        message: 'Informe um valor em chaos finito e maior ou igual a zero.',
      });
    }
  }
  if (issues.length > 0) return { issues };

  const normalizedResources = resources.map(({ resource, chaos }) => ({ resource, chaos }));
  const knownEventCost = normalizedResources.reduce(
    (total, resource) => total + (resource.chaos ?? 0),
    0,
  );
  const eventHasUnavailableCost = normalizedResources.some((resource) => resource.chaos === null);
  const eventCost = eventHasUnavailableCost ? null : knownEventCost;
  const nextStepIndex =
    input.outcome === 'success' || input.outcome === 'skipped'
      ? state.currentStepIndex + 1
      : input.outcome === 'restart'
        ? 0
        : state.currentStepIndex;
  const event: ExecutionEvent = {
    id: `${state.strategyId}:event:${state.events.length + 1}`,
    sequence: state.events.length + 1,
    stepId: step.id,
    outcome: input.outcome,
    resources: normalizedResources,
    totalCostChaos: eventCost,
    recordedAt: input.recordedAt,
  };
  return {
    state: {
      ...state,
      currentStepIndex: nextStepIndex,
      status: nextStepIndex >= strategy.steps.length ? 'completed' : 'active',
      events: [...state.events, event],
      totalCostChaos: state.totalCostChaos + knownEventCost,
      hasUnavailableCost: state.hasUnavailableCost || eventHasUnavailableCost,
    },
    event,
  };
}

export function summarizeExecution(
  state: ExecutionState,
  strategy: Pick<PlannerStrategy, 'id' | 'steps' | 'expectedCostChaos'>,
): ExecutionSummary | null {
  if (state.status !== 'completed' || state.strategyId !== strategy.id) return null;
  const attempts = new Map(strategy.steps.map((step) => [step.id, 0]));
  for (const event of state.events) {
    attempts.set(event.stepId, (attempts.get(event.stepId) ?? 0) + 1);
  }
  const knownRealCostChaos = state.totalCostChaos;
  const realCostChaos = state.hasUnavailableCost ? null : knownRealCostChaos;
  return {
    schemaVersion: EXECUTION_SCHEMA_VERSION,
    strategyId: strategy.id,
    planVersionId: state.planVersionId,
    expectedCostChaos: strategy.expectedCostChaos,
    realCostChaos,
    knownRealCostChaos,
    differenceChaos: realCostChaos === null ? null : realCostChaos - strategy.expectedCostChaos,
    hasUnavailableCost: state.hasUnavailableCost,
    attemptsByStep: strategy.steps.map((step) => ({
      stepId: step.id,
      label: step.label,
      attempts: attempts.get(step.id) ?? 0,
    })),
    path: state.events.map((event) => ({
      ...event,
      resources: event.resources.map((resource) => ({ ...resource })),
    })),
  };
}
