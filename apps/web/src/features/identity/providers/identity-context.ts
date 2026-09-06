import { createContext } from 'react';
import type { AccountDeletionReceipt, IdentityState } from '../model/identity';

export type IdentityContextValue = {
  state: IdentityState;
  linking: boolean;
  linkGoogle: () => Promise<void>;
  reauthenticating: boolean;
  deleting: boolean;
  reauthenticateGoogle: () => Promise<void>;
  requestAccountDeletion: () => Promise<AccountDeletionReceipt>;
};

export const IdentityContext = createContext<IdentityContextValue | undefined>(undefined);
