import React from 'react';
import { Modal } from '@src/components/common/Modal';
import {
  CaretIcon,
  HorizontalFlex,
  SubTextTypography,
  Typography,
  VerticalFlex,
  PrimaryButton,
  IconDirection,
  SecondaryCard,
  TextButton,
  IconButton,
} from '@avalabs/react-components';
import { AvaxTokenIcon } from '@src/components/icons/AvaxTokenIcon';
import { DestinationChainTx } from '@avalabs/wallet-react-components';
import { BN } from '@avalabs/avalanche-wallet-sdk';

export function SendAvaxConfirm({
  open,
  onClose,
  onConfirm,
  amount,
  amountUsd,
  extraTxs,
  address,
  fee,
}: {
  open: boolean;
  onClose(): void;
  onConfirm(): void;
  amount: BN;
  amountUsd: string;
  extraTxs: DestinationChainTx[];
  address: string;
  fee: number;
}) {
  return (
    <Modal isOpen={open}>
      <VerticalFlex>
        <HorizontalFlex align={'center'}>
          <IconButton onClick={() => onClose && onClose()}>
            <CaretIcon direction={IconDirection.LEFT} />
          </IconButton>
          <Typography as={'h1'} size={24} weight={700} margin={'0 0 0 60px'}>
            Confirm transaction
          </Typography>
        </HorizontalFlex>
        <br />
        <br />
        <VerticalFlex align={'center'} style={{ lineHeight: '24px' }}>
          <AvaxTokenIcon />
          <SubTextTypography margin={'10px 0 0 0'}>
            Payment amount
          </SubTextTypography>
          <Typography>{amount} AVAX</Typography>
          <SubTextTypography>${amountUsd} USD</SubTextTypography>
        </VerticalFlex>
        <br />
        <SecondaryCard>
          <VerticalFlex>
            <SubTextTypography margin={'0 0 10px 0'}>Send to</SubTextTypography>
            <Typography style={{ wordBreak: 'break-word' }}>
              {address}
            </Typography>
          </VerticalFlex>
        </SecondaryCard>
        <br />
        <SecondaryCard>
          <HorizontalFlex
            justify={'space-between'}
            align={'center'}
            width={'100%'}
          >
            <VerticalFlex>
              <SubTextTypography margin={'0 0 10px 0'}>
                Transaction fee
              </SubTextTypography>
              <Typography>{fee} AVAX</Typography>
            </VerticalFlex>
            {extraTxs ? <TextButton>View Details</TextButton> : ''}
          </HorizontalFlex>
        </SecondaryCard>
        <br />
        <HorizontalFlex width={'100%'} justify={'center'}>
          <PrimaryButton onClick={() => onConfirm && onConfirm()}>
            Confirm
          </PrimaryButton>
        </HorizontalFlex>
      </VerticalFlex>
    </Modal>
  );
}