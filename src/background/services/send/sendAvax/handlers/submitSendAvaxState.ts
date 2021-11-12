import {
  ConnectionRequestHandler,
  ExtensionConnectionMessage,
  ExtensionRequest,
} from '@src/background/connections/models';
import { sendAvaxSubmit, wallet$ } from '@avalabs/wallet-react-components';
import { BN, Utils } from '@avalabs/avalanche-wallet-sdk';
import { gasPrice$ } from '../../../gas/gas';
import { firstValueFrom, lastValueFrom, tap } from 'rxjs';
import { sendTxDetails$ } from '../../events/sendTxDetailsEvent';
import { resolve } from '@src/utils/promiseResolver';

async function submitSendAvaxState(request: ExtensionConnectionMessage) {
  const params = request.params || [];
  const [amount, destinationChain, address, memo] = params;

  if (!amount) {
    return {
      ...request,
      error: 'no amount in params',
    };
  }

  if (!destinationChain) {
    return {
      ...request,
      error: 'no destinationChain in params',
    };
  }

  if (!address) {
    return {
      ...request,
      error: 'no address in params',
    };
  }

  return await resolve(
    lastValueFrom(
      sendAvaxSubmit(
        Utils.stringToBN(amount, 9),
        destinationChain,
        address,
        firstValueFrom(gasPrice$) as Promise<{ bn: BN }>,
        memo,
        firstValueFrom(wallet$)
      ).pipe(tap((value) => sendTxDetails$.next(value)))
    )
  ).then(([result, error]) => {
    return {
      ...request,
      result: result || undefined,
      error: error ? error?.message || error.toString() : undefined,
    };
  });
}

export const SubmitSendAvaxStateRequest: [
  ExtensionRequest,
  ConnectionRequestHandler
] = [ExtensionRequest.SEND_AVAX_SUBMIT, submitSendAvaxState];