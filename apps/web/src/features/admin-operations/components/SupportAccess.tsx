import { useState } from 'react';
import type { FormEvent } from 'react';
import { Alert, Button, Input, Textarea } from '@/shared/ui';
import { AdminSupportError, requestAdminCraftSupport } from '../services/admin-support';
import type { AdminSupportResponse } from '../model/admin-support';

type SupportRunner = typeof requestAdminCraftSupport;

type SupportAccessProps = {
  execute?: SupportRunner;
};

export function SupportAccess({ execute = requestAdminCraftSupport }: SupportAccessProps) {
  const [craftId, setCraftId] = useState('');
  const [reason, setReason] = useState('');
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<AdminSupportResponse | null>(null);
  const [error, setError] = useState<AdminSupportError | Error | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setError(null);
    const normalizedCraftId = craftId.trim();
    const normalizedReason = reason.trim();
    if (!normalizedCraftId || !normalizedReason) {
      setError(new Error('Informe o craftId e uma justificativa antes de solicitar acesso.'));
      return;
    }
    setPending(true);
    try {
      setResult(await execute(normalizedCraftId, normalizedReason));
    } catch (caught: unknown) {
      setError(
        caught instanceof AdminSupportError
          ? caught
          : new Error('Não foi possível concluir o acesso de suporte.'),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="support-access" className="space-y-6">
      <div>
        <h2 id="support-access" className="font-display text-2xl text-foreground">
          Acesso de suporte
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Cada consulta exige justificativa e deixa uma auditoria sem copiar o conteúdo do craft.
        </p>
      </div>

      <form
        onSubmit={(event) => void submit(event)}
        className="max-w-2xl space-y-4 rounded-lg border border-border/80 bg-card/70 p-5"
      >
        <label className="block text-sm font-medium text-foreground" htmlFor="support-craft-id">
          ID do craft
          <Input
            id="support-craft-id"
            value={craftId}
            maxLength={128}
            onChange={(event) => setCraftId(event.target.value)}
            placeholder="craft_123"
            className="mt-2"
          />
        </label>
        <label className="block text-sm font-medium text-foreground" htmlFor="support-reason">
          Justificativa
          <Textarea
            id="support-reason"
            value={reason}
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Descreva o caso de suporte."
            className="mt-2 min-h-28"
          />
          <span className="mt-1 block text-xs font-normal text-muted-foreground">
            {reason.length}/500 caracteres
          </span>
        </label>
        <Button type="submit" disabled={pending}>
          {pending ? 'Solicitando acesso…' : 'Solicitar acesso auditado'}
        </Button>
      </form>

      {error && (
        <Alert role="alert" className="border-destructive/50">
          <p className="font-medium text-foreground">Acesso não concedido</p>
          <p className="mt-2 text-sm text-destructive">{error.message}</p>
        </Alert>
      )}

      {result && (
        <Alert role="status">
          <p className="font-medium text-foreground">Acesso registrado</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {result.craft.title} · {result.craft.id} · proprietário {result.craft.ownerUid}
          </p>
          <pre
            aria-label="Conteúdo do craft"
            className="mt-4 max-h-96 overflow-auto rounded-md border border-border/80 bg-background/70 p-4 font-mono text-xs text-foreground"
          >
            {JSON.stringify(result.craft, null, 2)}
          </pre>
        </Alert>
      )}
    </section>
  );
}
