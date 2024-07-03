import BN from 'bn.js';
import { stringToBN } from '@avalabs/utils-sdk';
import { useCallback, useState } from 'react';

import { TokenType } from '@src/background/services/balances/models';
import { SendErrorMessage } from '@src/utils/send/models';
import { DAppProviderRequest } from '@src/background/connections/dAppConnection/models';
import { useConnectionContext } from '@src/contexts/ConnectionProvider';
import type { EthSendTransactionHandler } from '@src/background/services/wallet/handlers/eth_sendTransaction';
import { EthSendTransactionParams } from '@src/background/services/wallet/handlers/eth_sendTransaction/models';

import {
  buildTx,
  isErc1155Send,
  isErc20Send,
  isErc721Send,
  isNativeSend,
} from '../../utils/buildSendTx';
import {
  Erc20SendOptions,
  NativeSendOptions,
  NftSendOptions,
  SendOptions,
} from '../../models';
import { SendAdapterEVM } from './models';

export const useEVMSend: SendAdapterEVM = ({
  chainId,
  from,
  provider,
  maxFee,
  nativeToken,
}) => {
  const { request } = useConnectionContext();

  const [isSending, setIsSending] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [maxAmount, setMaxAmount] = useState('0');
  const [error, setError] = useState<SendErrorMessage>();

  const getTx = useCallback(
    (options: SendOptions) => buildTx(from, provider, options),
    [from, provider]
  );

  const send = useCallback(
    async (options: SendOptions) => {
      try {
        setIsSending(true);

        const tx = await getTx(options);

        const hash = await request<
          EthSendTransactionHandler,
          DAppProviderRequest.ETH_SEND_TX,
          string
        >({
          method: DAppProviderRequest.ETH_SEND_TX,
          params: [
            {
              ...(tx as EthSendTransactionParams),
              chainId,
            },
          ],
        });

        return hash;
      } finally {
        setIsSending(false);
      }
    },
    [request, chainId, getTx]
  );

  const getGasLimit = useCallback(
    async (options: SendOptions): Promise<bigint> => {
      const tx = await getTx(options);

      return provider.estimateGas(tx);
    },
    [provider, getTx]
  );

  const validateErc721 = useCallback(
    ({ address }: NftSendOptions) => {
      if (!address) {
        setError(SendErrorMessage.ADDRESS_REQUIRED);
      } else if (nativeToken.balance.isZero()) {
        setError(SendErrorMessage.INSUFFICIENT_BALANCE_FOR_FEE);
      }
    },
    [nativeToken.balance]
  );

  const validateErc1155 = useCallback(
    ({ address, token }: NftSendOptions) => {
      if (!address) {
        setError(SendErrorMessage.ADDRESS_REQUIRED);
      } else if (token.balance.isZero()) {
        setError(SendErrorMessage.INSUFFICIENT_BALANCE);
      } else if (nativeToken.balance.isZero()) {
        setError(SendErrorMessage.INSUFFICIENT_BALANCE_FOR_FEE);
      }
    },
    [nativeToken.balance]
  );

  const validateNativeAndErc20 = useCallback(
    async ({
      address,
      token,
      amount,
    }: NativeSendOptions | Erc20SendOptions) => {
      // For ERC-20 and native tokens, we want to know the max. transfer amount
      // even if the validation as a whole fails (e.g. user did not provide
      // the target address yet).
      const amountBN = stringToBN(amount || '0', token.decimals);
      const gasLimit = await getGasLimit({
        address: address || from, // gas used for transfer will be the same no matter the target address
        amount: amount || '0', // the amount does not change the gas costs
        token,
      } as SendOptions);
      const totalFee = gasLimit * maxFee;
      const remainingBalance = BigInt(
        nativeToken.balance.sub(amountBN).toString()
      );
      const feeAsBn = new BN(totalFee.toString());

      if (token.type === TokenType.NATIVE) {
        setMaxAmount(nativeToken.balance.sub(feeAsBn).toString());

        if (remainingBalance < totalFee) {
          setError(SendErrorMessage.INSUFFICIENT_BALANCE_FOR_FEE);
          return;
        }
      } else if (token.type === TokenType.ERC20) {
        setMaxAmount(token.balance.toString());
      }

      if (!address) {
        setError(SendErrorMessage.ADDRESS_REQUIRED);
        return;
      }

      if (!amount) {
        setError(SendErrorMessage.AMOUNT_REQUIRED);
        return;
      }

      if (amountBN && (amountBN.isZero() || amountBN.isNeg())) {
        setError(SendErrorMessage.AMOUNT_REQUIRED);
        return;
      }

      if (amountBN && token.balance.lt(amountBN)) {
        setError(SendErrorMessage.INSUFFICIENT_BALANCE);
        return;
      }
    },
    [from, getGasLimit, maxFee, nativeToken.balance]
  );

  const validate = useCallback(
    async (options: SendOptions) => {
      const { token } = options;

      setIsValidating(true);
      setError(undefined);

      if (!token) {
        setError(SendErrorMessage.TOKEN_REQUIRED);
        return;
      }

      try {
        if (isErc721Send(options)) {
          validateErc721(options);
        } else if (isErc1155Send(options)) {
          validateErc1155(options);
        } else if (isNativeSend(options) || isErc20Send(options)) {
          await validateNativeAndErc20(
            options as NativeSendOptions | Erc20SendOptions
          );
        } else {
          setError(SendErrorMessage.UNSUPPORTED_TOKEN);
        }
      } catch (err: any) {
        if (!!err?.message && err?.message.includes('insufficient funds')) {
          setError(SendErrorMessage.INSUFFICIENT_BALANCE);
        } else {
          // We don't want to send those errors to Sentry,
          // as they'll likely include identifiable data (i.e. addresses).
          console.error(err);
          setError(SendErrorMessage.UNKNOWN_ERROR);
        }
      } finally {
        setIsValidating(false);
      }
    },
    [validateErc1155, validateErc721, validateNativeAndErc20]
  );

  return {
    error,
    isSending,
    isValid: !error,
    isValidating,
    maxAmount,
    send,
    validate,
  };
};