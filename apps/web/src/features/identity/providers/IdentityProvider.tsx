import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { identityErrorMessage, type IdentityState } from '../model/identity';
import { getDefaultAuthGateway, type AuthGateway } from '../services/auth';
import { IdentityContext } from './identity-context';

export function IdentityProvider({
  children,
  gateway,
}: {
  children: ReactNode;
  gateway?: AuthGateway;
}) {
  const resolvedGateway = useMemo(() => gateway ?? getDefaultAuthGateway(), [gateway]);
  const [state, setState] = useState<IdentityState>({ status: 'loading' });
  const [linking, setLinking] = useState(false);
  const [reauthenticating, setReauthenticating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const unsubscribe = resolvedGateway.watch((user) => {
      setState(user ? { ...user, status: user.kind } : { status: 'loading' });
    });
    void resolvedGateway.ensureAnonymous().catch((error: unknown) => {
      setState({ status: 'error', message: identityErrorMessage(error) });
    });
    return unsubscribe;
  }, [resolvedGateway]);

  const linkGoogle = useCallback(async () => {
    setLinking(true);
    try {
      const user = await resolvedGateway.linkGoogle();
      setState({ ...user, status: user.kind });
    } catch (error: unknown) {
      setState((current) => ({
        status: 'error',
        message: identityErrorMessage(error),
        uid: 'uid' in current ? current.uid : undefined,
        previousKind:
          current.status === 'anonymous' || current.status === 'google' ? current.kind : undefined,
      }));
    } finally {
      setLinking(false);
    }
  }, [resolvedGateway]);

  const reauthenticateGoogle = useCallback(async () => {
    setReauthenticating(true);
    try {
      await resolvedGateway.reauthenticateGoogle();
    } finally {
      setReauthenticating(false);
    }
  }, [resolvedGateway]);

  const requestAccountDeletion = useCallback(async () => {
    setDeleting(true);
    try {
      return await resolvedGateway.requestAccountDeletion();
    } finally {
      setDeleting(false);
    }
  }, [resolvedGateway]);

  const value = useMemo(
    () => ({
      state,
      linking,
      linkGoogle,
      reauthenticating,
      deleting,
      reauthenticateGoogle,
      requestAccountDeletion,
    }),
    [
      deleting,
      linkGoogle,
      linking,
      reauthenticateGoogle,
      reauthenticating,
      requestAccountDeletion,
      state,
    ],
  );
  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}
