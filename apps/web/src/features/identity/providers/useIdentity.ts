import { useContext } from 'react';
import { IdentityContext } from './identity-context';

export function useIdentity() {
  const context = useContext(IdentityContext);
  if (!context) throw new Error('useIdentity deve ser usado dentro de IdentityProvider.');
  return context;
}
