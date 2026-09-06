import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlanningConfiguration } from '@/features/planning-configuration';
import { renderWithProviders } from '@/test/render';

describe('PlanningConfiguration', () => {
  it('prepara o pedido e mostra que nenhum job foi iniciado', async () => {
    const onPrepared = vi.fn();
    const { user } = renderWithProviders(<PlanningConfiguration onPrepared={onPrepared} />);

    await user.selectOptions(screen.getByLabelText('Objetivo'), 'safest');
    await user.click(screen.getByRole('button', { name: 'Adicionar override' }));
    await user.type(screen.getByLabelText('Recurso'), 'Divine Orb');
    await user.type(screen.getByLabelText('Chaos'), '150');
    await user.click(screen.getByRole('button', { name: 'Preparar pedido' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Pedido preparado');
    expect(screen.getByRole('status')).toHaveTextContent('objetivo Safest');
    expect(screen.getByRole('status')).toHaveTextContent('Nenhum job foi iniciado');
    expect(onPrepared).toHaveBeenCalledWith(
      expect.objectContaining({ schemaVersion: 1, objective: 'safest' }),
    );
  });

  it('mostra erro quando todas as mecânicas são excluídas', async () => {
    const { user } = renderWithProviders(<PlanningConfiguration />);

    for (const mechanic of ['Essências', 'Fósseis', 'Harvest', 'Bancada', 'Metacrafts']) {
      await user.click(screen.getByRole('checkbox', { name: `Excluir ${mechanic}` }));
    }
    await user.click(screen.getByRole('button', { name: 'Preparar pedido' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Mantenha pelo menos uma mecânica');
  });

  it('valida override vazio e permite removê-lo', async () => {
    const { user } = renderWithProviders(<PlanningConfiguration />);

    await user.click(screen.getByRole('button', { name: 'Adicionar override' }));
    await user.click(screen.getByRole('button', { name: 'Preparar pedido' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Revise a configuração');
    await user.click(screen.getByRole('button', { name: 'Remover' }));
    expect(screen.queryByLabelText('Recurso')).not.toBeInTheDocument();
  });
});
