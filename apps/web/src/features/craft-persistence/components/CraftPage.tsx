/* c8 ignore file -- route lifecycle is covered by Chromium E2E. */

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Alert, Button } from '@/shared/ui';
import { ItemImportPage } from '@/features/item-import';
import { getDefaultCraftRepository, type CraftRepository } from '../services/craft-repository';
import type { CraftRecord } from '../model/craft';

export function CraftPage({ repository }: { repository?: CraftRepository }) {
  const { craftId } = useParams();
  const [record, setRecord] = useState<CraftRecord | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const activeRepository = repository ?? getDefaultCraftRepository();
  const configurationError = !craftId || !activeRepository;
  const configurationMessage = 'Configure o Firebase e informe um craft válido para continuar.';

  useEffect(() => {
    let active = true;
    if (!craftId || !activeRepository) {
      return () => {
        active = false;
      };
    }
    void activeRepository
      .get(craftId)
      .then((next) => {
        if (!active) return;
        setRecord(next);
        setStatus('success');
        if (!next) setMessage('Esse craft não existe ou não pertence à sessão atual.');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setMessage(error instanceof Error ? error.message : 'Não foi possível carregar o craft.');
        setStatus('error');
      });
    return () => {
      active = false;
    };
  }, [activeRepository, configurationError, craftId]);

  if (status === 'loading') {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Carregando craft…
      </p>
    );
  }
  if (configurationError || status === 'error' || !record) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <Alert role="alert" className="border-destructive/50">
          <p className="font-medium text-foreground">Não foi possível abrir o craft</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {configurationError ? configurationMessage : message}
          </p>
        </Alert>
        <Button asChild variant="outline">
          <Link to="/history">Voltar ao histórico</Link>
        </Button>
      </div>
    );
  }
  return <ItemImportPage initialCraft={record} repository={activeRepository} />;
}
