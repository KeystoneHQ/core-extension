import {
  AvalancheColorIcon,
  BitcoinColorIcon,
  SolanaColorIcon,
} from '@avalabs/k2-alpine';
import { Account } from '@core/types';
import { History } from 'history';
import curry from 'lodash/curry';
import memoize from 'lodash/memoize';
import { ComponentType } from 'react';
import { IconBaseProps } from 'react-icons';
import { FixedXPChainIcon } from './components/AddressSelector/components/Icons';

export type AddressType = keyof {
  [AK in keyof Account as AK extends `address${infer VM}` ? VM : never]: AK;
};

type AddressLabelAndIcon = {
  label: string;
  Icon: ComponentType<IconBaseProps>;
};

export const getLabelAndIcon = memoize(
  (type: AddressType): AddressLabelAndIcon => {
    switch (type) {
      case 'C':
        return {
          label: 'Avalanche C-Chain / EVM',
          Icon: AvalancheColorIcon,
        };
      case 'AVM':
        return {
          label: 'Avalanche X/P-Chain',
          Icon: FixedXPChainIcon,
        };
      case 'BTC':
        return {
          label: 'Bitcoin',
          Icon: BitcoinColorIcon,
        };
      case 'SVM':
        return {
          label: 'Solana',
          Icon: SolanaColorIcon,
        };
      default:
        throw new Error(`Unsupported address type: ${type}`);
    }
  },
);

const SEARCH_PARAMS = {
  accountId: 'aid',
  addressType: 'at',
} as const;

const SUPPORTED_ADDRESSES: string[] = [
  'C',
  'AVM',
  'BTC',
  'SVM',
] satisfies AddressType[];

export const getNavigateToQRCode = curry(
  (
    navigate: History['push' | 'replace'],
    accountId: string,
    addressType: AddressType,
  ) =>
    () =>
      navigate({
        pathname: '/account-management/qr-code',
        search: new URLSearchParams({
          [SEARCH_PARAMS.accountId]: accountId,
          [SEARCH_PARAMS.addressType]: addressType,
        }).toString(),
      }),
);

type QRCodeSearchParams = {
  accountId: Account['id'] | undefined;
  addressType: AddressType | undefined;
};

export const getSearchParams = (search: string): QRCodeSearchParams => {
  const searchParams = new URLSearchParams(search);
  const accountId = searchParams.get(SEARCH_PARAMS.accountId) ?? undefined;
  const type = searchParams.get(SEARCH_PARAMS.addressType) as AddressType;

  return {
    accountId,
    addressType: SUPPORTED_ADDRESSES.includes(type) ? type : undefined,
  };
};
