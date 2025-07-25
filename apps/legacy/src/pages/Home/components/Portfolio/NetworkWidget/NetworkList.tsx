import { NetworkLogo } from '@/components/common/NetworkLogo';
import { useAccountsContext } from '@core/ui';
import { useAnalyticsContext } from '@core/ui';
import { useBalancesContext } from '@core/ui';
import { useBridgeContext } from '@core/ui';
import { useNetworkContext } from '@core/ui';
import { useSettingsContext } from '@core/ui';
import { useUnifiedBridgeContext } from '@core/ui';
import {
  AlertTriangleIcon,
  Badge,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  styled,
} from '@avalabs/core-k2-components';
import {
  caipToChainId,
  filterBridgeStateToNetwork,
  getAddressForChain,
} from '@core/common';
import { NetworkWithCaipId } from '@core/types';
import { useTranslation } from 'react-i18next';
import { NetworkCard } from './common/NetworkCard';
import { getNetworkBalance, tokensWithBalances } from './NetworksWidget';
import { SeeAllNetworksButton } from './SeeAllNetworksButton';

const LogoContainer = styled('div')`
  margin-top: 4px;
  margin-right: 16px;
`;

const NetworkListContainer = styled(Stack)`
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

export function NetworkList() {
  const { capture } = useAnalyticsContext();
  const { network, networks, setNetwork, favoriteNetworks, isCustomNetwork } =
    useNetworkContext();
  const { balances, isTokensCached } = useBalancesContext();
  const {
    accounts: { active: activeAccount },
  } = useAccountsContext();
  const { currencyFormatter } = useSettingsContext();
  const { t } = useTranslation();
  const { bridgeState } = useBridgeContext();
  const {
    state: { pendingTransfers: unifiedBridgeTxs },
  } = useUnifiedBridgeContext();

  function getNetworkValue(lookupNetwork: NetworkWithCaipId) {
    const networkAddress = getAddressForChain(lookupNetwork, activeAccount);
    const networkBalances = balances.tokens?.[lookupNetwork.chainId];
    const networkAssetList = networkBalances
      ? tokensWithBalances(Object.values(networkBalances[networkAddress] ?? {}))
      : null;
    return networkAssetList ? getNetworkBalance(networkAssetList) : 0;
  }

  const favoriteNetworksWithoutActive = favoriteNetworks
    .filter((networkItem) => networkItem.chainId !== network?.chainId)
    .filter((networkItem) => {
      const networkAddress = getAddressForChain(networkItem, activeAccount);
      return networkAddress !== '';
    }) // Only get networks that the active account supports
    .sort((a, b) => {
      const networkBalanceForA = getNetworkValue(a);
      const networkBalanceForB = getNetworkValue(b);
      return networkBalanceForB - networkBalanceForA;
    });

  // we don't know the network list yet. Lets show the placeholder tiles instead
  if (!networks.length) {
    return (
      <NetworkListContainer direction="row" justifyContent="space-between">
        <Skeleton variant="rounded" sx={{ height: 89, width: 164, mb: 2 }} />
        <Skeleton variant="rounded" sx={{ height: 89, width: 164, mb: 2 }} />
      </NetworkListContainer>
    );
  }

  return (
    <>
      <NetworkListContainer direction="row" justifyContent="space-between">
        {favoriteNetworksWithoutActive.map((favoriteNetwork) => {
          const { bridgeTransactions: legacyBridgeTxs } =
            filterBridgeStateToNetwork(bridgeState, favoriteNetwork);
          const filteredUnifiedBridgeTxs = Object.values(
            unifiedBridgeTxs,
          ).filter(({ sourceChain, targetChain }) => {
            return (
              caipToChainId(sourceChain.chainId) === favoriteNetwork.chainId ||
              caipToChainId(targetChain.chainId) === favoriteNetwork.chainId
            );
          });
          const bridgeTransactions = [
            ...Object.values(legacyBridgeTxs),
            ...filteredUnifiedBridgeTxs,
          ];
          const networkBalances = balances.tokens?.[favoriteNetwork.chainId];
          const networkBalance = getNetworkValue(favoriteNetwork);

          // show loading skeleton for each tile till we have the balance for them
          return !networkBalances ? (
            <Skeleton
              key={favoriteNetwork.chainId}
              variant="rounded"
              sx={{ height: 89, width: 164, mb: 2 }}
            />
          ) : (
            <NetworkCard
              data-testid={`network-card-${favoriteNetwork.chainId}-button`}
              key={favoriteNetwork.chainId}
              sx={{
                width: '164px',
                display: 'inline-block',
                mb: 2,
                p: 2,
              }}
              onClick={() => {
                capture('PortfolioSecondaryNetworkClicked', {
                  chainId: favoriteNetwork.chainId,
                });
                setNetwork(favoriteNetwork);
              }}
            >
              <Stack
                direction="row"
                justifyContent="center"
                alignItems="flex-start"
              >
                <LogoContainer>
                  <Badge
                    badgeContent={bridgeTransactions.length}
                    color="secondary"
                  >
                    <NetworkLogo
                      width="40px"
                      height="40px"
                      padding="8px"
                      src={favoriteNetwork.logoUri}
                      defaultSize={40}
                    />
                  </Badge>
                </LogoContainer>
                <Stack
                  justifyContent="center"
                  sx={{ width: '100%', minHeight: '51px' }}
                >
                  <Typography variant="body2" fontWeight="fontWeightSemibold">
                    {favoriteNetwork.chainName}
                  </Typography>
                  {!isCustomNetwork(favoriteNetwork.chainId) && (
                    <Stack sx={{ flexDirection: 'row', alignItems: 'center' }}>
                      {isTokensCached && (
                        <Tooltip
                          title={t('Balances loading...')}
                          placement="bottom"
                        >
                          <AlertTriangleIcon
                            size={12}
                            sx={{ color: 'warning.main', mr: 1 }}
                          />
                        </Tooltip>
                      )}
                      <Typography
                        data-testid={`network-card-${favoriteNetwork.chainId}-balance`}
                        size={14}
                        height="17px"
                      >
                        {currencyFormatter(networkBalance)}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Stack>
            </NetworkCard>
          );
        })}
        {networks.length && (
          <SeeAllNetworksButton
            isFullWidth={favoriteNetworksWithoutActive.length % 2 === 0}
          />
        )}
      </NetworkListContainer>
    </>
  );
}
