import { createContext } from 'react';
import type { IdentityState } from '../model/identity';

export type IdentityContextValue = {
  state: IdentityState;
  linking: boolean;
  linkGoogle: () => Promise<void>;
};

export const IdentityContext = createContext<IdentityContextValue | undefined>(undefined);
