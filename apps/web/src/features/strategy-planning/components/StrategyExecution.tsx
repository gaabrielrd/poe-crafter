import { useState } from 'react';
import {
  appendExecutionEvent,
  createExecutionState,
  summarizeExecution,
  type ExecutionOutcome,
  type ExecutionState,
  type PlannerStrategy,
} from '@poe-crafter/planner';
import { Alert, Button, Input } from '@/shared/ui';

export interface StrategyExecutionProps {
  strategy: PlannerStrategy;
  planVersionId?: string;
  execution?: ExecutionState;
  onExecutionChange?: (execution: ExecutionState) => void;
}

export function StrategyExecution({
  strategy,
  planVersionId = strategy.id,
  execution,
  onExecutionChange,
}: StrategyExecutionProps) {
  const [localExecution, setLocalExecution] = useState<ExecutionState | null>(null);
  const [resource, setResource] = useState('');
  const [chaos, setChaos] = useState('');
  const [issues, setIssues] = useState<string[]>([]);
  const activeExecution = execution ?? localExecution;

  function updateExecution(next: ExecutionState) {
    if (onExecutionChange) {
      onExecutionChange(next);
    } else {
      setLocalExecution(next);
    }
  }

  function start() {
    updateExecution(createExecutionState(strategy, planVersionId));
    setIssues([]);
  }

  function record(outcome: ExecutionOutcome) {
    if (!activeExecution) return;
    const rawChaos = chaos.trim();
    const resources =
      resource.trim() || rawChaos
        ? [{ resource, chaos: rawChaos ? Number(rawChaos) : resource.trim() ? null : 0 }]
        : [];
    const result = appendExecutionEvent(activeExecution, strategy, {
      outcome,
      resources,
      recordedAt: new Date().toISOString(),
    });
    if ('issues' in result) {
      setIssues(result.issues.map((issue) => issue.message));
      return;
    }
    updateExecution(result.state);
    setIssues([]);
    setResource('');
    setChaos('');
  }

  const currentStep = activeExecution
    ? strategy.steps[activeExecution.currentStepIndex]
    : undefined;
  const summary = activeExecution ? summarizeExecution(activeExecution, strategy) : null;

  return (
    <div className="mt-5 border-t border-border pt-4">
      {!activeExecution ? (
        <Button type="button" variant="outline" onClick={start}>
          Iniciar execução local
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="font-display text-lg text-foreground">Execução local</h4>
            <p role="status" className="text-sm text-muted-foreground">
              {activeExecution.status === 'completed'
                ? 'Craft concluído'
                : `Passo ${activeExecution.currentStepIndex + 1} de ${strategy.steps.length}`}
            </p>
          </div>
          {activeExecution.status === 'active' && currentStep && (
            <div className="rounded-md border border-border bg-background/40 p-4">
              <p className="font-medium text-foreground">{currentStep.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Estado esperado: {currentStep.expectedState}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor={`execution-resource-${strategy.id}`}
                    className="text-xs text-muted-foreground"
                  >
                    Recurso gasto (opcional)
                  </label>
                  <Input
                    id={`execution-resource-${strategy.id}`}
                    value={resource}
                    onChange={(event) => setResource(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor={`execution-chaos-${strategy.id}`}
                    className="text-xs text-muted-foreground"
                  >
                    Chaos gasto (opcional)
                  </label>
                  <Input
                    id={`execution-chaos-${strategy.id}`}
                    type="number"
                    min="0"
                    step="any"
                    value={chaos}
                    onChange={(event) => setChaos(event.target.value)}
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" onClick={() => record('success')}>
                  Registrar sucesso
                </Button>
                <Button type="button" variant="outline" onClick={() => record('retry')}>
                  Registrar retry
                </Button>
                <Button type="button" variant="ghost" onClick={() => record('restart')}>
                  Registrar restart
                </Button>
              </div>
            </div>
          )}
          {issues.length > 0 && (
            <Alert role="alert" className="border-destructive/50">
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </Alert>
          )}
          {summary && (
            <section
              aria-label="Resumo do craft"
              className="space-y-4 rounded-md border border-primary/30 bg-primary/5 p-4"
            >
              <div>
                <h5 className="font-display text-lg text-foreground">Resumo do craft</h5>
                <p className="mt-1 text-xs text-muted-foreground">
                  Comparação da execução com a estratégia publicada; os dados continuam locais.
                </p>
              </div>
              <dl className="grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">Custo estimado</dt>
                  <dd className="font-medium text-foreground">
                    {summary.expectedCostChaos.toFixed(1)} chaos
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Custo real</dt>
                  <dd className="font-medium text-foreground">
                    {summary.realCostChaos === null
                      ? `Indisponível (${summary.knownRealCostChaos.toFixed(1)} chaos conhecidos)`
                      : `${summary.realCostChaos.toFixed(1)} chaos`}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Diferença</dt>
                  <dd className="font-medium text-foreground">
                    {summary.differenceChaos === null
                      ? 'Indisponível'
                      : `${summary.differenceChaos >= 0 ? '+' : ''}${summary.differenceChaos.toFixed(1)} chaos`}
                  </dd>
                </div>
              </dl>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h6 className="text-sm font-semibold text-foreground">Tentativas por passo</h6>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {summary.attemptsByStep.map((step) => (
                      <li key={step.stepId}>
                        {step.label}: {step.attempts}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h6 className="text-sm font-semibold text-foreground">Caminho completo</h6>
                  <ol aria-label="Caminho completo do craft" className="mt-2 space-y-1 text-sm">
                    {summary.path.map((event) => (
                      <li key={event.id} className="text-muted-foreground">
                        #{event.sequence} · {event.outcome} · {event.stepId}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </section>
          )}
          <p className="text-xs text-muted-foreground">
            Os eventos ficam somente nesta página até a sincronização de execução ser implementada.
            Custo acumulado:{' '}
            <span className="font-medium text-foreground">
              {activeExecution.totalCostChaos.toFixed(1)} chaos
            </span>
            {activeExecution.hasUnavailableCost && ' + custo indisponível'}.
          </p>
          {activeExecution.events.length > 0 && (
            <ol aria-label="Histórico de execução" className="space-y-2 text-sm">
              {activeExecution.events.map((event) => (
                <li
                  key={event.id}
                  className="flex flex-wrap justify-between gap-2 border-b border-border/70 pb-2"
                >
                  <span className="text-foreground">
                    #{event.sequence} · {event.outcome} · {event.stepId}
                  </span>
                  <span className="text-muted-foreground">
                    {event.totalCostChaos === null
                      ? 'custo indisponível'
                      : `${event.totalCostChaos.toFixed(1)} chaos`}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
