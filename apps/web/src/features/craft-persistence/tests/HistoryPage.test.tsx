import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { HistoryPage } from '@/features/craft-persistence';
import { createFixtureCraftRepository } from '@/features/craft-persistence';
import { renderWithProviders } from '@/test/render';
import type { AuthGateway } from '@/features/identity';

function auth(): AuthGateway {
  return {
    watch: () => () => undefined,
    ensureAnonymous: () => Promise.resolve(),
    linkGoogle: () => Promise.resolve({ uid: 'uid-history', kind: 'google' as const }),
    reauthenticateGoogle: () => Promise.resolve(),
    requestAccountDeletion: () =>
      Promise.resolve({
        status: 'pending' as const,
        requestedAt: '2026-09-06T00:00:00.000Z',
        scheduledFor: '2026-09-07T00:00:00.000Z',
      }),
    getIdToken: () => Promise.resolve('token'),
    getCurrentUser: () => ({ uid: 'uid-history', kind: 'anonymous' as const }),
  };
}

describe('HistoryPage', () => {
  it('mostra erro recuperável quando o repositório falha', async () => {
    const repository = {
      create: () => Promise.reject(new Error('create')),
      get: () => Promise.reject(new Error('get')),
      listRecent: () => Promise.reject(new Error('Firestore indisponível')),
      update: () => Promise.reject(new Error('update')),
    };
    renderWithProviders(<HistoryPage repository={repository} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Firestore indisponível');
  });

  it('mostra o estado vazio e o acesso a novo craft', async () => {
    const repository = createFixtureCraftRepository(auth());
    renderWithProviders(<HistoryPage repository={repository} />);

    expect(await screen.findByText('Nenhum craft salvo ainda')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Novo craft/i })).toHaveAttribute('href', '/new');
  });

  it('mostra somente os crafts retornados pelo repositório', async () => {
    const repository = createFixtureCraftRepository(auth());
    await repository.create({
      title: 'Divine Crown',
      league: null,
      manualPricing: true,
      target: {
        item: {
          baseName: 'Divine Crown',
          itemLevel: 86,
          influences: [],
          crafted: false,
          prefixes: [],
          suffixes: [],
          implicits: [],
          explicits: [],
          unparsedLines: [],
        },
        classifications: {},
      },
    });
    renderWithProviders(<HistoryPage repository={repository} />);

    expect(await screen.findByRole('link', { name: /Divine Crown/ })).toBeInTheDocument();
    expect(screen.getByText(/Preços manuais/)).toBeInTheDocument();
  });
});
