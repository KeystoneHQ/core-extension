import { useCallback } from 'react';
import { SolanaCaip2ChainId } from '@avalabs/core-chains-sdk';

import { ExtensionRequest } from '@core/types';
import { GetNativeBalanceHandler } from '@core/service-worker';
import { useConnectionContext } from '../contexts';

export function useGetSolBalance() {
  const { request } = useConnectionContext();

  const getSolBalance = useCallback(
    async (address: string) =>
      request<GetNativeBalanceHandler>({
        method: ExtensionRequest.BALANCE_NATIVE_GET,
        params: [address, SolanaCaip2ChainId.MAINNET],
      }),
    [request],
  );

  return {
    getSolBalance,
  };
}
