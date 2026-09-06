import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { generateStrategies, STARTER_PLANNER_DATASET } from '@poe-crafter/planner';
import { StrategyExecution } from '@/features/strategy-planning';
import { renderWithProviders } from '@/test/render';

const result = generateStrategies({
  request: {
    schemaVersion: 1,
    objective: 'recommended',
    excludedMechanics: [],
    priceOverrides: [],
  },
  target: {
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
    classifications: { 'prefix-0': 'required' },
  },
  craftability: { status: 'accepted' },
  dataset: STARTER_PLANNER_DATASET,
});

const strategy = result.strategies[0]!;

describe('StrategyExecution', () => {
  it('registra retry, sucesso e custo acumulado sem apagar o histórico', async () => {
    const { user } = renderWithProviders(<StrategyExecution strategy={strategy} />);

    await user.click(screen.getByRole('button', { name: 'Iniciar execução local' }));
    await user.clear(screen.getByLabelText('Recurso gasto (opcional)'));
    await user.type(screen.getByLabelText('Recurso gasto (opcional)'), 'Orb');
    await user.type(screen.getByLabelText('Chaos gasto (opcional)'), '2');
    await user.click(screen.getByRole('button', { name: 'Registrar retry' }));
    expect(screen.getByText(/#1 · retry/)).toBeInTheDocument();
    const total = screen.getAllByText(
      (_, element) =>
        element?.tagName === 'P' && (element.textContent?.includes('Custo acumulado:') ?? false),
    )[0];
    expect(total).toHaveTextContent('2.0 chaos');

    await user.click(screen.getByRole('button', { name: 'Registrar sucesso' }));
    expect(screen.getByRole('status')).toHaveTextContent('Craft concluído');
    expect(screen.getByRole('list', { name: 'Histórico de execução' })).toHaveTextContent(
      '#2 · success',
    );
    expect(screen.getByRole('region', { name: 'Resumo do craft' })).toHaveTextContent(
      'Custo estimado',
    );
    expect(screen.getByRole('region', { name: 'Resumo do craft' })).toHaveTextContent('2.0 chaos');
    expect(screen.getByRole('region', { name: 'Resumo do craft' })).toHaveTextContent('-2.0 chaos');
  });

  it('mantém a edição e mostra erro para chaos inválido', async () => {
    const { user } = renderWithProviders(<StrategyExecution strategy={strategy} />);

    await user.click(screen.getByRole('button', { name: 'Iniciar execução local' }));
    await user.type(screen.getByLabelText('Recurso gasto (opcional)'), 'Orb');
    await user.type(screen.getByLabelText('Chaos gasto (opcional)'), '-1');
    await user.click(screen.getByRole('button', { name: 'Registrar sucesso' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('valor em chaos');
    expect(screen.getByDisplayValue('Orb')).toBeInTheDocument();
  });

  it('sinaliza custo indisponível no resumo sem tratá-lo como zero', async () => {
    const { user } = renderWithProviders(<StrategyExecution strategy={strategy} />);

    await user.click(screen.getByRole('button', { name: 'Iniciar execução local' }));
    await user.type(screen.getByLabelText('Recurso gasto (opcional)'), 'Unknown currency');
    await user.click(screen.getByRole('button', { name: 'Registrar sucesso' }));

    const summary = screen.getByRole('region', { name: 'Resumo do craft' });
    expect(summary).toHaveTextContent('Custo real');
    expect(summary).toHaveTextContent('Indisponível (0.0 chaos conhecidos)');
    expect(summary).toHaveTextContent('Indisponível');
  });
});
