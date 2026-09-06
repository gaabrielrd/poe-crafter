import {
  Anvil,
  CircleCheck,
  FilePlus2,
  History,
  Home,
  Palette,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router';
import { cn } from '@/shared/lib';
import { Badge } from '@/shared/ui';
import { IdentityStatus, useIdentity } from '@/features/identity';

const PROJECT_NAME = 'PoE Crafting Planner';

export function App() {
  const identity = useIdentity();
  return (
    <div className="app-shell min-h-svh bg-background text-foreground">
      <header className="enter-header border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-4 px-5 py-5 sm:px-8">
          <Link
            className="group flex min-w-0 items-center gap-3"
            to="/"
            aria-label="Página inicial"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-primary/35 bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
              <Anvil aria-hidden="true" className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-lg leading-none tracking-wide text-foreground sm:text-xl">
                {PROJECT_NAME}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">Path of Exile 1</span>
            </span>
          </Link>

          <nav
            className="order-3 flex w-full flex-wrap items-center gap-1 sm:order-none sm:ml-auto sm:w-auto"
            aria-label="Navegação principal"
          >
            {[
              { to: '/', label: 'Início', icon: Home, end: true },
              { to: '/new', label: 'Novo craft', icon: FilePlus2, end: false },
              { to: '/history', label: 'Histórico', icon: History, end: false },
              { to: '/settings', label: 'Configurações', icon: Settings, end: false },
              { to: '/admin', label: 'Administração', icon: ShieldCheck, end: false },
              { to: '/styleguide', label: 'Styleguide', icon: Palette, end: false },
            ].map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                  )
                }
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>

          <Badge className="ml-auto sm:ml-0">
            <CircleCheck className="size-3.5 text-success" aria-hidden="true" />
            Fundação pronta
          </Badge>
        </div>
        <div className="mx-auto flex max-w-6xl justify-end px-5 pb-4 sm:px-8">
          <IdentityStatus
            state={identity.state}
            linking={identity.linking}
            onLinkGoogle={() => void identity.linkGoogle()}
          />
        </div>
      </header>

      <main className="enter-content mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <Outlet />
      </main>
    </div>
  );
}
