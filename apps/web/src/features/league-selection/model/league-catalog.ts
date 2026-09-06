import type { ActiveLeague } from '@poe-crafter/shared-types';

export type LeagueCatalogState =
  | { status: 'loading' }
  | { status: 'success'; leagues: ActiveLeague[] }
  | { status: 'empty'; message: string }
  | { status: 'error'; message: string };

export function catalogErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível carregar as ligas ativas.';
}
