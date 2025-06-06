import { Box, Button, Scrollbars, Stack } from '@avalabs/core-k2-components';
import type { Contact } from '@avalabs/types';
import { useTranslation } from 'react-i18next';

import {
  isBitcoin,
  isPchainNetwork,
  isSolanaNetwork,
  isXchainNetwork,
} from '@core/common';
import { SettingsPages, useNetworkContext, useSettingsContext } from '@core/ui';
import { AddressDropdownListItem } from './AddressDropdownListItem';

type AddressDropdownListProps = {
  contacts: Contact[];
  selectedContact?: Contact;
  onChange(contact: Contact): void;
  addContact?: boolean;
};

export const AddressDropdownList = ({
  contacts,
  selectedContact,
  onChange,
  addContact,
}: AddressDropdownListProps) => {
  const { t } = useTranslation();
  const { network } = useNetworkContext();
  const useBtcAddress = isBitcoin(network);
  const useXPAddress = isPchainNetwork(network) || isXchainNetwork(network);
  const useSVMAddress = Boolean(network && isSolanaNetwork(network));

  const selectedAddress =
    selectedContact?.[
      useSVMAddress
        ? 'addressSVM'
        : useBtcAddress
          ? 'addressBTC'
          : useXPAddress
            ? 'addressXP'
            : 'address'
    ]?.toLowerCase();

  const { setIsSettingsOpen, setSettingsActivePage } = useSettingsContext();
  return (
    <Stack sx={{ flexGrow: 1 }}>
      {addContact && (
        <Box sx={{ py: 2 }}>
          <Button
            variant="text"
            onClick={() => {
              setSettingsActivePage(SettingsPages.ADD_CONTACT);
              setIsSettingsOpen(true);
            }}
            data-testid="send-add-new-contact"
          >
            {t('+ Add New Contact')}
          </Button>
        </Box>
      )}
      <Scrollbars style={{ flexGrow: 1, height: '100%', width: '100%' }}>
        {contacts.map((contact, i) => (
          <AddressDropdownListItem
            key={`${contact.address}${i}`}
            contact={contact}
            isSelected={
              contact?.[
                useSVMAddress
                  ? 'addressSVM'
                  : useBtcAddress
                    ? 'addressBTC'
                    : useXPAddress
                      ? 'addressXP'
                      : 'address'
              ]?.toLowerCase() === selectedAddress
            }
            onChange={onChange}
          />
        ))}
      </Scrollbars>
    </Stack>
  );
};
