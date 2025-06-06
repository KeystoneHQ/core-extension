import { useMemo } from 'react';

import {
  WalletTotalBalanceState,
  useWalletTotalBalanceContext,
} from '../contexts/WalletTotalBalanceProvider';

export const useWalletTotalBalance = (walletId?: string) => {
  const { walletBalances } = useWalletTotalBalanceContext();

  return useMemo(
    (): WalletTotalBalanceState =>
      (walletId && walletBalances[walletId]) || {
        isLoading: false,
        hasErrorOccurred: false,
      },
    [walletBalances, walletId],
  );
};
