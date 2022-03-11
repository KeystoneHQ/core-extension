import { useCallback, useEffect, useState } from 'react';
import {
  toast,
  ComponentSize,
  PrimaryButton,
  Tooltip,
  Typography,
  VerticalFlex,
  TransactionToastType,
  TransactionToast,
  LoadingSpinnerIcon,
  WarningIcon,
  Card,
  HorizontalFlex,
} from '@avalabs/react-components';
import { Contact } from '@src/background/services/contacts/models';
import { Redirect, Route, Switch, useHistory } from 'react-router-dom';
import { getTransactionLink } from '@avalabs/wallet-react-components';
import { GasPrice } from '@src/background/services/gas/models';
import { PageTitleMiniMode } from '@src/components/common/PageTitle';
import { useIsMainnet } from '@src/hooks/useIsMainnet';
import { useTheme } from 'styled-components';
import { useWalletContext } from '@src/contexts/WalletProvider';
import { GasFeeModifier } from '@src/components/common/CustomFees';
import { useCollectibleFromParams } from './hooks/useCollectibleFromParams';
import { ContactInput } from '../Send/components/ContactInput';
import { useSetCollectibleParams } from './hooks/useSetCollectibleParams';
import { CollectibleMedia } from './components/CollectibleMedia';
import { useContactFromParams } from '../Send/hooks/useContactFromParams';
import { TxInProgress } from '@src/components/common/TxInProgress';
import { CollectibleSendConfirm } from './components/CollectibleSendConfirm';
import { BN, bnToLocaleString } from '@avalabs/avalanche-wallet-sdk';
import { useSendNft } from '../Send/hooks/useSendNft';

export function CollectibleSend() {
  const theme = useTheme();
  const [isContactsOpen, setIsContactsOpen] = useState(false);
  const { avaxToken, walletType } = useWalletContext();
  const { nft, tokenId } = useCollectibleFromParams();
  const contactInput = useContactFromParams();
  const setCollectibleParams = useSetCollectibleParams();
  const sendState = useSendNft(nft?.contractAddress || '', Number(tokenId));
  const history = useHistory();

  const setSendState = sendState.setValues;

  const [defaultGasPrice, setDefaultGasPrice] = useState<GasPrice>();
  const [selectedGasFee, setSelectedGasFee] = useState<GasFeeModifier>();

  const [showTxInProgress, setShowTxInProgress] = useState(false);
  const [gasPriceState, setGasPrice] = useState<GasPrice>();

  const isMainnet = useIsMainnet();

  useEffect(() => {
    if (!defaultGasPrice && sendState.gasPrice) {
      setDefaultGasPrice({
        bn: sendState.gasPrice,
        value: sendState.gasPrice.toString(),
      });
    }
  }, [defaultGasPrice, sendState.gasPrice]);

  const onContactChanged = (contact: Contact) => {
    setCollectibleParams({
      nft: nft,
      tokenId,
      address: contact.address,
      options: { replace: true },
    });
    setSendState({
      address: contact.address,
    });
  };

  const maxGasPrice = avaxToken.balance.toString();

  const onGasChanged = useCallback(
    (gasLimit: string, gasPrice: GasPrice, feeType: GasFeeModifier) => {
      setGasPrice(gasPrice);
      setSendState({
        address: contactInput?.address,
        gasLimit: Number(gasLimit),
        gasPrice,
      });
      setSelectedGasFee(feeType);
    },
    [contactInput?.address, setSendState]
  );

  const onSubmit = () => {
    setShowTxInProgress(true);
    if (!sendState.canSubmit) return;

    let toastId: string;
    if (walletType !== 'ledger') {
      history.push('/home');
      toastId = toast.custom(
        <TransactionToast
          type={TransactionToastType.PENDING}
          text="Transaction pending..."
          startIcon={
            <LoadingSpinnerIcon height="16px" color={theme.colors.icon1} />
          }
        />
      );
    }

    sendState
      .submit()
      .then((txId) => {
        sendState.reset();
        toast.custom(
          <TransactionToast
            status="Transaction Successful"
            type={TransactionToastType.SUCCESS}
            text="View in Explorer"
            href={txId ? getTransactionLink(txId, isMainnet) : ''}
          />,
          { id: toastId }
        );
        history.push('/home');
      })
      .catch(() => {
        toast.custom(
          <TransactionToast
            type={TransactionToastType.ERROR}
            text="Transaction Failed"
            startIcon={<WarningIcon height="20px" color={theme.colors.icon1} />}
          />,
          { id: toastId, duration: Infinity }
        );
      })
      .finally(() => {
        setShowTxInProgress(false);
        if (walletType === 'ledger') history.push('/home');
      });
  };

  const nftItem = nft?.nftData.find((item) => item.tokenId === tokenId);
  if (!nft || !tokenId || !nftItem) {
    return <Redirect to={'/'} />;
  }

  return (
    <Switch>
      <Route path="/collectible/send/confirm">
        <>
          {showTxInProgress && (
            <TxInProgress
              address={sendState?.contractAddress}
              nftName={nftItem.externalData.name}
              fee={bnToLocaleString(sendState?.sendFee || new BN(0), 18)}
            />
          )}
          <CollectibleSendConfirm
            sendState={sendState}
            contact={contactInput as Contact}
            nft={nft}
            tokenId={tokenId}
            onSubmit={onSubmit}
            onGasChanged={onGasChanged}
            maxGasPrice={maxGasPrice}
            gasPrice={gasPriceState}
            defaultGasPrice={defaultGasPrice}
            selectedGasFee={selectedGasFee}
          />
        </>
      </Route>
      <Route path="/collectible/send">
        <VerticalFlex height="100%" width="100%">
          <PageTitleMiniMode>Send</PageTitleMiniMode>
          <VerticalFlex grow="1" align="center" width="100%" paddingTop="8px">
            <ContactInput
              contact={contactInput}
              onChange={onContactChanged}
              isContactsOpen={isContactsOpen}
              toggleContactsDropdown={(to?: boolean) =>
                setIsContactsOpen(to ?? !isContactsOpen)
              }
            />
            <VerticalFlex width="100%" margin="24px 0 0" padding="0 16px">
              <Typography size={12} height="15px">
                Collectible
              </Typography>
              <Card padding="16px" margin="8px 0 0" height="auto">
                <HorizontalFlex>
                  <CollectibleMedia
                    width="auto"
                    maxWidth="80px"
                    height="80px"
                    url={nftItem?.externalData.imageSmall}
                    hover={false}
                  />
                  <Typography size={14} height="17px" margin="0 0 0 16px">
                    {nftItem.externalData.name}
                  </Typography>
                </HorizontalFlex>
              </Card>
            </VerticalFlex>
            <VerticalFlex
              align="center"
              justify="flex-end"
              width="100%"
              padding="0 16px 24px"
              grow="1"
            >
              <Tooltip
                content={
                  <Typography size={14}>{sendState.error?.message}</Typography>
                }
                disabled={!sendState.error?.error}
              >
                <PrimaryButton
                  size={ComponentSize.LARGE}
                  width="343px"
                  onClick={() => {
                    setCollectibleParams({
                      nft,
                      tokenId,
                      address: contactInput?.address,
                      options: { path: '/collectible/send/confirm' },
                    });
                  }}
                  disabled={!sendState.canSubmit}
                >
                  Next
                </PrimaryButton>
              </Tooltip>
            </VerticalFlex>
          </VerticalFlex>
        </VerticalFlex>
      </Route>
    </Switch>
  );
}