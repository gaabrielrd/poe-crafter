import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router';
import { Alert, Button, Input } from '@/shared/ui';
import { useIdentity } from '@/features/identity';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function SettingsPage() {
  const identity = useIdentity();
  const [confirming, setConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<Awaited<
    ReturnType<typeof identity.requestAccountDeletion>
  > | null>(null);

  const googleState = identity.state.status === 'google' ? identity.state : null;
  const isBusy = identity.reauthenticating || identity.deleting;

  useEffect(() => {
    if (confirming) document.getElementById('delete-confirmation')?.focus();
  }, [confirming]);

  async function submitDeletion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirmation !== 'EXCLUIR') return;
    setError('');
    setMessage('Confirmando sua identidade Google…');
    try {
      await identity.reauthenticateGoogle();
      setMessage('Registrando a solicitação de exclusão…');
      const nextReceipt = await identity.requestAccountDeletion();
      setReceipt(nextReceipt);
      setConfirming(false);
      setConfirmation('');
      setMessage('Solicitação registrada. A conta será removida dentro do prazo informado.');
    } catch (nextError: unknown) {
      setMessage('');
      setError(
        nextError instanceof Error ? nextError.message : 'Não foi possível solicitar a exclusão.',
      );
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          Voltar para início
        </Link>
        <p className="mt-6 mb-3 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Conta
        </p>
        <h1 className="font-display text-4xl tracking-tight text-foreground">Configurações</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          Gerencie sua identidade e solicite a exclusão dos dados privados associados à conta.
        </p>
      </div>

      {identity.state.status === 'loading' && (
        <p role="status" className="text-sm text-muted-foreground">
          Carregando a conta…
        </p>
      )}

      {identity.state.status === 'anonymous' && (
        <Alert role="status" className="border-primary/40">
          <p className="font-medium text-foreground">Vincule sua conta Google primeiro</p>
          <p className="mt-2 text-sm text-muted-foreground">
            A exclusão de conta exige uma identidade Google reautenticada. Use o botão de vínculo no
            cabeçalho e volte a esta tela.
          </p>
        </Alert>
      )}

      {googleState && (
        <section
          aria-labelledby="account-details-title"
          className="space-y-5 border-y border-border/80 py-8"
        >
          <div>
            <h2 id="account-details-title" className="font-display text-2xl text-foreground">
              Identidade Google
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {googleState.email ?? googleState.displayName ?? 'Conta Google conectada'}
            </p>
          </div>

          {receipt ? (
            <Alert role="status" className="border-primary/40">
              <p className="font-medium text-foreground">Exclusão agendada</p>
              <p className="mt-2 text-sm text-muted-foreground">{message}</p>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Solicitada em</dt>
                  <dd className="font-medium text-foreground">{formatDate(receipt.requestedAt)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Prazo máximo informado</dt>
                  <dd className="font-medium text-foreground">
                    {formatDate(receipt.scheduledFor)}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-muted-foreground">
                A confirmação registra o pedido; ela não afirma que a conta ou os dados já foram
                apagados.
              </p>
            </Alert>
          ) : (
            <>
              <Alert>
                <p className="font-medium text-foreground">Exclusão de conta e dados</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  A solicitação remove crafts, screenshots temporários e a identidade Firebase em
                  até 24 horas. Essa ação não pode ser desfeita.
                </p>
              </Alert>
              {!confirming && (
                <Button type="button" variant="destructive" onClick={() => setConfirming(true)}>
                  Solicitar exclusão
                </Button>
              )}
              {confirming && (
                <form
                  aria-label="Confirmar exclusão de conta"
                  onSubmit={(event) => void submitDeletion(event)}
                  className="space-y-4 rounded-md border border-destructive/50 bg-destructive/5 p-5"
                >
                  <div>
                    <h3 className="font-display text-xl text-foreground">
                      Confirme a ação destrutiva
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Digite <strong className="text-foreground">EXCLUIR</strong> para confirmar e
                      abrir a janela de reautenticação Google.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="delete-confirmation"
                      className="text-sm font-medium text-foreground"
                    >
                      Confirmação
                    </label>
                    <Input
                      id="delete-confirmation"
                      value={confirmation}
                      onChange={(event) => setConfirmation(event.target.value)}
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={confirmation !== 'EXCLUIR' || isBusy}
                    >
                      {isBusy ? 'Processando…' : 'Confirmar exclusão'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setConfirming(false);
                        setConfirmation('');
                        setError('');
                        setMessage('');
                      }}
                      disabled={isBusy}
                    >
                      Cancelar
                    </Button>
                  </div>
                  {message && (
                    <p role="status" className="text-sm text-muted-foreground">
                      {message}
                    </p>
                  )}
                  {error && (
                    <p role="alert" className="text-sm text-destructive">
                      {error}
                    </p>
                  )}
                </form>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
