import {
  ExtensionRequest,
  ExtensionRequestHandler,
  AccountType,
} from '@core/types';
import { injectable } from 'tsyringe';
import { AccountsService } from '../../accounts/AccountsService';
import { SecretsService } from '../../secrets/SecretsService';

type HandlerType = ExtensionRequestHandler<
  ExtensionRequest.WALLET_GET_BTC_WALLET_POLICY_DETAILS,
  { masterFingerprint?: string } | undefined
>;

@injectable()
export class GetBtcWalletPolicyDetails implements HandlerType {
  method = ExtensionRequest.WALLET_GET_BTC_WALLET_POLICY_DETAILS as const;

  constructor(
    private secretsService: SecretsService,
    private accountService: AccountsService,
  ) {}

  handle: HandlerType['handle'] = async ({ request }) => {
    try {
      const activeAccount = await this.accountService.getActiveAccount();

      if (!activeAccount) {
        throw new Error('no account selected');
      }

      if (activeAccount.type !== AccountType.PRIMARY) {
        throw new Error('incorrect account type');
      }

      const policyInfo =
        await this.secretsService.getBtcWalletPolicyDetails(activeAccount);

      return {
        ...request,
        result: {
          masterFingerprint: policyInfo?.details?.masterFingerprint,
        },
      };
    } catch (_err) {
      return {
        ...request,
        result: undefined,
      };
    }
  };
}
