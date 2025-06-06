import { Typography } from '@avalabs/core-k2-components';
import { useAccountsContext } from '@core/ui';
import { truncateAddress } from '@core/common';
import { useTranslation } from 'react-i18next';
import { useBlockchainNames } from '../../useBlockchainNames';
import { ActivityCardProp } from './ActivityCard';
import { TransactionType } from '@avalabs/vm-module-types';
import { useMemo } from 'react';
import { getAllAddressesForAccount } from '@core/common';

export function ActivityCardSummary({ historyItem }: ActivityCardProp) {
  const {
    accounts: { active: activeAccount },
  } = useAccountsContext();
  const { sourceBlockchain, targetBlockchain } =
    useBlockchainNames(historyItem);
  const { t } = useTranslation();
  const userAddresses = useMemo(
    () => (activeAccount ? getAllAddressesForAccount(activeAccount) : []),
    [activeAccount],
  );

  if (
    historyItem.txType === TransactionType.BRIDGE ||
    historyItem.bridgeAnalysis.isBridgeTx
  ) {
    return (
      <Typography
        variant="caption"
        sx={(theme) => ({ color: theme.palette.primary.dark })}
      >
        {sourceBlockchain ?? t('Unknown')} -&gt;{' '}
        {targetBlockchain ?? t('Unknown')}
      </Typography>
    );
  } else if (historyItem.txType === TransactionType.SWAP) {
    const sourceToken = historyItem.tokens.find(
      (token) =>
        token.from?.address && userAddresses.includes(token.from.address),
    );

    const targetToken = historyItem.tokens.find(
      (token) => token.to?.address && userAddresses.includes(token.to.address),
    );

    return (
      <Typography
        variant="caption"
        sx={(theme) => ({ color: theme.palette.primary.dark })}
      >
        {sourceToken?.symbol} -&gt; {targetToken?.symbol}
      </Typography>
    );
  }

  const txDirection = historyItem.isSender ? t('To') : t('From');
  const txAddress = historyItem.isSender ? historyItem.to : historyItem.from;

  return (
    <Typography
      variant="caption"
      sx={(theme) => ({ color: theme.palette.primary.dark })}
    >
      {txDirection}: {truncateAddress(txAddress)}
    </Typography>
  );
}
