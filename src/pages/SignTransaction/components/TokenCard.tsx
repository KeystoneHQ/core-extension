import {
  HorizontalFlex,
  Card,
  SubTextTypography,
  Typography,
  VerticalFlex,
} from '@avalabs/react-components';
import { TokenIcon } from '@src/components/common/TokenImage';
import { AvaxTokenIcon } from '@src/components/icons/AvaxTokenIcon';
import { useSettingsContext } from '@src/contexts/SettingsProvider';
import {
  isAvaxToken,
  TokenWithBalance,
} from '@avalabs/wallet-react-components';

export function TokenCard({
  token,
  margin,
  displayValue,
  amount,
}: {
  token: TokenWithBalance;
  margin?: string;
  displayValue?: string;
  amount?: string;
}) {
  const { currencyFormatter, currency } = useSettingsContext();

  return (
    <Card padding="8px 16px" margin={margin}>
      <HorizontalFlex align={'center'} justify={'space-between'} width={'100%'}>
        <HorizontalFlex align={'center'} height="100%">
          {isAvaxToken(token) ? (
            <AvaxTokenIcon height="32px" />
          ) : (
            <TokenIcon
              height="32px"
              width="32px"
              src={(token as TokenWithBalance).logoURI}
              name={(token as TokenWithBalance).name}
            />
          )}
          <Typography margin="0 0 0 16px" size={16} height="24px" weight={500}>
            {token.symbol}
          </Typography>
        </HorizontalFlex>
        <VerticalFlex height="100%" minHeight="41px" align="flex-end">
          <Typography size={14} height="24px" margin="0 0 2px 0">
            {displayValue}
          </Typography>
          <SubTextTypography size={12} height="15px">
            {isNaN(Number(amount))
              ? ''
              : `${currencyFormatter(Number(amount))} ${currency}`}
          </SubTextTypography>
        </VerticalFlex>
      </HorizontalFlex>
    </Card>
  );
}