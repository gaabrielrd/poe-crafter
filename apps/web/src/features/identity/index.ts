export { IdentityStatus } from './components/IdentityStatus';
export { IdentityProvider } from './providers/IdentityProvider';
export { useIdentity } from './providers/useIdentity';
export {
  createFixtureAuthGateway,
  createMissingConfigurationAuthGateway,
  getDefaultAuthGateway,
  getFirebaseApp,
  type AuthGateway,
} from './services/auth';
export type { IdentityState, IdentityUser } from './model/identity';
