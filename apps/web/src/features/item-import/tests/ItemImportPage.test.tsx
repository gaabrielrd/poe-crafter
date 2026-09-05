import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ItemImportPage } from '../components/ItemImportPage';
import { renderWithProviders } from '@/test/render';

describe('ItemImportPage', () => {
  it('mostra erro acionável para texto vazio', () => {
    renderWithProviders(<ItemImportPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Interpretar item' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Cole o texto de um item');
  });

  it('mostra o alvo reconhecido e alerta item level ausente', () => {
    renderWithProviders(<ItemImportPage />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Texto do item' }), {
      target: { value: 'New Item\nDivine Crown\nArmour: 10\nLevelReq: 84' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Interpretar item' }));
    expect(screen.getByRole('heading', { name: 'Divine Crown' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('item level não foi encontrado');
  });

  it('mostra um item completo pronto para confirmação', () => {
    renderWithProviders(<ItemImportPage />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Texto do item' }), {
      target: {
        value:
          'New Item\nDivine Crown\nItemLevel: 86\nSearing Exarch Item\nPrefix: {range:0.2}IncreasedLife9\nImplicits: 1\n10% increased Cast Speed\n+100 to maximum Life',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Interpretar item' }));
    expect(screen.getByRole('heading', { name: 'Divine Crown' })).toBeInTheDocument();
    expect(screen.getByText('searing-exarch')).toBeInTheDocument();
    expect(screen.getByText('10% increased Cast Speed')).toBeInTheDocument();
    expect(
      screen.getByText('1 implícitos · 1 explícitos · 1 prefixes · 0 suffixes'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
