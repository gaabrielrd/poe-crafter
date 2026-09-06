import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { IdentityProvider, createFixtureAuthGateway } from '@/features/identity';
import { renderWithProviders } from '@/test/render';
import { AdminOverviewError } from '../services/admin-overview';
import { AdminDatasetError } from '../services/admin-dataset';
import { AdminPage } from '../components/AdminPage';
import type { AdminOverview } from '../model/admin-overview';

const overview: AdminOverview = {
  schemaVersion: 1,
  generatedAt: '2026-09-06T12:00:00.000Z',
  activeLeague: { id: 'standard', name: 'Standard', platform: 'pc' },
  dataset: {
    version: 'starter-1',
    status: 'active',
    updatedAt: '2026-09-06T10:00:00.000Z',
    source: 'fixture',
  },
  priceSnapshot: {
    id: 'prices-2026-09-06',
    status: 'stale',
    fetchedAt: '2026-09-06T09:00:00.000Z',
    league: 'Standard',
  },
  queue: { queued: 2, running: 1, failed: 1 },
  recentFailures: [
    {
      id: 'job-1',
      type: 'league-refresh',
      status: 'failed',
      updatedAt: '2026-09-06T11:00:00.000Z',
      errorMessage: 'Provider indisponível',
    },
  ],
};

describe('AdminPage', () => {
  it('não expõe diagnóstico para sessão anônima', async () => {
    renderWithProviders(
      <IdentityProvider gateway={createFixtureAuthGateway()}>
        <AdminPage loadOverview={() => Promise.resolve(overview)} />
      </IdentityProvider>,
    );

    expect(await screen.findByText('Acesso administrativo indisponível')).toBeInTheDocument();
    expect(screen.queryByText('Standard')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Ações de dataset' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Acesso de suporte' })).not.toBeInTheDocument();
  });

  it('mantém o estado sem permissão sem renderizar dados operacionais', async () => {
    const gateway = createFixtureAuthGateway();
    await gateway.linkGoogle();
    renderWithProviders(
      <IdentityProvider gateway={gateway}>
        <AdminPage
          loadOverview={() =>
            Promise.reject(
              new AdminOverviewError('admin-forbidden', 'Sua conta não possui autorização.'),
            )
          }
        />
      </IdentityProvider>,
    );

    expect(await screen.findByText('Sem permissão')).toBeInTheDocument();
    expect(screen.queryByText('Provider indisponível')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Ações de dataset' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Acesso de suporte' })).not.toBeInTheDocument();
  });

  it('mostra resumo, estados publicados e falhas após autorização', async () => {
    const gateway = createFixtureAuthGateway();
    await gateway.linkGoogle();
    renderWithProviders(
      <IdentityProvider gateway={gateway}>
        <AdminPage loadOverview={() => Promise.resolve(overview)} />
      </IdentityProvider>,
    );

    expect(
      await screen.findByRole('region', { name: 'Diagnóstico operacional' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('starter-1')).toBeInTheDocument();
    expect(screen.getByText('prices-2026-09-06')).toBeInTheDocument();
    expect(screen.getByText('Provider indisponível')).toBeInTheDocument();
  });

  it('oferece nova tentativa quando a leitura falha', async () => {
    const gateway = createFixtureAuthGateway();
    await gateway.linkGoogle();
    const loadOverview = vi
      .fn()
      .mockRejectedValueOnce(new Error('Serviço temporariamente indisponível.'))
      .mockResolvedValueOnce(overview);
    const { user } = renderWithProviders(
      <IdentityProvider gateway={gateway}>
        <AdminPage loadOverview={loadOverview} />
      </IdentityProvider>,
    );

    expect(await screen.findByText('Diagnóstico indisponível')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('starter-1')).toBeInTheDocument();
    expect(loadOverview).toHaveBeenCalledTimes(2);
  });

  it('importa uma versão, mostra o resultado e atualiza o diagnóstico', async () => {
    const gateway = createFixtureAuthGateway();
    await gateway.linkGoogle();
    const loadOverview = vi.fn().mockResolvedValue(overview);
    const manageDataset = vi.fn().mockResolvedValue({
      schemaVersion: 1,
      action: 'import',
      version: 'starter-2',
      status: 'imported',
    });
    const { user } = renderWithProviders(
      <IdentityProvider gateway={gateway}>
        <AdminPage loadOverview={loadOverview} manageDataset={manageDataset} />
      </IdentityProvider>,
    );

    expect(await screen.findByRole('region', { name: 'Ações de dataset' })).toBeInTheDocument();
    await user.type(screen.getAllByLabelText('Identificador da versão')[0]!, 'starter-2');
    fireEvent.change(screen.getByLabelText('Dataset JSON'), {
      target: { value: '{"schemaVersion":1}' },
    });
    await user.click(screen.getByRole('button', { name: 'Importar dataset' }));

    expect(await screen.findByText('Operação registrada')).toBeInTheDocument();
    expect(manageDataset).toHaveBeenCalledWith('import', 'starter-2', { schemaVersion: 1 });
    expect(loadOverview).toHaveBeenCalledTimes(2);
  });

  it('preserva issues de validação e o formulário em erro recuperável', async () => {
    const gateway = createFixtureAuthGateway();
    await gateway.linkGoogle();
    const manageDataset = vi
      .fn()
      .mockRejectedValue(
        new AdminDatasetError('validation-failed', 'Dataset inválido.', [
          { path: 'recipes[0].steps', code: 'invalid-value', message: 'step ausente' },
        ]),
      );
    const { user } = renderWithProviders(
      <IdentityProvider gateway={gateway}>
        <AdminPage loadOverview={() => Promise.resolve(overview)} manageDataset={manageDataset} />
      </IdentityProvider>,
    );

    await screen.findByRole('region', { name: 'Ações de dataset' });
    await user.type(screen.getAllByLabelText('Identificador da versão')[1]!, 'broken');
    await user.click(screen.getByRole('button', { name: 'Validar versão' }));

    expect(await screen.findByText('Dataset inválido.')).toBeInTheDocument();
    expect(screen.getByText('recipes[0].steps')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('step ausente');
    expect(screen.getAllByDisplayValue('broken')[0]).toBeInTheDocument();
  });

  it('acessa craft para suporte somente com justificativa e mostra o conteúdo retornado', async () => {
    const gateway = createFixtureAuthGateway();
    await gateway.linkGoogle();
    const requestSupport = vi.fn().mockResolvedValue({
      schemaVersion: 1,
      craft: {
        id: 'craft_123',
        ownerUid: 'owner-1',
        schemaVersion: 1,
        title: 'Divine Crown',
        league: null,
        manualPricing: false,
        status: 'confirmed',
        target: { item: { baseName: 'Divine Crown' }, classifications: {} },
        createdAt: '2026-09-06T10:00:00.000Z',
        updatedAt: '2026-09-06T10:05:00.000Z',
      },
    });
    const { user } = renderWithProviders(
      <IdentityProvider gateway={gateway}>
        <AdminPage loadOverview={() => Promise.resolve(overview)} requestSupport={requestSupport} />
      </IdentityProvider>,
    );

    await screen.findByRole('region', { name: 'Acesso de suporte' });
    await user.type(screen.getByLabelText('ID do craft'), 'craft_123');
    await user.type(screen.getByRole('textbox', { name: /Justificativa/ }), 'Reprodução de bug');
    await user.click(screen.getByRole('button', { name: 'Solicitar acesso auditado' }));

    expect(await screen.findByText('Acesso registrado')).toBeInTheDocument();
    expect(screen.getByLabelText('Conteúdo do craft')).toHaveTextContent('Divine Crown');
    expect(requestSupport).toHaveBeenCalledWith('craft_123', 'Reprodução de bug');
  });

  it('limpa resultado anterior e mostra falha de suporte', async () => {
    const gateway = createFixtureAuthGateway();
    await gateway.linkGoogle();
    const requestSupport = vi
      .fn()
      .mockResolvedValueOnce({
        schemaVersion: 1,
        craft: {
          id: 'craft_123',
          ownerUid: 'owner-1',
          schemaVersion: 1,
          title: 'Divine Crown',
          league: null,
          manualPricing: false,
          status: 'confirmed',
          target: {},
          createdAt: '2026-09-06T10:00:00.000Z',
          updatedAt: '2026-09-06T10:05:00.000Z',
        },
      })
      .mockRejectedValueOnce(new Error('Serviço de suporte indisponível.'));
    const { user } = renderWithProviders(
      <IdentityProvider gateway={gateway}>
        <AdminPage loadOverview={() => Promise.resolve(overview)} requestSupport={requestSupport} />
      </IdentityProvider>,
    );

    await screen.findByRole('region', { name: 'Acesso de suporte' });
    const craftInput = screen.getByLabelText('ID do craft');
    const reasonInput = screen.getByRole('textbox', { name: /Justificativa/ });
    await user.type(craftInput, 'craft_123');
    await user.type(reasonInput, 'bug');
    await user.click(screen.getByRole('button', { name: 'Solicitar acesso auditado' }));
    expect(await screen.findByText('Acesso registrado')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Solicitar acesso auditado' }));
    expect(
      await screen.findByText('Não foi possível concluir o acesso de suporte.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Acesso registrado')).not.toBeInTheDocument();
  });
});
