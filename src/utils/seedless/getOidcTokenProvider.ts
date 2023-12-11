import { SeedlessAuthProvider } from '@src/background/services/wallet/models';
import { authenticateWithGoogle } from './authenticateWithGoogle';
import { authenticateWithApple } from './authenticateWithApple';

export type OidcTokenGetter = () => Promise<string>;

const SUPPORTED_PROVIDERS: Record<SeedlessAuthProvider, OidcTokenGetter> = {
  [SeedlessAuthProvider.Google]: authenticateWithGoogle,
  [SeedlessAuthProvider.Apple]: authenticateWithApple,
};

export const getOidcTokenProvider = (
  authProvider?: SeedlessAuthProvider
): OidcTokenGetter | never => {
  if (!authProvider || !SUPPORTED_PROVIDERS[authProvider]) {
    throw new Error(`Unsupported provider: ${authProvider}`);
  }

  return SUPPORTED_PROVIDERS[authProvider];
};