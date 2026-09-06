import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { IdentityProvider, createFixtureAuthGateway, type AuthGateway } from '@/features/identity';
import { renderWithProviders } from '@/test/render';
import { SettingsPage } from '../components/SettingsPage';

async function renderGoogleSettings(gateway: AuthGateway = createFixtureAuthGateway()) {
  await gateway.linkGoogle();
  const result = renderWithProviders(
    <IdentityProvider gateway={gateway}>
      <SettingsPage />
    </IdentityProvider>,
  );
  await screen.findByRole('heading', { name: 'Identidade Google' });
  return result;
}

describe('SettingsPage', () => {
  it('orienta uma sessão anônima a vincular Google e não expõe exclusão', async () => {
    renderWithProviders(
      <IdentityProvider gateway={createFixtureAuthGateway()}>
        <SettingsPage />
      </IdentityProvider>,
    );

    expect(await screen.findByText('Vincule sua conta Google primeiro')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Solicitar exclusão' })).not.toBeInTheDocument();
  });

  it('exige EXCLUIR, reautentica e mostra o prazo sem afirmar que já apagou', async () => {
    const { user } = await renderGoogleSettings();

    await user.click(screen.getByRole('button', { name: 'Solicitar exclusão' }));
    const confirmation = screen.getByLabelText('Confirmação');
    const submit = screen.getByRole('button', { name: 'Confirmar exclusão' });
    expect(submit).toBeDisabled();
    await user.type(confirmation, 'EXCLUIR');
    expect(submit).toBeEnabled();
    await user.click(submit);

    expect(await screen.findByText('Exclusão agendada')).toBeInTheDocument();
    expect(
      screen.getByText(/não afirma que a conta ou os dados já foram apagados/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/7 de setembro de 2026/i)).toBeInTheDocument();
  });

  it('mantém a confirmação visível quando a reautenticação falha', async () => {
    const base = createFixtureAuthGateway();
    await base.linkGoogle();
    const gateway: AuthGateway = {
      watch: base.watch.bind(base),
      ensureAnonymous: base.ensureAnonymous.bind(base),
      linkGoogle: base.linkGoogle.bind(base),
      reauthenticateGoogle: () => Promise.reject(new Error('Google exige uma nova confirmação.')),
      requestAccountDeletion: base.requestAccountDeletion.bind(base),
      getIdToken: base.getIdToken.bind(base),
      getCurrentUser: base.getCurrentUser.bind(base),
    };
    const { user } = await renderGoogleSettings(gateway);

    await user.click(screen.getByRole('button', { name: 'Solicitar exclusão' }));
    await user.type(screen.getByLabelText('Confirmação'), 'EXCLUIR');
    await user.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));

    expect(await screen.findByText('Google exige uma nova confirmação.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar exclusão' })).toBeInTheDocument();
  });
});
