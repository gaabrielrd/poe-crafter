import { CheckCircle2, CircleAlert, Info, Sparkles } from 'lucide-react';
import { Alert, Badge, Button } from '@/shared/ui';

const TOKENS = [
  { name: 'Primary', className: 'bg-primary', value: '--primary' },
  { name: 'Background', className: 'bg-background', value: '--background' },
  { name: 'Card', className: 'bg-card', value: '--card' },
  { name: 'Muted', className: 'bg-muted', value: '--muted' },
  { name: 'Success', className: 'bg-success', value: '--success' },
  { name: 'Destructive', className: 'bg-destructive', value: '--destructive' },
] as const;

export function StyleguidePage() {
  return (
    <div className="space-y-16">
      <header className="max-w-3xl">
        <Badge>
          <Sparkles className="size-3.5" aria-hidden="true" />
          Referência viva
        </Badge>
        <h1 className="mt-5 font-display text-4xl tracking-tight text-foreground sm:text-5xl">
          Styleguide
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          Tokens e componentes mínimos usados pelo PoE Crafting Planner. Esta página é um contrato
          visual, não um catálogo genérico.
        </p>
      </header>

      <section aria-labelledby="colors-title">
        <h2 id="colors-title" className="font-display text-2xl tracking-wide text-foreground">
          Cores semânticas
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
          {TOKENS.map(({ name, className, value }) => (
            <div key={name} className="bg-card p-3">
              <div className={`h-20 rounded-md border border-border ${className}`} />
              <p className="mt-3 text-sm font-semibold text-foreground">{name}</p>
              <code className="mt-1 block font-mono text-[0.6875rem] text-muted-foreground">
                {value}
              </code>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="type-title"
        className="grid gap-8 border-y border-border py-10 md:grid-cols-2"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            TheMix · display
          </p>
          <h2 id="type-title" className="mt-4 font-display text-4xl leading-tight text-foreground">
            Clareza para decisões complexas.
          </h2>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Archivo · interface
          </p>
          <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
            Texto operacional permanece compacto, legível e direto. Números, estados e ações devem
            ser compreendidos em uma leitura rápida.
          </p>
          <code className="mt-5 block font-mono text-sm text-accent-foreground">
            2.4 divines · 71% de confiança
          </code>
        </div>
      </section>

      <section aria-labelledby="components-title" className="space-y-8">
        <div>
          <h2 id="components-title" className="font-display text-2xl tracking-wide text-foreground">
            Componentes em uso
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Somente primitives exigidas pela interface atual.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button>Ação primária</Button>
          <Button variant="secondary">Ação secundária</Button>
          <Button variant="outline">Ação discreta</Button>
          <Button variant="destructive">Ação destrutiva</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Alert>
            <Info className="size-5 text-primary" aria-hidden="true" />
            <h3 className="mt-3 font-display text-lg text-foreground">Informação</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Explique contexto antes de pedir uma decisão.
            </p>
          </Alert>
          <Alert className="border-success/40">
            <CheckCircle2 className="size-5 text-success" aria-hidden="true" />
            <h3 className="mt-3 font-display text-lg text-foreground">Concluído</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Confirme somente estados persistidos.
            </p>
          </Alert>
          <Alert className="border-destructive/50">
            <CircleAlert className="size-5 text-destructive" aria-hidden="true" />
            <h3 className="mt-3 font-display text-lg text-foreground">Falha recuperável</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Diga o que ocorreu e qual é a próxima ação.
            </p>
          </Alert>
        </div>
      </section>
    </div>
  );
}
