import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk';
import { Network, NetworkVMType } from '@avalabs/vm-module-types';
import { NetworkFee, NetworkWithCaipId } from '@core/types';
import { getProviderForNetwork } from '@core/common';
import { singleton } from 'tsyringe';
import { ModuleManager } from '~/vmModules/ModuleManager';

@singleton()
export class NetworkFeeService {
  constructor(private moduleManager: ModuleManager) {}

  async getNetworkFee(network: NetworkWithCaipId): Promise<NetworkFee | null> {
    const module = await this.moduleManager.loadModuleByNetwork(network);
    const fees = await module.getNetworkFee(network as Network); // TODO: Remove this cast after SVM network type appears in vm-module-types
    return {
      ...fees,
      displayDecimals: fees.displayDecimals ?? 0,
    };
  }

  async estimateGasLimit(
    from: string,
    to: string,
    data: string,
    network: NetworkWithCaipId,
    value?: bigint,
  ): Promise<number | null> {
    if (network.vmName !== NetworkVMType.EVM) {
      return null;
    }

    const provider = await getProviderForNetwork(network);
    const nonce = await (provider as JsonRpcBatchInternal).getTransactionCount(
      from,
    );

    return Number(
      await (provider as JsonRpcBatchInternal).estimateGas({
        from: from,
        nonce: nonce,
        to: to,
        data: data,
        value,
      }),
    );
  }
}
