import { FileQuestionMark, TriangleAlert } from 'lucide-react';
import { Link, isRouteErrorResponse, useRouteError } from 'react-router';
import { Alert, buttonVariants } from '@/shared/ui';

/**
 * Tela para enderecos que nao correspondem a nenhuma rota.
 * Usada tanto pela rota curinga quanto pelo `errorElement` diante de um 404.
 */
export function NotFound() {
  return (
    <Alert className="max-w-2xl border-primary/30">
      <h1 className="flex items-center gap-3 font-display text-2xl tracking-wide text-foreground">
        <FileQuestionMark className="size-6 text-primary" aria-hidden="true" />
        Página não encontrada
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        O endereço acessado não existe neste aplicativo.
      </p>
      <Link className={buttonVariants({ variant: 'outline', className: 'mt-6' })} to="/">
        Voltar para o início
      </Link>
    </Alert>
  );
}

/**
 * Tela mostrada quando uma rota falha ao carregar ou ao renderizar.
 * Registrada como `errorElement` para que nenhum erro de rota resulte
 * em tela branca.
 */
export function RouteErrorFallback() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFound />;
  }

  const detail = error instanceof Error ? error.message : '';

  return (
    <Alert className="max-w-2xl border-destructive/50">
      <h1 className="flex items-center gap-3 font-display text-2xl tracking-wide text-foreground">
        <TriangleAlert className="size-6 text-destructive" aria-hidden="true" />
        Não foi possível carregar esta página
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Tente novamente. Se o problema continuar, avise quem mantém o projeto.
      </p>
      {detail ? (
        <pre className="mt-4 max-w-full overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs text-destructive-foreground">
          {detail}
        </pre>
      ) : null}
      <Link className={buttonVariants({ variant: 'outline', className: 'mt-6' })} to="/">
        Voltar para o início
      </Link>
    </Alert>
  );
}
