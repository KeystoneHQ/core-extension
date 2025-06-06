import {
  CircularProgress,
  Dialog,
  DialogContent,
  Typography,
} from '@avalabs/core-k2-components';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAccountsContext } from '@core/ui';
import { useConnectionContext } from '@core/ui';
import { useNetworkContext } from '@core/ui';
import { useWalletContext } from '@core/ui';
import { useSeedlessAuthPromptState } from '@core/ui';
import { isSolanaNetwork } from '@core/common';
import type { DeriveMissingKeysHandler } from '@core/service-worker';
import { ExtensionRequest, SecretType } from '@core/types';

export const SeedlessUpdatingAccountDialog = () => {
  const { t } = useTranslation();
  const { request } = useConnectionContext();
  const { walletDetails } = useWalletContext();
  const { isAuthPromptVisible } = useSeedlessAuthPromptState();
  const {
    accounts: { primary },
  } = useAccountsContext();
  const { network } = useNetworkContext();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const hasMissingAddresses = useMemo(() => {
    // Make sure not to render the dialog for non-Seedless wallets
    // and also when user is first asked to re-authenticate.
    if (
      !walletDetails ||
      walletDetails.type !== SecretType.Seedless ||
      !primary ||
      !network ||
      isAuthPromptVisible
    ) {
      return false;
    }

    // When we detect some of the addresses are missing, we try to derive them.
    const accounts = primary[walletDetails.id] ?? [];
    return accounts.some((acc) => !acc.addressSVM); // Currently only do it for Solana
  }, [primary, isAuthPromptVisible, network, walletDetails]);

  const deriveMissingKeys = useCallback(
    async (walletId: string) =>
      request<DeriveMissingKeysHandler>({
        method: ExtensionRequest.SEEDLESS_DERIVE_MISSING_KEYS,
        params: {
          walletId,
        },
      }),
    [request],
  );

  useEffect(() => {
    if (!hasMissingAddresses || !walletDetails?.id) {
      return;
    }

    setIsDialogOpen(true);
    deriveMissingKeys(walletDetails.id)
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        setIsDialogOpen(false);
      });
  }, [deriveMissingKeys, hasMissingAddresses, walletDetails?.id]);

  if (!hasMissingAddresses) {
    return null;
  }

  return (
    <Dialog
      onClose={() => setIsDialogOpen(false)}
      open={isDialogOpen && isSolanaNetwork(network)} // If user is not on Solana, don't show anything.
      PaperProps={{
        sx: { m: 2 },
      }}
      sx={{ textAlign: 'center' }}
    >
      <DialogContent>
        <CircularProgress size={40} />
        <Typography variant="body2">
          {t("We're generating the missing addresses for you.")}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t('Feel free to close this window.')}
        </Typography>
      </DialogContent>
    </Dialog>
  );
};
