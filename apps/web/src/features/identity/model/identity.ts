export type IdentityUser = {
  uid: string;
  kind: 'anonymous' | 'google';
  email?: string;
  displayName?: string;
};

export interface AccountDeletionReceipt {
  status: 'pending';
  requestedAt: string;
  scheduledFor: string;
}

export type IdentityErrorState = {
  status: 'error';
  message: string;
  uid?: string;
  previousKind?: IdentityUser['kind'];
};

export type IdentityState =
  | { status: 'loading' }
  | ({ status: 'anonymous' } & IdentityUser)
  | ({ status: 'google' } & IdentityUser)
  | IdentityErrorState;

export function identityErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : '';
  switch (code) {
    case 'auth/popup-blocked':
      return 'O navegador bloqueou a janela do Google. Permita pop-ups e tente novamente.';
    case 'auth/credential-already-in-use':
    case 'auth/account-exists-with-different-credential':
      return 'Esta conta Google já está vinculada a outro usuário. Use outra conta.';
    case 'auth/network-request-failed':
      return 'Não foi possível conectar ao Firebase. Verifique a rede e tente novamente.';
    case 'auth/google-required':
      return 'Vincule uma conta Google antes de solicitar a exclusão.';
    case 'auth/requires-recent-login':
      return 'Confirme novamente sua identidade Google para continuar.';
    default:
      return error instanceof Error ? error.message : 'Não foi possível concluir a autenticação.';
  }
}
