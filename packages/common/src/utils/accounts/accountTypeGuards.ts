import {
  Account,
  AccountType,
  FireblocksAccount,
  ImportedAccount,
  PrimaryAccount,
  WalletConnectAccount,
} from '@core/types';

export const isFireblocksAccount = (
  account?: Account,
): account is FireblocksAccount => account?.type === AccountType.FIREBLOCKS;

export const isWalletConnectAccount = (
  account?: Account,
): account is WalletConnectAccount =>
  account?.type === AccountType.WALLET_CONNECT;

export const isPrimaryAccount = (
  account?: Pick<Account, 'type'>,
): account is PrimaryAccount => account?.type === AccountType.PRIMARY;

export const isImportedAccount = (
  account?: Account,
): account is ImportedAccount => Boolean(account) && !isPrimaryAccount(account);
