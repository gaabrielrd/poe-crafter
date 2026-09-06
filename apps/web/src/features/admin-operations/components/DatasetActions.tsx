import { useState } from 'react';
import type { FormEvent } from 'react';
import { Alert, Button, Input, Select, Textarea } from '@/shared/ui';
import {
  ADMIN_DATASET_ACTIONS,
  type AdminDatasetAction,
  type AdminDatasetActionResponse,
} from '../model/admin-dataset';
import { AdminDatasetError, manageAdminDataset } from '../services/admin-dataset';

type DatasetActionRunner = typeof manageAdminDataset;

type DatasetActionsProps = {
  execute?: DatasetActionRunner;
  onCompleted?: () => Promise<void>;
};

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Não foi possível concluir a operação do dataset. Tente novamente.';
}

function parseDatasetJson(value: string): unknown {
  if (!value.trim()) throw new Error('Informe o JSON do dataset antes de importar.');
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error('O conteúdo informado não é um JSON válido.');
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('O dataset precisa ser um objeto JSON.');
  }
  return parsed;
}

export function DatasetActions({ execute = manageAdminDataset, onCompleted }: DatasetActionsProps) {
  const [version, setVersion] = useState('');
  const [datasetJson, setDatasetJson] = useState('');
  const [action, setAction] = useState<Exclude<AdminDatasetAction, 'import'>>('validate');
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<AdminDatasetActionResponse | null>(null);
  const [error, setError] = useState<AdminDatasetError | Error | null>(null);

  async function run(requestedAction: AdminDatasetAction, dataset?: unknown) {
    const normalizedVersion = version.trim();
    if (!normalizedVersion) {
      setError(new Error('Informe o identificador da versão.'));
      return;
    }
    setPending(true);
    setResult(null);
    setError(null);
    try {
      const response = await execute(requestedAction, normalizedVersion, dataset);
      setResult(response);
      await onCompleted?.();
    } catch (caught: unknown) {
      setError(caught instanceof AdminDatasetError ? caught : new Error(errorMessage(caught)));
    } finally {
      setPending(false);
    }
  }

  function submitImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      void run('import', parseDatasetJson(datasetJson));
    } catch (caught: unknown) {
      setResult(null);
      setError(new Error(errorMessage(caught)));
    }
  }

  function submitLifecycle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(action);
  }

  const issues = error instanceof AdminDatasetError ? error.issues : [];

  return (
    <section aria-labelledby="dataset-actions" className="space-y-6">
      <div>
        <h2 id="dataset-actions" className="font-display text-2xl text-foreground">
          Ações de dataset
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Operações versionadas; a validação e a publicação continuam sob autoridade do backend.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={submitImport}
          className="space-y-4 rounded-lg border border-border/80 bg-card/70 p-5"
        >
          <div>
            <h3 className="font-medium text-foreground">Importar versão</h3>
            <p className="mt-1 text-sm text-muted-foreground">Até 20 KB de JSON por operação.</p>
          </div>
          <label className="block text-sm font-medium text-foreground" htmlFor="dataset-version">
            Identificador da versão
            <Input
              id="dataset-version"
              value={version}
              maxLength={64}
              onChange={(event) => setVersion(event.target.value)}
              placeholder="re-2026-09"
              className="mt-2"
            />
          </label>
          <label className="block text-sm font-medium text-foreground" htmlFor="dataset-json">
            Dataset JSON
            <Textarea
              id="dataset-json"
              aria-label="Dataset JSON"
              value={datasetJson}
              maxLength={20 * 1024}
              onChange={(event) => setDatasetJson(event.target.value)}
              placeholder='{"schemaVersion":1,"gameDataVersion":"..."}'
              className="mt-2 min-h-56"
            />
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              {datasetJson.length}/20480 caracteres
            </span>
          </label>
          <Button type="submit" disabled={pending}>
            {pending ? 'Importando…' : 'Importar dataset'}
          </Button>
        </form>

        <form
          onSubmit={submitLifecycle}
          className="space-y-4 rounded-lg border border-border/80 bg-card/70 p-5"
        >
          <div>
            <h3 className="font-medium text-foreground">Mudar estado</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Use uma versão importada e validada pelo planner.
            </p>
          </div>
          <label className="block text-sm font-medium text-foreground" htmlFor="dataset-action">
            Ação
            <Select
              id="dataset-action"
              value={action}
              onChange={(event) => setAction(event.target.value as typeof action)}
              className="mt-2"
            >
              {ADMIN_DATASET_ACTIONS.filter((candidate) => candidate !== 'import').map(
                (candidate) => (
                  <option key={candidate} value={candidate}>
                    {candidate === 'validate'
                      ? 'Validar'
                      : candidate === 'publish'
                        ? 'Publicar'
                        : 'Reativar'}
                  </option>
                ),
              )}
            </Select>
          </label>
          <label className="block text-sm font-medium text-foreground" htmlFor="lifecycle-version">
            Identificador da versão
            <Input
              id="lifecycle-version"
              value={version}
              maxLength={64}
              onChange={(event) => setVersion(event.target.value)}
              placeholder="re-2026-09"
              className="mt-2"
            />
          </label>
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending
              ? 'Processando…'
              : action === 'validate'
                ? 'Validar versão'
                : action === 'publish'
                  ? 'Publicar versão'
                  : 'Reativar versão'}
          </Button>
        </form>
      </div>

      {error && (
        <Alert role="alert" className="border-destructive/50">
          <p className="font-medium text-foreground">Operação não concluída</p>
          <p className="mt-2 text-sm text-destructive">{error.message}</p>
          {issues.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {issues.map((issue) => (
                <li key={`${issue.path}-${issue.code}`}>
                  <span className="font-mono">{issue.path || '$'}</span>: {issue.message}
                </li>
              ))}
            </ul>
          )}
        </Alert>
      )}

      {result && (
        <Alert role="status">
          <p className="font-medium text-foreground">Operação registrada</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {result.action} · versão {result.version} · status {result.status}
            {result.idempotent ? ' · repetição idempotente' : ''}
          </p>
        </Alert>
      )}
    </section>
  );
}
