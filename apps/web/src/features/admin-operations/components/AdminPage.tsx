import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Alert, Button } from '@/shared/ui';
import { useIdentity } from '@/features/identity';
import {
  AdminOverviewError,
  fetchAdminOverview,
  type AdminOverviewErrorCode,
} from '../services/admin-overview';
import type { AdminOverview } from '../model/admin-overview';
import { DatasetActions } from './DatasetActions';
import { manageAdminDataset } from '../services/admin-dataset';
import type { AdminDatasetActionResponse } from '../model/admin-dataset';
import { SupportAccess } from './SupportAccess';
import type { AdminSupportResponse } from '../model/admin-support';

type AdminPageProps = {
  loadOverview?: () => Promise<AdminOverview>;
  manageDataset?: (
    action: Parameters<typeof manageAdminDataset>[0],
    version: string,
    dataset?: unknown,
  ) => Promise<AdminDatasetActionResponse>;
  requestSupport?: (craftId: string, reason: string) => Promise<AdminSupportResponse>;
};

const defaultLoadOverview = () => fetchAdminOverview();

type PageState =
  | { status: 'idle' | 'loading' }
  | { status: 'forbidden'; message: string }
  | { status: 'error'; message: string }
  | { status: 'success'; overview: AdminOverview };

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}

function errorState(error: unknown): Extract<PageState, { status: 'forbidden' | 'error' }> {
  const code: AdminOverviewErrorCode =
    error instanceof AdminOverviewError ? error.code : 'admin-overview-unavailable';
  const message =
    error instanceof Error
      ? error.message
      : 'Não foi possível carregar o diagnóstico operacional. Tente novamente.';
  return code === 'admin-forbidden'
    ? { status: 'forbidden', message }
    : { status: 'error', message };
}

export function AdminPage({
  loadOverview = defaultLoadOverview,
  manageDataset,
  requestSupport,
}: AdminPageProps) {
  const identity = useIdentity();
  const [page, setPage] = useState<PageState>({ status: 'idle' });
  const isGoogle = identity.state.status === 'google';

  useEffect(() => {
    if (identity.state.status !== 'google') {
      return;
    }
    let active = true;
    void loadOverview().then(
      (overview) => {
        if (active) setPage({ status: 'success', overview });
      },
      (error: unknown) => {
        if (active) setPage(errorState(error));
      },
    );
    return () => {
      active = false;
    };
  }, [identity.state.status, loadOverview]);

  async function refreshOverview(showLoading = true) {
    if (showLoading) setPage({ status: 'loading' });
    try {
      setPage({ status: 'success', overview: await loadOverview() });
    } catch (error: unknown) {
      setPage(errorState(error));
    }
  }

  async function retry() {
    await refreshOverview();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          Voltar para início
        </Link>
        <p className="mt-6 mb-3 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Operação
        </p>
        <h1 className="font-display text-4xl tracking-tight text-foreground">Administração</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          Diagnóstico agregado de dados, preços e jobs, com ações versionadas de dataset para
          administradores autorizados.
        </p>
      </div>

      {identity.state.status === 'loading' && (
        <p role="status" className="text-sm text-muted-foreground">
          Carregando a sessão…
        </p>
      )}

      {identity.state.status === 'anonymous' && (
        <Alert role="status">
          <p className="font-medium text-foreground">Acesso administrativo indisponível</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Vincule uma conta Google autorizada para consultar o diagnóstico.
          </p>
        </Alert>
      )}

      {isGoogle && (page.status === 'idle' || page.status === 'loading') && (
        <p role="status" className="text-sm text-muted-foreground">
          Carregando diagnóstico…
        </p>
      )}

      {isGoogle && page.status === 'forbidden' && (
        <Alert role="status">
          <p className="font-medium text-foreground">Sem permissão</p>
          <p className="mt-2 text-sm text-muted-foreground">{page.message}</p>
        </Alert>
      )}

      {isGoogle && page.status === 'error' && (
        <Alert role="alert" className="border-destructive/50">
          <p className="font-medium text-foreground">Diagnóstico indisponível</p>
          <p className="mt-2 text-sm text-muted-foreground">{page.message}</p>
          <Button className="mt-4" type="button" variant="secondary" onClick={() => void retry()}>
            Tentar novamente
          </Button>
        </Alert>
      )}

      {isGoogle && page.status === 'success' && (
        <>
          <OverviewContent overview={page.overview} />
          <DatasetActions execute={manageDataset} onCompleted={() => refreshOverview(false)} />
          <SupportAccess execute={requestSupport} />
        </>
      )}
    </div>
  );
}

function OverviewContent({ overview }: { overview: AdminOverview }) {
  return (
    <div role="region" aria-label="Diagnóstico operacional" className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Atualizado em {formatDate(overview.generatedAt)}
      </p>
      <section aria-labelledby="operations-summary" className="grid gap-4 sm:grid-cols-3">
        <h2 id="operations-summary" className="sr-only">
          Resumo da fila
        </h2>
        {(['queued', 'running', 'failed'] as const).map((key) => (
          <div key={key} className="rounded-lg border border-border/80 bg-card/70 p-5">
            <p className="text-sm text-muted-foreground">
              {key === 'queued' ? 'Na fila' : key === 'running' ? 'Em execução' : 'Com falha'}
            </p>
            <p className="mt-2 font-display text-3xl text-foreground">{overview.queue[key]}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3" aria-label="Estado publicado">
        <StatusBlock title="Liga ativa">
          {overview.activeLeague ? (
            <>
              <strong className="text-foreground">{overview.activeLeague.name}</strong>
              <span className="mt-1 block text-sm text-muted-foreground">
                {overview.activeLeague.id} · {overview.activeLeague.platform.toUpperCase()}
              </span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Nenhuma liga publicada.</span>
          )}
        </StatusBlock>
        <StatusBlock title="Dataset ativo">
          {overview.dataset ? (
            <>
              <strong className="text-foreground">{overview.dataset.version}</strong>
              <span className="mt-1 block text-sm text-muted-foreground">
                {overview.dataset.status} · atualizado {formatDate(overview.dataset.updatedAt)}
              </span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Nenhum dataset publicado.</span>
          )}
        </StatusBlock>
        <StatusBlock title="Snapshot de preços">
          {overview.priceSnapshot ? (
            <>
              <strong className="text-foreground">{overview.priceSnapshot.id}</strong>
              <span className="mt-1 block text-sm text-muted-foreground">
                {overview.priceSnapshot.status} · {formatDate(overview.priceSnapshot.fetchedAt)}
              </span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Nenhum snapshot disponível.</span>
          )}
        </StatusBlock>
      </section>

      <section aria-labelledby="recent-failures" className="space-y-4">
        <div>
          <h2 id="recent-failures" className="font-display text-2xl text-foreground">
            Falhas recentes
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Somente jobs operacionais sem conteúdo privado de crafts.
          </p>
        </div>
        {overview.recentFailures.length === 0 ? (
          <Alert role="status">Nenhuma falha operacional registrada.</Alert>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/80">
            <table className="w-full min-w-[38rem] text-left text-sm">
              <thead className="border-b border-border/80 bg-muted/30 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Atualizado</th>
                  <th className="px-4 py-3 font-medium">Falha</th>
                </tr>
              </thead>
              <tbody>
                {overview.recentFailures.map((failure) => (
                  <tr key={failure.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">{failure.type}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(failure.updatedAt)}
                    </td>
                    <td className="px-4 py-3 text-destructive">{failure.errorMessage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatusBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border/80 bg-card/70 p-5">
      <p className="text-sm text-muted-foreground">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
