import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { IdentityProvider, useIdentity, createFixtureAuthGateway } from '@/features/identity';
import { renderWithProviders } from '@/test/render';
import {
  createMissingConfigurationAuthGateway,
  getDefaultAuthGateway,
  type AuthGateway,
} from '../services/auth';
import { IdentityStatus } from '../components/IdentityStatus';
import { identityErrorMessage } from '../model/identity';

function Harness() {
  const identity = useIdentity();
  return (
    <IdentityStatus
      state={identity.state}
      linking={identity.linking}
      onLinkGoogle={() => void identity.linkGoogle()}
    />
  );
}

function gatewayThatFails(code: string): AuthGateway {
  return {
    watch(listener) {
      listener({ uid: 'uid-1', kind: 'anonymous' });
      return () => undefined;
    },
    ensureAnonymous: () => Promise.resolve(),
    linkGoogle: () => {
      throw Object.assign(new Error('failed'), { code });
    },
    getIdToken: () => Promise.resolve('token'),
    getCurrentUser: () => ({ uid: 'uid-1', kind: 'anonymous' }),
  };
}

describe('identidade', () => {
  it('normaliza erros recuperáveis do Firebase', () => {
    expect(identityErrorMessage({ code: 'auth/credential-already-in-use' })).toMatch(
      /já está vinculada/i,
    );
    expect(identityErrorMessage({ code: 'auth/account-exists-with-different-credential' })).toMatch(
      /já está vinculada/i,
    );
    expect(identityErrorMessage({ code: 'auth/network-request-failed' })).toMatch(/rede/i);
    expect(identityErrorMessage({ code: 'auth/unknown' })).toMatch(/autenticação/i);
  });

  it('fixture preserva a sessão anônima e promove o mesmo UID', async () => {
    const gateway = createFixtureAuthGateway();
    let observed: string | undefined;
    const unsubscribe = gateway.watch((user) => {
      observed = user?.uid;
    });
    await gateway.ensureAnonymous();
    const linked = await gateway.linkGoogle();
    unsubscribe();
    expect(observed).toBe('fixture-anonymous-uid');
    expect(linked).toMatchObject({ uid: 'fixture-anonymous-uid', kind: 'google' });
    expect(await gateway.getIdToken()).toBe('fixture-token');
    expect(gateway.getCurrentUser()).toMatchObject({ uid: 'fixture-anonymous-uid' });
  });

  it('expõe erro recuperável quando a configuração pública está ausente', async () => {
    const gateway = createMissingConfigurationAuthGateway();
    const unsubscribe = gateway.watch(() => undefined);
    unsubscribe();
    await expect(gateway.ensureAnonymous()).rejects.toThrow(/Firebase|configuration-not-found/);
    await expect(gateway.linkGoogle()).rejects.toThrow(/Firebase|inicializando/);
    await expect(gateway.getIdToken()).rejects.toThrow(/Firebase|inicializando|Configure/);
    expect(gateway.getCurrentUser()).toBeNull();
  });

  it('seleciona o gateway Firebase configurado sem recriar a instância', () => {
    const first = getDefaultAuthGateway();
    expect(getDefaultAuthGateway()).toBe(first);
  });

  it('inicia sessão anônima e vincula Google preservando o UID', async () => {
    let current: { uid: string; kind: 'anonymous' | 'google'; email?: string } = {
      uid: 'uid-1',
      kind: 'anonymous',
    };
    const gateway: AuthGateway = {
      watch(listener) {
        listener(current);
        return () => undefined;
      },
      ensureAnonymous: () => Promise.resolve(),
      linkGoogle: () => {
        current = { uid: 'uid-1', kind: 'google', email: 'a@b.com' };
        return Promise.resolve(current);
      },
      getIdToken: () => Promise.resolve('token'),
      getCurrentUser: () => current,
    };
    const { user } = renderWithProviders(
      <IdentityProvider gateway={gateway}>
        <Harness />
      </IdentityProvider>,
    );

    expect(await screen.findByText('Sessão anônima')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Vincular Google' }));
    expect(await screen.findByText('Google conectado')).toBeInTheDocument();
    expect(screen.getByText('a@b.com')).toBeInTheDocument();
  });

  it('mostra mensagens acionáveis para popup bloqueado e mantém a opção de tentar', async () => {
    const { user } = renderWithProviders(
      <IdentityProvider gateway={gatewayThatFails('auth/popup-blocked')}>
        <Harness />
      </IdentityProvider>,
    );
    await user.click(await screen.findByRole('button', { name: 'Vincular Google' }));
    expect(await screen.findByText(/bloqueou a janela/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
  });
});
