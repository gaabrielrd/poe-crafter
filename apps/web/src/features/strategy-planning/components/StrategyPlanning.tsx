import { useState } from 'react';
import {
  createPlannerPlanVersion,
  runPlannerJob,
  STARTER_PLANNER_DATASET,
  type ExecutionState,
  type PlannerPhase,
  type PlannerPlanVersion,
  type PlannerResult,
} from '@poe-crafter/planner';
import { Alert, Badge, Button, Select } from '@/shared/ui';
import type { ConfirmedItemTarget } from '@/features/item-import';
import type { PlanningRequest } from '@/features/planning-configuration';
import { CostGuardError, reservePlanningCost } from '../services/cost-guard';
import { StrategyExecution } from './StrategyExecution';

const PHASE_LABELS: Record<PlannerPhase, string> = {
  queued: 'Na fila',
  validating: 'Validando entrada',
  searching: 'Pesquisando caminhos',
  simulating: 'Simulando candidatos',
  succeeded: 'Estratégias prontas',
  failed: 'Planejamento falhou',
};

const OBJECTIVE_LABELS = {
  recommended: 'Recommended',
  cheapest: 'Cheapest',
  safest: 'Safest',
  premium: 'Premium',
} as const;

export interface StrategyPlanningProps {
  target: ConfirmedItemTarget;
  request: PlanningRequest;
  craftability: { status: 'accepted' | 'rejected' | 'unsupported' };
  costGuard?: typeof reservePlanningCost;
}

type ExecutionByKey = Record<string, ExecutionState>;

function formatChaos(value: number) {
  return `${value.toFixed(1)} chaos`;
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function StrategyPlanning({
  target,
  request,
  craftability,
  costGuard = reservePlanningCost,
}: StrategyPlanningProps) {
  const [phase, setPhase] = useState<PlannerPhase | 'idle'>('idle');
  const [versions, setVersions] = useState<PlannerPlanVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [pendingVersionId, setPendingVersionId] = useState<string | null>(null);
  const [failure, setFailure] = useState<PlannerResult | null>(null);
  const [costFailure, setCostFailure] = useState<string | null>(null);
  const [executions, setExecutions] = useState<ExecutionByKey>({});

  const activeVersion = versions.find((version) => version.id === activeVersionId);
  const pendingVersion = versions.find((version) => version.id === pendingVersionId);
  const requestSignature = JSON.stringify(request);
  const requestChanged =
    activeVersion !== undefined && JSON.stringify(activeVersion.request) !== requestSignature;

  async function generate(recalculate = Boolean(activeVersion)) {
    setFailure(null);
    setCostFailure(null);
    if (recalculate) setPendingVersionId(null);
    if (craftability.status === 'accepted') {
      const requestId =
        typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `planning-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      try {
        await costGuard(requestId);
      } catch (error: unknown) {
        setPhase('failed');
        setCostFailure(
          error instanceof CostGuardError
            ? error.message
            : 'Não foi possível verificar a proteção de custo. Tente novamente.',
        );
        return;
      }
    }
    const next = await runPlannerJob(
      {
        request,
        target,
        craftability,
        dataset: STARTER_PLANNER_DATASET,
      },
      {
        onUpdate: ({ phase: nextPhase, result: nextResult }) => {
          setPhase(nextPhase);
          if (nextResult?.phase === 'failed') setFailure(nextResult);
        },
      },
    );
    if (next.phase === 'failed') {
      setFailure(next);
      return;
    }
    const nextNumber =
      versions.reduce((largest, version) => Math.max(largest, version.number), 0) + 1;
    const nextVersion = createPlannerPlanVersion(next, request, {
      id: `plan-version-${nextNumber}-${Date.now()}`,
      number: nextNumber,
      createdAt: new Date().toISOString(),
    });
    setVersions((current) => [...current, nextVersion]);
    if (!activeVersion || !recalculate) {
      setActiveVersionId(nextVersion.id);
    } else {
      setPendingVersionId(nextVersion.id);
    }
  }

  const isRunning = phase !== 'idle' && phase !== 'succeeded' && phase !== 'failed';
  const statusRole = 'status';

  return (
    <section
      aria-labelledby="strategy-planning-title"
      className="space-y-4 border-t border-border pt-6"
    >
      <div>
        <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Próxima etapa
        </p>
        <h2 id="strategy-planning-title" className="font-display text-2xl text-foreground">
          Gerar estratégias
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          O job pesquisa apenas receitas completas do dataset inicial e omite caminhos que não
          passam pela validação. Ainda não inicia a execução do craft.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={() => void generate(Boolean(activeVersion))}
          disabled={isRunning || pendingVersionId !== null}
        >
          {isRunning
            ? PHASE_LABELS[phase]
            : activeVersion
              ? 'Recalcular estratégia'
              : 'Gerar estratégias'}
        </Button>
        <Badge>Objetivo: {OBJECTIVE_LABELS[request.objective]}</Badge>
      </div>

      {requestChanged && (
        <p role="status" className="text-sm text-muted-foreground">
          As preferências foram alteradas. Recalcule para publicar uma nova versão sem tocar no
          histórico anterior.
        </p>
      )}

      {versions.length > 1 && (
        <div className="max-w-sm space-y-2">
          <label htmlFor="strategy-plan-version" className="text-sm font-medium text-foreground">
            Versão ativa
          </label>
          <Select
            id="strategy-plan-version"
            value={activeVersionId ?? ''}
            onChange={(event) => setActiveVersionId(event.target.value)}
            disabled={pendingVersionId !== null}
          >
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                Versão {version.number} · {version.priceSnapshotId}
              </option>
            ))}
          </Select>
        </div>
      )}

      {phase !== 'idle' && (
        <p role={statusRole} aria-live="polite" className="text-sm text-muted-foreground">
          {PHASE_LABELS[phase]}
        </p>
      )}

      {failure?.phase === 'failed' && (
        <Alert role="alert" className="border-destructive/50">
          <p className="font-medium text-foreground">Nenhuma estratégia publicada</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {failure.issues.map((issue) => (
              <li key={issue.code}>{issue.message}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            O job terminou sem passos aproximados ou parcialmente validados.
          </p>
        </Alert>
      )}

      {costFailure && (
        <Alert role="alert" className="border-destructive/50">
          <p className="font-medium text-foreground">Planejamento indisponível</p>
          <p className="mt-2 text-sm text-muted-foreground">{costFailure}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Seu histórico e as versões já publicadas continuam disponíveis.
          </p>
        </Alert>
      )}

      {pendingVersion && activeVersion && (
        <Alert role="status" className="border-primary/40">
          <p className="font-medium text-foreground">Nova versão pronta</p>
          <p className="mt-2 text-sm text-muted-foreground">
            A versão {pendingVersion.number} usa o snapshot {pendingVersion.priceSnapshotId}. Versão{' '}
            {activeVersion.number}, eventos e custos anteriores continuam intactos.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setPendingVersionId(null)}>
              Continuar versão anterior
            </Button>
            <Button
              type="button"
              onClick={() => {
                setActiveVersionId(pendingVersion.id);
                setPendingVersionId(null);
              }}
            >
              Iniciar nova versão
            </Button>
          </div>
        </Alert>
      )}

      {activeVersion?.result.phase === 'succeeded' && (
        <div className="space-y-4" aria-label="Estratégias encontradas">
          <Alert role="status" className="border-primary/40">
            <p className="font-medium text-foreground">Estratégias prontas</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Versão {activeVersion.number} · {activeVersion.result.strategies.length} caminho(s)
              completo(s) · dataset {activeVersion.gameDataVersion}
              {' · '}snapshot {activeVersion.priceSnapshotId}
            </p>
            {(activeVersion.result.omitted.ineligible > 0 ||
              activeVersion.result.omitted.equivalent > 0) && (
              <p className="mt-2 text-xs text-muted-foreground">
                {activeVersion.result.omitted.ineligible} inelegível(is) e{' '}
                {activeVersion.result.omitted.equivalent} equivalente(s) omitido(s).
              </p>
            )}
          </Alert>
          <ol className="grid gap-4 lg:grid-cols-2">
            {activeVersion.result.strategies.map((strategy) => {
              const executionKey = `${activeVersion.id}:${strategy.id}`;
              return (
                <li key={strategy.id} className="rounded-lg border border-border bg-card p-5">
                  <h3 className="font-display text-xl text-foreground">{strategy.label}</h3>
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Custo esperado</dt>
                      <dd className="font-medium text-foreground">
                        {formatChaos(strategy.expectedCostChaos)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Custo P90</dt>
                      <dd className="font-medium text-foreground">
                        {formatChaos(strategy.p90CostChaos)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Tentativas esperadas</dt>
                      <dd className="font-medium text-foreground">
                        {strategy.expectedAttempts.toFixed(1)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Probabilidade</dt>
                      <dd className="font-medium text-foreground">
                        {formatPercent(strategy.successProbability)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Risco</dt>
                      <dd className="font-medium text-foreground">
                        {strategy.riskScore.toFixed(1)} / 100
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Passos</dt>
                      <dd className="font-medium text-foreground">{strategy.steps.length}</dd>
                    </div>
                  </dl>
                  <details className="mt-5 border-t border-border pt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      Ver explicação dos passos
                    </summary>
                    <div className="mt-4 space-y-4 text-sm">
                      <dl className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <dt className="text-muted-foreground">Base inicial</dt>
                          <dd className="font-medium text-foreground">
                            {strategy.target.baseName}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Item level</dt>
                          <dd className="font-medium text-foreground">
                            {strategy.target.itemLevel}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Influências</dt>
                          <dd className="font-medium text-foreground">
                            {strategy.target.influences.length > 0
                              ? strategy.target.influences.join(', ')
                              : 'Nenhuma'}
                          </dd>
                        </div>
                      </dl>
                      <ol className="space-y-4 border-l border-border pl-4">
                        {strategy.steps.map((step, index) => (
                          <li key={step.id}>
                            <h4 className="font-medium text-foreground">
                              Passo {index + 1}: {step.label}
                            </h4>
                            <p className="mt-1 text-muted-foreground">
                              Estado esperado: {step.expectedState}
                            </p>
                            <dl className="mt-2 grid gap-2 sm:grid-cols-3">
                              <div>
                                <dt className="text-xs text-muted-foreground">Sucesso</dt>
                                <dd className="text-foreground">
                                  {formatPercent(step.successProbability)}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-xs text-muted-foreground">Tentativas</dt>
                                <dd className="text-foreground">
                                  {step.expectedAttempts.toFixed(1)}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-xs text-muted-foreground">Custo</dt>
                                <dd className="text-foreground">
                                  {formatChaos(step.effectiveCostChaos)}
                                </dd>
                              </div>
                            </dl>
                            <p className="mt-2 text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">Retry:</span>{' '}
                              {step.retry}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">Restart:</span>{' '}
                              {step.restart}
                            </p>
                          </li>
                        ))}
                      </ol>
                      <p className="text-xs text-muted-foreground">
                        Esta é uma explicação do plano. Nenhuma tentativa ou moeda foi registrada e
                        nenhuma operação foi executada.
                      </p>
                    </div>
                  </details>
                  <StrategyExecution
                    strategy={strategy}
                    planVersionId={activeVersion.id}
                    execution={executions[executionKey]}
                    onExecutionChange={(nextExecution) =>
                      setExecutions((current) => ({ ...current, [executionKey]: nextExecution }))
                    }
                  />
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}
