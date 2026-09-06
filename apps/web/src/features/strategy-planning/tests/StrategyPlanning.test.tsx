import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StrategyPlanning } from '@/features/strategy-planning';
import { CostGuardError } from '@/features/strategy-planning';
import { renderWithProviders } from '@/test/render';

const target = {
  item: {
    baseName: 'Divine Crown',
    itemLevel: 86,
    influences: [],
    crafted: false,
    prefixes: [
      {
        raw: 'Prefix: IncreasedLife9',
        code: 'IncreasedLife9',
        tags: [],
        crafted: false,
        unveiled: false,
      },
    ],
    suffixes: [],
    implicits: [],
    explicits: [],
    unparsedLines: [],
  },
  classifications: { 'prefix-0': 'required' as const },
};

const request = {
  schemaVersion: 1 as const,
  objective: 'recommended' as const,
  excludedMechanics: [],
  priceOverrides: [],
};

describe('StrategyPlanning', () => {
  it('mostra as fases e estratégias comparáveis do job', async () => {
    const { user } = renderWithProviders(
      <StrategyPlanning target={target} request={request} craftability={{ status: 'accepted' }} />,
    );

    await user.click(screen.getByRole('button', { name: 'Gerar estratégias' }));
    expect(await screen.findAllByText('Estratégias prontas')).toHaveLength(2);
    expect(screen.getByText('Bancada de vida')).toBeInTheDocument();
    expect(screen.getAllByText('Custo esperado')).toHaveLength(3);
    await user.click(screen.getAllByText('Ver explicação dos passos')[0]!);
    expect(screen.getAllByText('Base inicial')).toHaveLength(3);
    expect(screen.getAllByText(/Estado esperado:/)).toHaveLength(3);
    expect(screen.getAllByText(/Retry:/)).toHaveLength(3);
    expect(screen.getAllByText(/Restart:/)).toHaveLength(3);
  });

  it('não publica passos quando o alvo não é aceito', async () => {
    const { user } = renderWithProviders(
      <StrategyPlanning
        target={target}
        request={request}
        craftability={{ status: 'unsupported' }}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Gerar estratégias' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Nenhuma estratégia publicada');
    expect(screen.queryByText('Bancada de vida')).not.toBeInTheDocument();
  });

  it('bloqueia novo job quando a proteção de custo nega a reserva', async () => {
    const costGuard = vi
      .fn()
      .mockRejectedValue(new CostGuardError('cost-blocked', 'OCR e jobs pausados.'));
    const { user } = renderWithProviders(
      <StrategyPlanning
        target={target}
        request={request}
        craftability={{ status: 'accepted' }}
        costGuard={costGuard}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Gerar estratégias' }));
    expect(await screen.findByText('Planejamento indisponível')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('OCR e jobs pausados.');
    expect(screen.queryByText('Estratégias prontas')).not.toBeInTheDocument();
    expect(costGuard).toHaveBeenCalledTimes(1);
  });

  it('preserva a execução anterior ao recalcular e exige uma escolha de versão', async () => {
    const { user } = renderWithProviders(
      <StrategyPlanning target={target} request={request} craftability={{ status: 'accepted' }} />,
    );

    await user.click(screen.getByRole('button', { name: 'Gerar estratégias' }));
    await screen.findByRole('button', { name: 'Recalcular estratégia' });
    await user.click(screen.getAllByRole('button', { name: 'Iniciar execução local' })[0]!);
    await user.click(screen.getAllByRole('button', { name: 'Registrar sucesso' })[0]!);
    expect(screen.getByText('Craft concluído')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Recalcular estratégia' }));
    expect(await screen.findByText('Nova versão pronta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar versão anterior' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Iniciar nova versão' }));

    const versionSelect = screen.getByLabelText<HTMLSelectElement>('Versão ativa');
    expect(versionSelect.options).toHaveLength(2);
    const firstOption = versionSelect.options.item(0);
    if (!firstOption) throw new Error('A versão anterior não foi publicada.');
    await user.selectOptions(versionSelect, firstOption.value);
    expect(screen.getByText('Craft concluído')).toBeInTheDocument();
  });
});
