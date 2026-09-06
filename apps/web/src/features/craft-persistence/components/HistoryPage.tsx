import { History, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Alert, Button } from '@/shared/ui';
import { getDefaultCraftRepository, type CraftRepository } from '../services/craft-repository';
import type { CraftRecord } from '../model/craft';

export function HistoryPage({ repository }: { repository?: CraftRepository }) {
  const [records, setRecords] = useState<CraftRecord[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const activeRepository = repository ?? getDefaultCraftRepository();
  const configurationError = !activeRepository;
  const configurationMessage = 'Configure o Firebase para carregar o histórico privado.';

  useEffect(() => {
    let active = true;
    if (!activeRepository) {
      return () => {
        active = false;
      };
    }
    void activeRepository
      .listRecent()
      .then((next) => {
        if (!active) return;
        setRecords(next);
        setStatus('success');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setMessage(
          error instanceof Error ? error.message : 'Não foi possível carregar o histórico.',
        );
        setStatus('error');
      });
    return () => {
      active = false;
    };
  }, [activeRepository, configurationError]);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-3 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <History className="size-4" aria-hidden="true" />
            Histórico privado
          </p>
          <h1 className="font-display text-4xl tracking-tight text-foreground">Seus crafts</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            Retome alvos confirmados pela sessão atual. A lista pertence somente ao seu UID.
          </p>
        </div>
        <Button asChild>
          <Link to="/new">
            <Plus className="size-4" aria-hidden="true" />
            Novo craft
          </Link>
        </Button>
      </header>

      {status === 'loading' && (
        <p role="status" className="text-sm text-muted-foreground">
          Carregando histórico…
        </p>
      )}
      {(configurationError || status === 'error') && (
        <Alert role="alert" className="border-destructive/50">
          <p className="font-medium text-foreground">Não foi possível carregar o histórico</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {configurationError ? configurationMessage : message}
          </p>
        </Alert>
      )}
      {status === 'success' && records.length === 0 && (
        <Alert>
          <p className="font-medium text-foreground">Nenhum craft salvo ainda</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Confirme um alvo em Novo craft para ele aparecer aqui.
          </p>
        </Alert>
      )}
      {status === 'success' && records.length > 0 && (
        <ul className="space-y-3" aria-label="Crafts salvos">
          {records.map((record) => (
            <li key={record.id} className="rounded-lg border border-border bg-card p-5">
              <Link
                to={`/craft/${record.id}`}
                className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <h2 className="font-display text-2xl text-foreground">{record.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {record.league ? record.league.name : 'Preços manuais'} · Atualizado em{' '}
                  {new Date(record.updatedAt).toLocaleString('pt-BR')}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
