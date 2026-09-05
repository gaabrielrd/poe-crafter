import { ArrowRight, Blocks, Database, FilePlus2, ShieldCheck, TerminalSquare } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/shared/ui';

const PNPM_SCRIPTS: ReadonlyArray<{ command: string; description: string }> = [
  { command: 'pnpm dev', description: 'Inicia a aplicação web com Vite' },
  { command: 'pnpm dev:emulators', description: 'Inicia o ambiente Firebase local' },
  { command: 'pnpm test', description: 'Executa testes e limites de cobertura' },
  { command: 'pnpm validate', description: 'Executa todos os gates do monorepo' },
];

const FOUNDATIONS = [
  {
    icon: Blocks,
    title: 'Fronteiras preparadas',
    description: 'Web, Functions e packages de dados evoluem sem misturar responsabilidades.',
  },
  {
    icon: Database,
    title: 'Firebase local primeiro',
    description: 'Hosting e regras começam no Emulator Suite, com acesso negado por padrão.',
  },
  {
    icon: ShieldCheck,
    title: 'Qualidade executável',
    description: 'Arquitetura, documentação, cobertura e bundle falham no mesmo comando.',
  },
] as const;

export function HomePage() {
  return (
    <div className="space-y-16 sm:space-y-20">
      <section aria-labelledby="home-title" className="max-w-4xl">
        <p className="mb-5 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          <span className="h-px w-8 bg-primary" aria-hidden="true" />
          Marco estrutural
        </p>
        <h1
          id="home-title"
          className="max-w-3xl font-display text-4xl leading-[1.05] tracking-tight text-foreground sm:text-6xl"
        >
          Uma bancada confiável para planejar cada craft.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          A fundação técnica está pronta para receber a importação de itens, o motor determinístico
          e o planejamento de estratégias sem depender das APIs da GGG.
        </p>
      </section>

      <section aria-labelledby="foundation-title" className="border-y border-border/80 py-8">
        <h2 id="foundation-title" className="sr-only">
          Fundação do projeto
        </h2>
        <ul className="grid gap-8 md:grid-cols-3 md:gap-0 md:divide-x md:divide-border/80">
          {FOUNDATIONS.map(({ icon: Icon, title, description }) => (
            <li key={title} className="md:px-7 md:first:pl-0 md:last:pr-0">
              <Icon className="mb-4 size-5 text-primary" aria-hidden="true" />
              <h3 className="font-display text-lg tracking-wide text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="start-craft-title"
        className="flex flex-col gap-5 border-b border-border/80 pb-10 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2
            id="start-craft-title"
            className="font-display text-2xl tracking-wide text-foreground"
          >
            Comece pelo item-alvo
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Cole o texto de um item e confira os campos reconhecidos antes de planejar o craft.
          </p>
        </div>
        <Button asChild>
          <Link to="/new">
            <FilePlus2 className="size-4" aria-hidden="true" />
            Importar item
          </Link>
        </Button>
      </section>

      <section
        aria-labelledby="commands-title"
        className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16"
      >
        <div>
          <TerminalSquare className="mb-5 size-6 text-primary" aria-hidden="true" />
          <h2
            id="commands-title"
            className="font-display text-2xl tracking-wide text-foreground sm:text-3xl"
          >
            Comandos pnpm disponíveis
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            A raiz coordena todos os workspaces. O desenvolvimento comum não exige conhecer a
            topologia interna.
          </p>
        </div>

        <ul className="divide-y divide-border/80 border-y border-border/80">
          {PNPM_SCRIPTS.map(({ command, description }) => (
            <li
              key={command}
              className="group flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <code className="font-mono text-sm font-semibold text-accent-foreground">
                {command}
              </code>
              <span className="flex items-center gap-2 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                {description}
                <ArrowRight
                  className="size-3.5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
