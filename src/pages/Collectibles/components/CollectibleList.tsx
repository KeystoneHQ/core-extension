import { NFT } from '@avalabs/blizzard-sdk';
import { TokenCard, VerticalFlex } from '@avalabs/react-components';
import { useWalletContext } from '@src/contexts/WalletProvider';
import { CollectibleMedia } from './CollectibleMedia';

export function CollectibleList({
  onClick,
}: {
  onClick: (nft: NFT, tokenId: string) => void;
}) {
  const { nfts } = useWalletContext();
  return (
    <VerticalFlex padding="0 16px 72px">
      {nfts.map((collection, i) =>
        collection.nftData?.map((nft, j) => (
          <TokenCard
            name={collection.contractName}
            symbol={''}
            balanceUSD={`#${nft.tokenId}`}
            key={`${i}-${j}`}
            onClick={() => onClick(collection, nft.tokenId)}
          >
            <CollectibleMedia
              height="32px"
              width="auto"
              maxWidth="32px"
              url={nft.externalData.imageSmall}
              hover={false}
              margin="8px 0"
              showPlayIcon={false}
            />
          </TokenCard>
        ))
      )}
    </VerticalFlex>
  );
}