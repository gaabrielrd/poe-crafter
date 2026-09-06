import { useEffect, useId, useState } from 'react';
import type { ActiveLeague } from '@poe-crafter/shared-types';
import { Alert, Button, Select } from '@/shared/ui';
import { catalogErrorMessage, type LeagueCatalogState } from '../model/league-catalog';
import { loadLeagueCatalog } from '../services/league-catalog';

export function LeagueSelector({
  onChange,
  initialLeague,
}: {
  onChange: (selection: { league: ActiveLeague | null; manual: boolean }) => void;
  initialLeague?: ActiveLeague | null;
}) {
  const selectId = useId();
  const [state, setState] = useState<LeagueCatalogState>({ status: 'loading' });
  const [selectedId, setSelectedId] = useState(initialLeague?.id ?? '');

  useEffect(() => {
    let mounted = true;
    loadLeagueCatalog()
      .then((catalog) => {
        if (!mounted) return;
        if (catalog.leagues.length === 0) {
          setState({ status: 'empty', message: 'Nenhuma liga PC ativa foi encontrada.' });
          return;
        }
        setState({ status: 'success', leagues: catalog.leagues });
      })
      .catch((error: unknown) => {
        if (mounted) setState({ status: 'error', message: catalogErrorMessage(error) });
      });
    return () => {
      mounted = false;
    };
  }, []);

  function chooseManual() {
    setSelectedId('');
    onChange({ league: null, manual: true });
  }

  function chooseLeague(value: string) {
    if (state.status !== 'success') return;
    setSelectedId(value);
    onChange({
      league: state.leagues.find((league) => league.id === value) ?? null,
      manual: false,
    });
  }

  return (
    <section
      aria-labelledby={`${selectId}-title`}
      className="space-y-4 border-y border-border/80 py-6"
    >
      <div>
        <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Contexto do craft
        </p>
        <h2
          id={`${selectId}-title`}
          className="font-display text-2xl tracking-wide text-foreground"
        >
          Escolha a liga PC
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          A liga será vinculada ao craft e aos preços usados nas próximas etapas.
        </p>
      </div>

      {state.status === 'loading' && (
        <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
          Carregando ligas PC ativas…
        </p>
      )}

      {(state.status === 'error' || state.status === 'empty') && (
        <Alert className="border-destructive/50">
          <p className="font-medium text-foreground">Preços automáticos indisponíveis</p>
          <p className="mt-2 text-sm text-muted-foreground">{state.message}</p>
          <Button type="button" variant="outline" className="mt-4" onClick={chooseManual}>
            Continuar sem preços automáticos
          </Button>
        </Alert>
      )}

      {state.status === 'success' && (
        <div className="space-y-3">
          <label htmlFor={selectId} className="text-sm font-medium text-foreground">
            Liga PC ativa
          </label>
          <Select
            id={selectId}
            value={selectedId}
            onChange={(event) => chooseLeague(event.target.value)}
          >
            <option value="">Escolha uma liga</option>
            {state.leagues.map((league) => (
              <option key={league.id} value={league.id}>
                {league.name}
              </option>
            ))}
          </Select>
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-xs text-muted-foreground">
              {selectedId
                ? `Identificador: ${selectedId}`
                : 'Escolha uma liga para habilitar a importação.'}
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={chooseManual}>
              Usar somente preços manuais
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
