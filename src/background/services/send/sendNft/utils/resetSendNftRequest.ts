import {
  ExtensionConnectionMessage,
  ExtensionRequest,
} from '@src/background/connections/models';

export function sendNftResetRequest(
  contractAddress: string,
  tokenId: number
): Omit<ExtensionConnectionMessage, 'id'> {
  return {
    method: ExtensionRequest.SEND_NFT_RESET,
    params: [contractAddress, tokenId],
  };
}