import {
  Avalanche,
  BitcoinProvider,
  JsonRpcBatchInternal,
} from '@avalabs/wallets-sdk';
import { NetworkVMType } from '@avalabs/chains-sdk';
import { FetchRequest, Network as EthersNetwork } from 'ethers';

import { Network } from '@src/background/services/network/models';

import { addGlacierAPIKeyIfNeeded } from './addGlacierAPIKeyIfNeeded';

export const getProviderForNetwork = (
  network: Network,
  useMulticall = false
): BitcoinProvider | JsonRpcBatchInternal | Avalanche.JsonRpcProvider => {
  if (network.vmName === NetworkVMType.BITCOIN) {
    return new BitcoinProvider(
      !network.isTestnet,
      undefined,
      `${process.env.PROXY_URL}/proxy/nownodes/${
        network.isTestnet ? 'btcbook-testnet' : 'btcbook'
      }`,
      `${process.env.PROXY_URL}/proxy/nownodes/${
        network.isTestnet ? 'btc-testnet' : 'btc'
      }`,
      process.env.GLACIER_API_KEY ? { token: process.env.GLACIER_API_KEY } : {}
    );
  } else if (network.vmName === NetworkVMType.EVM) {
    const fetchConfig = new FetchRequest(
      addGlacierAPIKeyIfNeeded(network.rpcUrl)
    );

    if (network.customRpcHeaders) {
      const headers = Object.entries(network.customRpcHeaders);

      for (const [name, value] of headers) {
        fetchConfig.setHeader(name, value);
      }
    }

    const provider = new JsonRpcBatchInternal(
      useMulticall
        ? {
            maxCalls: 40,
            multiContractAddress: network.utilityAddresses?.multicall,
          }
        : 40,
      fetchConfig,
      new EthersNetwork(network.chainName, network.chainId)
    );

    provider.pollingInterval = 2000;

    return provider;
  } else if (
    network.vmName === NetworkVMType.AVM ||
    network.vmName === NetworkVMType.PVM
  ) {
    return network.isTestnet
      ? Avalanche.JsonRpcProvider.getDefaultFujiProvider()
      : Avalanche.JsonRpcProvider.getDefaultMainnetProvider();
  } else {
    throw new Error('unsupported network');
  }
};