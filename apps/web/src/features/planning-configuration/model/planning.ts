export const PLANNING_REQUEST_SCHEMA_VERSION = 1 as const;

export const PLANNING_OBJECTIVES = ['recommended', 'cheapest', 'safest', 'premium'] as const;
export type PlanningObjective = (typeof PLANNING_OBJECTIVES)[number];

export const PLANNING_MECHANICS = ['essence', 'fossil', 'harvest', 'bench', 'metacraft'] as const;
export type PlanningMechanic = (typeof PLANNING_MECHANICS)[number];

export const PLANNING_MECHANIC_LABELS: Record<PlanningMechanic, string> = {
  essence: 'Essências',
  fossil: 'Fósseis',
  harvest: 'Harvest',
  bench: 'Bancada',
  metacraft: 'Metacrafts',
};

export interface PlanningPriceOverride {
  resource: string;
  chaos: number;
}

export interface PlanningRequest {
  schemaVersion: typeof PLANNING_REQUEST_SCHEMA_VERSION;
  objective: PlanningObjective;
  excludedMechanics: PlanningMechanic[];
  priceOverrides: PlanningPriceOverride[];
}

export interface PlanningPriceOverrideDraft {
  resource: string;
  chaos: string;
}

export interface PlanningDraft {
  objective: string;
  excludedMechanics: string[];
  priceOverrides: PlanningPriceOverrideDraft[];
}

export type PlanningIssueCode =
  | 'invalid_objective'
  | 'unknown_mechanic'
  | 'duplicate_mechanic'
  | 'no_search_space'
  | 'empty_resource'
  | 'invalid_price'
  | 'duplicate_resource';

export interface PlanningIssue {
  code: PlanningIssueCode;
  field: string;
  message: string;
}

function isPlanningObjective(value: string): value is PlanningObjective {
  return PLANNING_OBJECTIVES.includes(value as PlanningObjective);
}

function isPlanningMechanic(value: string): value is PlanningMechanic {
  return PLANNING_MECHANICS.includes(value as PlanningMechanic);
}

function compareText(left: string, right: string) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareMechanics(left: PlanningMechanic, right: PlanningMechanic) {
  return PLANNING_MECHANICS.indexOf(left) - PLANNING_MECHANICS.indexOf(right);
}

export function createPlanningRequest(
  draft: PlanningDraft,
): { request: PlanningRequest } | { issues: PlanningIssue[] } {
  const issues: PlanningIssue[] = [];
  if (!isPlanningObjective(draft.objective)) {
    issues.push({
      code: 'invalid_objective',
      field: 'objective',
      message: 'Escolha um objetivo válido para o planejamento.',
    });
  }

  const excludedMechanics: PlanningMechanic[] = [];
  for (const [index, value] of draft.excludedMechanics.entries()) {
    if (!isPlanningMechanic(value)) {
      issues.push({
        code: 'unknown_mechanic',
        field: `excludedMechanics[${index}]`,
        message: 'A mecânica excluída não pertence ao catálogo desta versão.',
      });
      continue;
    }
    if (excludedMechanics.includes(value)) {
      issues.push({
        code: 'duplicate_mechanic',
        field: `excludedMechanics[${index}]`,
        message: 'Não repita a mesma mecânica na lista de exclusões.',
      });
      continue;
    }
    excludedMechanics.push(value);
  }

  if (PLANNING_MECHANICS.every((mechanic) => excludedMechanics.includes(mechanic))) {
    issues.push({
      code: 'no_search_space',
      field: 'excludedMechanics',
      message: 'Mantenha pelo menos uma mecânica aplicável para criar espaço de busca.',
    });
  }

  const priceOverrides: PlanningPriceOverride[] = [];
  const resources = new Set<string>();
  for (const [index, override] of draft.priceOverrides.entries()) {
    const resource = override.resource.trim();
    const field = `priceOverrides[${index}]`;
    if (!resource) {
      issues.push({
        code: 'empty_resource',
        field: `${field}.resource`,
        message: 'Informe o recurso do override de preço.',
      });
    }
    const rawChaos = override.chaos.trim();
    const chaos = Number(rawChaos);
    if (!rawChaos || !Number.isFinite(chaos) || chaos < 0) {
      issues.push({
        code: 'invalid_price',
        field: `${field}.chaos`,
        message: 'Informe um valor em chaos maior ou igual a zero.',
      });
    }
    const resourceKey = resource.toLowerCase();
    if (resource && resources.has(resourceKey)) {
      issues.push({
        code: 'duplicate_resource',
        field: `${field}.resource`,
        message: 'Cada recurso pode ter somente um override.',
      });
    }
    if (resource) resources.add(resourceKey);
    if (resource && Number.isFinite(chaos) && chaos >= 0) priceOverrides.push({ resource, chaos });
  }

  if (issues.length > 0) return { issues };
  return {
    request: {
      schemaVersion: PLANNING_REQUEST_SCHEMA_VERSION,
      objective: draft.objective as PlanningObjective,
      excludedMechanics: excludedMechanics.sort(compareMechanics),
      priceOverrides: priceOverrides.sort((left, right) =>
        compareText(left.resource.toLowerCase(), right.resource.toLowerCase()),
      ),
    },
  };
}
