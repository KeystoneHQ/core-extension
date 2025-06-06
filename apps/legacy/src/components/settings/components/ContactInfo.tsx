import type { Contact } from '@avalabs/types';
import { SimpleAddress } from '@/components/common/SimpleAddress';
import {
  Stack,
  Typography,
  AvalancheColorIcon,
  BitcoinColorIcon,
  XAndPChainsIcon,
} from '@avalabs/core-k2-components';
import { SolanaLogoIcon } from '@/components/common/SolanaLogoIcon';

export const ContactInfo = ({ contact }: { contact: Contact }) => {
  return (
    <Stack
      sx={{
        justifyContent: 'space-between',
        flexDirection: 'row',
        width: '100%',
        alignItems: 'center',
      }}
    >
      <Typography
        variant="body1"
        title={contact.name}
        sx={{
          maxWidth: '95%',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          fontWeight: 'fontWeightSemibold',
        }}
      >
        {contact.name}
      </Typography>
      <Stack>
        {contact.address && (
          <Stack
            sx={{ flexDirection: 'row', alignItems: 'center', width: '120px' }}
            data-testid="contact-li-copy-ava-address"
          >
            <AvalancheColorIcon
              sx={{
                mr: 0.5,
              }}
              size={16}
            />
            <SimpleAddress address={contact.address} />
          </Stack>
        )}
        {contact.addressXP && (
          <Stack
            sx={{
              flexDirection: 'row',
              alignItems: 'center',
              width: '120px',
              mt: 1,
            }}
            data-testid="contact-li-copy-xp-address"
          >
            <XAndPChainsIcon
              sx={{
                mr: 0.5,
              }}
              size={16}
            />
            <SimpleAddress address={contact.addressXP} />
          </Stack>
        )}
        {contact.addressBTC && (
          <Stack
            sx={{
              flexDirection: 'row',
              alignItems: 'center',
              width: '120px',
              mt: 1,
            }}
            data-testid="contact-li-copy-btc-address"
          >
            <BitcoinColorIcon
              sx={{
                mr: 0.5,
              }}
              size={16}
            />
            <SimpleAddress address={contact.addressBTC} />
          </Stack>
        )}
        {contact.addressSVM && (
          <Stack
            sx={{
              flexDirection: 'row',
              alignItems: 'center',
              width: '120px',
              mt: 1,
            }}
            data-testid="contact-li-copy-svm-address"
          >
            <SolanaLogoIcon
              sx={{
                mr: 0.5,
              }}
              size={16}
            />
            <SimpleAddress address={contact.addressSVM} />
          </Stack>
        )}
      </Stack>
    </Stack>
  );
};
