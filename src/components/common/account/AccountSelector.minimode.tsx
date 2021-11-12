import { Overlay } from '@avalabs/react-components';
import React, { useState } from 'react';
import { AccountDropdownContent } from './AccountDopdownContent';
import { AccountSelectorButton } from './AccountSelectorButton';

export function AccountSelectorMiniMode() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AccountSelectorButton
        onClick={() => {
          setOpen(true);
        }}
      />
      {open && (
        <Overlay padding="16px">
          <AccountDropdownContent
            onClose={() => {
              setOpen(false);
            }}
          />
        </Overlay>
      )}
    </>
  );
}