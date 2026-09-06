import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ItemImportPage } from '../components/ItemImportPage';
import { renderWithProviders } from '@/test/render';

async function chooseStandardLeague(user: ReturnType<typeof renderWithProviders>['user']) {
  const league = await screen.findByRole('combobox', { name: 'Liga PC ativa' });
  await user.selectOptions(league, 'standard');
}

describe('ItemImportPage', () => {
  it('mostra erro acionável para texto vazio', async () => {
    const { user } = renderWithProviders(<ItemImportPage />);
    await chooseStandardLeague(user);
    fireEvent.click(screen.getByRole('button', { name: 'Interpretar item' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Cole o texto de um item');
  });

  it('mostra o alvo reconhecido e alerta item level ausente', async () => {
    const { user } = renderWithProviders(<ItemImportPage />);
    await chooseStandardLeague(user);
    fireEvent.change(screen.getByRole('textbox', { name: 'Texto do item' }), {
      target: { value: 'New Item\nDivine Crown\nArmour: 10\nLevelReq: 84' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Interpretar item' }));
    expect(screen.getByRole('heading', { name: 'Divine Crown' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('item level não foi encontrado');
  });

  it('mostra um item completo pronto para confirmação', async () => {
    const { user } = renderWithProviders(<ItemImportPage />);
    await chooseStandardLeague(user);
    fireEvent.change(screen.getByRole('textbox', { name: 'Texto do item' }), {
      target: {
        value:
          'New Item\nDivine Crown\nItemLevel: 86\nSearing Exarch Item\nPrefix: {range:0.2}IncreasedLife9\nImplicits: 1\n10% increased Cast Speed\n+100 to maximum Life',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Interpretar item' }));
    expect(screen.getByRole('heading', { name: 'Divine Crown' })).toBeInTheDocument();
    expect(screen.getAllByText('searing-exarch')).toHaveLength(2);
    expect(screen.getByText('10% increased Cast Speed')).toBeInTheDocument();
    expect(
      screen.getByText('1 implícitos · 1 explícitos · 1 prefixes · 0 suffixes'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('exige a classificação de todos os modificadores antes de confirmar', async () => {
    const { user } = renderWithProviders(<ItemImportPage />);
    await chooseStandardLeague(user);
    fireEvent.change(screen.getByRole('textbox', { name: 'Texto do item' }), {
      target: {
        value:
          'New Item\nDivine Crown\nItemLevel: 86\nPrefix: IncreasedLife9\nImplicits: 0\n+100 to maximum Life',
      },
    });
    await user.click(screen.getByRole('button', { name: 'Interpretar item' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar alvo' }));
    expect(screen.getAllByRole('alert').at(-1)).toHaveTextContent('Required, Optional ou Ignore');

    const classifications = screen.getAllByLabelText('Classificação');
    await user.selectOptions(classifications[0]!, 'required');
    await user.selectOptions(classifications[1]!, 'optional');
    await user.click(screen.getByRole('button', { name: 'Confirmar alvo' }));
    expect(screen.getByText('Alvo confirmado.')).toBeInTheDocument();
  });

  it('permite informar item level ausente na confirmação', async () => {
    const { user } = renderWithProviders(<ItemImportPage />);
    await chooseStandardLeague(user);
    fireEvent.change(screen.getByRole('textbox', { name: 'Texto do item' }), {
      target: { value: 'New Item\nDivine Crown\nLevelReq: 84' },
    });
    await user.click(screen.getByRole('button', { name: 'Interpretar item' }));
    await user.clear(screen.getByLabelText('Item level'));
    await user.type(screen.getByLabelText('Item level'), '86');
    await user.click(screen.getByRole('button', { name: 'Confirmar alvo' }));
    expect(screen.getByText('Alvo confirmado.')).toBeInTheDocument();
  });

  it('permite corrigir campos e propriedades especiais reconhecidas', async () => {
    const { user } = renderWithProviders(<ItemImportPage />);
    await chooseStandardLeague(user);
    fireEvent.change(screen.getByRole('textbox', { name: 'Texto do item' }), {
      target: {
        value:
          'New Item\nDivine Crown\nRarity: Rare\nItemLevel: 86\nArmour: 100\nArmourBasePercentile: 0.8\nEnergy Shield: 200\nEnergyShieldBasePercentile: 0.9\nSearing Exarch Item\nEater of Worlds Item\nCrafted: true\nCatalystQuality: 10\nQuality: 20\nSockets: B-B-B\nLevelReq: 84\nImplicits: 1\n10% increased Cast Speed\n+100 to maximum Life\nPrefix: IncreasedLife9\nSuffix: LightningResist8',
      },
    });
    await user.click(screen.getByRole('button', { name: 'Interpretar item' }));
    await user.clear(screen.getByLabelText('Nome da base'));
    await user.type(screen.getByLabelText('Nome da base'), 'Hubris Circlet');
    await user.clear(screen.getByLabelText('Armour'));
    await user.type(screen.getByLabelText('Armour'), '120');
    await user.clear(screen.getByLabelText('Percentil base de Armour'));
    await user.type(screen.getByLabelText('Percentil base de Armour'), '0.9');
    await user.clear(screen.getByLabelText('Energy Shield'));
    await user.type(screen.getByLabelText('Energy Shield'), '220');
    await user.clear(screen.getByLabelText('Percentil base de Energy Shield'));
    await user.type(screen.getByLabelText('Percentil base de Energy Shield'), '0.95');
    await user.clear(screen.getByLabelText('Nível requerido'));
    await user.type(screen.getByLabelText('Nível requerido'), '85');
    await user.clear(screen.getByLabelText('Raridade'));
    await user.type(screen.getByLabelText('Raridade'), 'Unique');
    await user.clear(screen.getByLabelText('Qualidade'));
    await user.type(screen.getByLabelText('Qualidade'), '21');
    await user.clear(screen.getByLabelText('Qualidade de catalyst'));
    await user.type(screen.getByLabelText('Qualidade de catalyst'), '11');
    await user.clear(screen.getByLabelText('Sockets'));
    await user.type(screen.getByLabelText('Sockets'), 'B-B-B-B');
    await user.click(screen.getByLabelText('Item crafted'));
    await user.click(screen.getByLabelText('eater-of-worlds'));
    const classifications = screen.getAllByLabelText('Classificação');
    await user.clear(screen.getByLabelText('Implícito 1'));
    await user.type(screen.getByLabelText('Implícito 1'), '12% increased Cast Speed');
    for (const classification of classifications) {
      await user.selectOptions(classification, 'ignore');
    }
    await user.click(screen.getByRole('button', { name: 'Confirmar alvo' }));
    expect(screen.getByText('Alvo confirmado.')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Hubris Circlet')).toBeInTheDocument();
  });

  it('mostra erro no campo numérico e mantém linhas não reconhecidas visíveis', async () => {
    const { user } = renderWithProviders(<ItemImportPage />);
    await chooseStandardLeague(user);
    fireEvent.change(screen.getByRole('textbox', { name: 'Texto do item' }), {
      target: {
        value: 'New Item\nDivine Crown\nItemLevel: 86\nArmour: 100\nLinha desconhecida',
      },
    });
    await user.click(screen.getByRole('button', { name: 'Interpretar item' }));
    expect(screen.getByText('Existem linhas não reconhecidas')).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Armour'));
    await user.type(screen.getByLabelText('Armour'), '-1');
    await user.click(screen.getByRole('button', { name: 'Confirmar alvo' }));
    expect(screen.getAllByText('Informe um número válido.')[0]).toBeInTheDocument();
    expect(screen.getByText('Linha desconhecida')).toBeInTheDocument();
  });
});
