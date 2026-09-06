import { CircleAlert, CircleCheck, LoaderCircle, ShieldCheck } from 'lucide-react';
import { Alert, Badge, Button } from '@/shared/ui';
import type { IdentityState } from '../model/identity';

type IdentityStatusProps = {
  state: IdentityState;
  linking: boolean;
  onLinkGoogle: () => void;
};

export function IdentityStatus({ state, linking, onLinkGoogle }: IdentityStatusProps) {
  const isAnonymous =
    state.status === 'anonymous' ||
    (state.status === 'error' && state.previousKind === 'anonymous');
  const error = state.status === 'error' ? state.message : undefined;

  return (
    <aside className="w-full max-w-sm" aria-label="Conta">
      <Alert className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-foreground">Conta</span>
          {state.status === 'loading' && (
            <LoaderCircle className="icon animate-spin" aria-label="Carregando" />
          )}
          {state.status === 'anonymous' && (
            <Badge>
              <ShieldCheck className="icon-sm" />
              Sessão anônima
            </Badge>
          )}
          {state.status === 'google' && (
            <Badge>
              <CircleCheck className="icon-sm text-success" />
              Google conectado
            </Badge>
          )}
          {state.status === 'error' && (
            <CircleAlert className="icon text-destructive" aria-label="Erro" />
          )}
        </div>
        {state.status === 'loading' && (
          <p className="text-xs text-muted-foreground">Preparando uma sessão segura…</p>
        )}
        {state.status === 'anonymous' && (
          <>
            <p className="text-xs text-muted-foreground">
              Seu craft fica preservado neste dispositivo.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onLinkGoogle}
              disabled={linking}
            >
              {linking ? 'Abrindo Google…' : 'Vincular Google'}
            </Button>
          </>
        )}
        {state.status === 'google' && (
          <p className="text-xs text-muted-foreground">
            {state.email ?? state.displayName ?? 'Conta vinculada'}
          </p>
        )}
        {error && (
          <>
            <p className="text-xs text-destructive">{error}</p>
            {isAnonymous && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onLinkGoogle}
                disabled={linking}
              >
                Tentar novamente
              </Button>
            )}
          </>
        )}
      </Alert>
    </aside>
  );
}
