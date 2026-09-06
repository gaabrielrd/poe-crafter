import { useState } from 'react';
import { Alert, Button, Input, Select } from '@/shared/ui';
import {
  createPlanningRequest,
  PLANNING_MECHANIC_LABELS,
  PLANNING_MECHANICS,
  PLANNING_OBJECTIVES,
  type PlanningIssue,
  type PlanningMechanic,
  type PlanningPriceOverrideDraft,
  type PlanningRequest,
} from '../model/planning';

const OBJECTIVE_LABELS = {
  recommended: 'Recommended',
  cheapest: 'Cheapest',
  safest: 'Safest',
  premium: 'Premium',
} as const;

export interface PlanningConfigurationProps {
  onPrepared?: (request: PlanningRequest) => void;
}

function issueFor(issues: PlanningIssue[], field: string) {
  return issues.find((issue) => issue.field === field)?.message;
}

export function PlanningConfiguration({ onPrepared }: PlanningConfigurationProps = {}) {
  const [objective, setObjective] = useState('recommended');
  const [excludedMechanics, setExcludedMechanics] = useState<PlanningMechanic[]>([]);
  const [priceOverrides, setPriceOverrides] = useState<PlanningPriceOverrideDraft[]>([]);
  const [issues, setIssues] = useState<PlanningIssue[]>([]);
  const [prepared, setPrepared] = useState<PlanningRequest | null>(null);

  function toggleMechanic(mechanic: PlanningMechanic) {
    setExcludedMechanics((current) =>
      current.includes(mechanic)
        ? current.filter((value) => value !== mechanic)
        : [...current, mechanic],
    );
    setIssues([]);
    setPrepared(null);
  }

  function updateOverride(index: number, update: Partial<PlanningPriceOverrideDraft>) {
    setPriceOverrides((current) =>
      current.map((override, currentIndex) =>
        currentIndex === index ? { ...override, ...update } : override,
      ),
    );
    setIssues([]);
    setPrepared(null);
  }

  function prepare(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = createPlanningRequest({ objective, excludedMechanics, priceOverrides });
    if ('issues' in result) {
      setIssues(result.issues);
      setPrepared(null);
      return;
    }
    setIssues([]);
    setPrepared(result.request);
    onPrepared?.(result.request);
  }

  return (
    <section
      aria-labelledby="planning-configuration-title"
      className="space-y-6 border-t border-border pt-6"
    >
      <div>
        <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Preferências do planejamento
        </p>
        <h2 id="planning-configuration-title" className="font-display text-2xl text-foreground">
          Configure o pedido
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Estas escolhas serão entregues ao futuro planner. Nenhuma estratégia ou preço atual é
          calculado nesta etapa.
        </p>
      </div>

      <form onSubmit={prepare} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="planning-objective" className="text-sm font-medium text-foreground">
            Objetivo
          </label>
          <Select
            id="planning-objective"
            value={objective}
            onChange={(event) => {
              setObjective(event.target.value);
              setIssues([]);
              setPrepared(null);
            }}
          >
            {PLANNING_OBJECTIVES.map((value) => (
              <option key={value} value={value}>
                {OBJECTIVE_LABELS[value]}
              </option>
            ))}
          </Select>
          {issueFor(issues, 'objective') && (
            <p className="text-sm text-destructive">{issueFor(issues, 'objective')}</p>
          )}
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-foreground">Excluir mecânicas</legend>
          <p className="text-xs text-muted-foreground">
            Mantenha pelo menos uma mecânica aplicável para o planner pesquisar alternativas.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {PLANNING_MECHANICS.map((mechanic) => (
              <label
                key={mechanic}
                className="flex items-center gap-3 rounded-md border border-border bg-background/40 px-3 py-3 text-sm text-foreground"
              >
                <Input
                  type="checkbox"
                  className="size-4 w-4 accent-primary"
                  checked={excludedMechanics.includes(mechanic)}
                  onChange={() => toggleMechanic(mechanic)}
                  aria-label={`Excluir ${PLANNING_MECHANIC_LABELS[mechanic]}`}
                />
                {PLANNING_MECHANIC_LABELS[mechanic]}
              </label>
            ))}
          </div>
          {issueFor(issues, 'excludedMechanics') && (
            <p role="alert" className="text-sm text-destructive">
              {issueFor(issues, 'excludedMechanics')}
            </p>
          )}
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-foreground">Overrides de preço</legend>
          <p className="text-xs text-muted-foreground">
            Opcional. Informe quanto um recurso custa em chaos; isso não substitui um snapshot.
          </p>
          {priceOverrides.map((override, index) => (
            <div key={index} className="grid gap-3 sm:grid-cols-[1fr_10rem_auto]">
              <div className="space-y-2">
                <label
                  htmlFor={`planning-resource-${index}`}
                  className="text-xs text-muted-foreground"
                >
                  Recurso
                </label>
                <Input
                  id={`planning-resource-${index}`}
                  value={override.resource}
                  onChange={(event) => updateOverride(index, { resource: event.target.value })}
                  aria-invalid={Boolean(issueFor(issues, `priceOverrides[${index}].resource`))}
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor={`planning-chaos-${index}`}
                  className="text-xs text-muted-foreground"
                >
                  Chaos
                </label>
                <Input
                  id={`planning-chaos-${index}`}
                  type="number"
                  min="0"
                  step="any"
                  value={override.chaos}
                  onChange={(event) => updateOverride(index, { chaos: event.target.value })}
                  aria-invalid={Boolean(issueFor(issues, `priceOverrides[${index}].chaos`))}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                className="self-end"
                onClick={() => {
                  setPriceOverrides((current) =>
                    current.filter((_, currentIndex) => currentIndex !== index),
                  );
                  setIssues([]);
                  setPrepared(null);
                }}
              >
                Remover
              </Button>
              {issueFor(issues, `priceOverrides[${index}].resource`) && (
                <p className="text-sm text-destructive sm:col-span-2">
                  {issueFor(issues, `priceOverrides[${index}].resource`)}
                </p>
              )}
              {issueFor(issues, `priceOverrides[${index}].chaos`) && (
                <p className="text-sm text-destructive sm:col-span-2">
                  {issueFor(issues, `priceOverrides[${index}].chaos`)}
                </p>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPriceOverrides((current) => [...current, { resource: '', chaos: '' }]);
              setIssues([]);
              setPrepared(null);
            }}
          >
            Adicionar override
          </Button>
        </fieldset>

        {issues.length > 0 && !issueFor(issues, 'excludedMechanics') && (
          <Alert role="alert" className="border-destructive/50">
            <p className="font-medium text-foreground">Revise a configuração</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {issues.map((issue) => (
                <li key={`${issue.code}:${issue.field}`}>{issue.message}</li>
              ))}
            </ul>
          </Alert>
        )}

        <Button type="submit">Preparar pedido</Button>
      </form>

      {prepared && (
        <Alert role="status" className="border-primary/40">
          <p className="font-medium text-foreground">Pedido preparado</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Schema {prepared.schemaVersion} · objetivo {OBJECTIVE_LABELS[prepared.objective]} ·{' '}
            {prepared.excludedMechanics.length} exclusão(ões) · {prepared.priceOverrides.length}{' '}
            override(s).
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Nenhum job foi iniciado e nenhuma estratégia foi gerada.
          </p>
        </Alert>
      )}
    </section>
  );
}
