import { DAppProviderRequest } from '@src/background/connections/dAppConnection/models';
import { AvalancheSelectAccountHandler } from './avalanche_selectAccount';
import { container } from 'tsyringe';
import { openExtensionNewWindow } from '@src/utils/extensionUtils';
import { ActionsService } from '../../actions/ActionsService';
import { DEFERRED_RESPONSE } from '@src/background/connections/middlewares/models';
import { AccountType } from '../models';

jest.mock('@src/utils/extensionUtils', () => ({
  openExtensionNewWindow: jest.fn(),
}));

describe('background/services/accounts/handlers/avalanche_selectAccount.ts', () => {
  const addActionMock = jest.fn();
  const accountServiceMock = {
    getAccountList: jest.fn(),
  } as any;
  const actionsServiceMock = {
    addAction: addActionMock,
  };
  const permissionsServiceMock = {
    setAccountPermissionForDomain: jest.fn(),
  } as any;

  container.registerInstance(ActionsService, actionsServiceMock as any);

  beforeEach(() => {
    jest.resetAllMocks();

    (openExtensionNewWindow as jest.Mock).mockReturnValue({ id: 123 });
  });

  describe('handleAuthenticated', () => {
    it('returns DEFERED_RESPONSE for primary address', async () => {
      const account = {
        index: 1,
        addressC: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        type: AccountType.PRIMARY,
      };
      accountServiceMock.getAccountList.mockReturnValue([account]);

      const handler = new AvalancheSelectAccountHandler(
        accountServiceMock,
        permissionsServiceMock
      );
      const url = 'switchAccount?id=123';

      const request = {
        id: '123',
        method: DAppProviderRequest.ACCOUNT_SELECT,
        params: [1],
        site: { tabId: 1 },
      } as any;

      const actionData = {
        ...request,
        tabId: 1,
        selectedAccount: account,
        popupWindowId: 123,
      };

      const result = await handler.handleAuthenticated(request);

      expect(openExtensionNewWindow).toHaveBeenCalled();
      expect(openExtensionNewWindow).toHaveBeenCalledWith(url, '');
      expect(addActionMock).toHaveBeenCalled();
      expect(addActionMock).toBeCalledWith(actionData);
      expect(result).toEqual({
        ...request,
        result: DEFERRED_RESPONSE,
      });
    });

    it('returns DEFERED_RESPONSE for imported address', async () => {
      const account = {
        id: '0x1',
        addressC: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        type: AccountType.IMPORTED,
      };

      accountServiceMock.getAccountList.mockReturnValue([account]);
      const handler = new AvalancheSelectAccountHandler(
        accountServiceMock,
        permissionsServiceMock
      );
      const url = 'switchAccount?id=123';

      const request = {
        id: '123',
        method: DAppProviderRequest.ACCOUNT_SELECT,
        params: ['0x1'],
        site: { tabId: 1 },
      } as any;

      const actionData = {
        ...request,
        tabId: 1,
        selectedAccount: account,
        popupWindowId: 123,
      };

      const result = await handler.handleAuthenticated(request);

      expect(openExtensionNewWindow).toHaveBeenCalled();
      expect(openExtensionNewWindow).toHaveBeenCalledWith(url, '');
      expect(addActionMock).toHaveBeenCalled();
      expect(addActionMock).toBeCalledWith(actionData);
      expect(result).toEqual({
        ...request,
        result: DEFERRED_RESPONSE,
      });
    });

    it('returns errors when account not found', async () => {
      accountServiceMock.getAccountList.mockReturnValueOnce([]);

      const handler = new AvalancheSelectAccountHandler(
        accountServiceMock,
        permissionsServiceMock
      );
      const request = {
        id: '123',
        method: DAppProviderRequest.ACCOUNT_SELECT,
        params: [1],
      } as any;

      const result = await handler.handleAuthenticated(request);

      expect(result).toEqual({
        ...request,
        error: new Error('Account not found'),
      });
    });
  });

  it('handleUnauthenticated', async () => {
    const handler = new AvalancheSelectAccountHandler(
      accountServiceMock,
      permissionsServiceMock
    );
    const request = {
      id: '123',
      method: DAppProviderRequest.ACCOUNT_SELECT,
      params: [1],
    } as any;

    const result = await handler.handleUnauthenticated(request);
    expect(result).toEqual({
      ...request,
      error: new Error(
        'The requested account and/or method has not been authorized by the user.'
      ),
    });
  });

  describe('onActionApproved', () => {
    const onSuccessMock = jest.fn();
    const onErrorMock = jest.fn();
    const activateAccountMock = jest.fn().mockResolvedValue(true);

    it('success with primary account', async () => {
      const handler = new AvalancheSelectAccountHandler(
        {
          activateAccount: activateAccountMock,
        } as any,
        permissionsServiceMock
      );
      await handler.onActionApproved(
        {
          selectedAccount: { index: 1, id: 'uuid', type: AccountType.PRIMARY },
        } as any,
        undefined,
        onSuccessMock,
        onErrorMock
      );

      expect(
        permissionsServiceMock.setAccountPermissionForDomain
      ).not.toHaveBeenCalled();
      expect(onErrorMock).not.toHaveBeenCalled();
      expect(activateAccountMock).toHaveBeenCalledWith('uuid');
      expect(onSuccessMock).toHaveBeenCalled();
      expect(onSuccessMock).toBeCalledWith(null);
    });

    it('success with imported account', async () => {
      const handler = new AvalancheSelectAccountHandler(
        {
          activateAccount: activateAccountMock,
        } as any,
        permissionsServiceMock
      );
      await handler.onActionApproved(
        {
          selectedAccount: { id: '0x1', type: AccountType.IMPORTED },
        } as any,
        undefined,
        onSuccessMock,
        onErrorMock
      );

      expect(
        permissionsServiceMock.setAccountPermissionForDomain
      ).not.toHaveBeenCalled();
      expect(onErrorMock).not.toHaveBeenCalled();
      expect(activateAccountMock).toHaveBeenCalledWith('0x1');
      expect(onSuccessMock).toHaveBeenCalled();
      expect(onSuccessMock).toBeCalledWith(null);
    });

    it('sets account permission when domain is defined', async () => {
      const handler = new AvalancheSelectAccountHandler(
        {
          activateAccount: activateAccountMock,
        } as any,
        permissionsServiceMock
      );
      await handler.onActionApproved(
        {
          selectedAccount: {
            id: '0x1',
            addressC: '0x1',
            type: AccountType.IMPORTED,
          },
          site: {
            domain: 'core.app',
          },
        } as any,
        undefined,
        onSuccessMock,
        onErrorMock
      );

      expect(
        permissionsServiceMock.setAccountPermissionForDomain
      ).toHaveBeenCalled();
      expect(
        permissionsServiceMock.setAccountPermissionForDomain
      ).toHaveBeenCalledWith('core.app', '0x1', true);
      expect(activateAccountMock).toHaveBeenCalledWith('0x1');
      expect(onSuccessMock).toBeCalledWith(null);
    });

    it('error', async () => {
      const mockError = new Error('something went wrong');
      const handler = new AvalancheSelectAccountHandler(
        {
          activateAccount: jest.fn().mockRejectedValueOnce(mockError),
        } as any,
        permissionsServiceMock
      );

      await handler.onActionApproved(
        {
          selectedAccount: { index: 1 },
        } as any,
        undefined,
        onSuccessMock,
        onErrorMock
      );
      expect(
        permissionsServiceMock.setAccountPermissionForDomain
      ).not.toHaveBeenCalled();
      expect(onSuccessMock).not.toHaveBeenCalled();
      expect(onErrorMock).toHaveBeenCalled();
      expect(onErrorMock).toBeCalledWith(mockError);
    });
  });
});