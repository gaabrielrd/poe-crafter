import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LeagueSelector } from '../components/LeagueSelector';
import { renderWithProviders } from '@/test/render';

describe('LeagueSelector', () => {
  it('carrega o catálogo local de desenvolvimento e propaga a liga escolhida', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(<LeagueSelector onChange={onChange} />);
    const select = await screen.findByRole('combobox', { name: 'Liga PC ativa' });
    await user.selectOptions(select, 'standard');
    expect(onChange).toHaveBeenLastCalledWith({
      league: { id: 'standard', name: 'Standard', platform: 'pc' },
      manual: false,
    });
    expect(screen.getByText('Identificador: standard')).toBeInTheDocument();
  });

  it('permite optar por preços manuais', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(<LeagueSelector onChange={onChange} />);
    await user.click(await screen.findByRole('button', { name: 'Usar somente preços manuais' }));
    expect(onChange).toHaveBeenLastCalledWith({ league: null, manual: true });
  });
});
