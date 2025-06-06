import { Blockchain, usePriceForChain } from '@avalabs/core-bridge-sdk';
import { Chain } from '@avalabs/bridge-unified';
import { useMemo } from 'react';
import { caipToChainId, networkToBlockchain } from '@core/common';
import { useNetworkContext } from '../contexts';

export const useBridgeNetworkPrice = (chain?: Blockchain | Chain) => {
  const { networks } = useNetworkContext();

  const blockchain = useMemo(() => {
    // Standardize input to Blockchain type
    if (!chain) {
      return undefined;
    }

    if (typeof chain === 'object') {
      const network = networks.find(
        ({ chainId }) => chainId === caipToChainId(chain.chainId),
      );

      if (!network) {
        return undefined;
      }

      return networkToBlockchain(network);
    }

    return chain;
  }, [chain, networks]);

  return usePriceForChain(blockchain);
};
