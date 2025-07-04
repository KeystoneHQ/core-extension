import { InlineBold } from '@/components/common/InlineBold';
import { useAnalyticsContext } from '@core/ui';
import { useFeatureFlagContext } from '@core/ui';
import { useOnboardingContext } from '@core/ui';
import {
  KeyIcon,
  QRCodeIcon,
  Stack,
  Typography,
  UsbIcon,
} from '@avalabs/core-k2-components';
import { WalletType } from '@avalabs/types';
import { FeatureGates, OnboardingURLs } from '@core/types';
import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { OnboardingStepHeader } from '../../components/OnboardingStepHeader';
import { PageNav } from '../../components/PageNav';
import { useSeedlessActions } from '@core/ui';
import { MethodCard } from './components/MethodCard';
import {
  AuthenticatorModal,
  AuthenticatorSteps,
} from './modals/AuthenticatorModal';
import { FIDOModal } from './modals/FIDOModal';
import { RecoveryMethodTypes } from '@core/types';
import { SEEDLESS_ACTIONS_DEFAULTS } from '../../utils/seedlessOnboardingUrls';

export function RecoveryMethods() {
  const history = useHistory();
  const { t } = useTranslation();
  const { capture } = useAnalyticsContext();
  const [selectedMethod, setSelectedMethod] =
    useState<RecoveryMethodTypes | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { featureFlags } = useFeatureFlagContext();
  const {
    oidcToken,
    isSeedlessMfaRequired: isSeedlessMfaRequiredForAccount,
    setOnboardingWalletType,
  } = useOnboardingContext();
  const { loginWithoutMFA } = useSeedlessActions(SEEDLESS_ACTIONS_DEFAULTS);

  useEffect(() => {
    if (!oidcToken) {
      history.push(OnboardingURLs.ONBOARDING_HOME);
      return;
    }
  }, [history, oidcToken, t]);

  useEffect(() => {
    setOnboardingWalletType(WalletType.Seedless);
    if (selectedMethod) {
      setIsModalOpen(true);
    }
  }, [selectedMethod, setOnboardingWalletType]);

  return (
    <>
      <Stack
        sx={{
          width: '420px',
          height: '100%',
        }}
      >
        <OnboardingStepHeader
          testId="copy-phrase"
          title={t('Add Recovery Methods')}
        />
        <Stack
          sx={{
            flexGrow: 1,
            textAlign: 'center',
            mb: 3,
          }}
        >
          <Typography variant="body2" sx={{ mb: 5 }}>
            <Trans
              i18nKey="Add <bold>one</bold> recovery method to continue."
              components={{
                bold: <InlineBold />,
              }}
            />
          </Typography>
          <Stack
            sx={{
              textAlign: 'left',
              rowGap: 1,
            }}
          >
            {featureFlags[FeatureGates.SEEDLESS_MFA_PASSKEY] && (
              <MethodCard
                icon={<KeyIcon size={24} />}
                title={t('Passkey')}
                description={t('Add a Passkey as a recovery method.')}
                onClick={() => setSelectedMethod(RecoveryMethodTypes.PASSKEY)}
              />
            )}
            {featureFlags[FeatureGates.SEEDLESS_MFA_AUTHENTICATOR] && (
              <MethodCard
                icon={<QRCodeIcon size={24} />}
                title={t('Authenticator')}
                description={t(
                  'Use an authenticator app as a recovery method.',
                )}
                onClick={() => setSelectedMethod(RecoveryMethodTypes.TOTP)}
              />
            )}
            {featureFlags[FeatureGates.SEEDLESS_MFA_YUBIKEY] && (
              <MethodCard
                icon={<UsbIcon size={24} />}
                title={t('Yubikey')}
                description={t('Add a Yubikey as a recovery method.')}
                onClick={() => setSelectedMethod(RecoveryMethodTypes.YUBIKEY)}
              />
            )}
          </Stack>
        </Stack>

        <PageNav
          onBack={() => {
            history.goBack();
          }}
          nextText={t('Set Up Later')}
          disableNext={
            !featureFlags[FeatureGates.SEEDLESS_OPTIONAL_MFA] ||
            isSeedlessMfaRequiredForAccount
          }
          nextDisabledReason={
            !featureFlags[FeatureGates.SEEDLESS_OPTIONAL_MFA]
              ? t('Coming soon!')
              : isSeedlessMfaRequiredForAccount
                ? t('MFA configuration is required for your account.')
                : undefined
          }
          onNext={async () => {
            await loginWithoutMFA();
            history.push(OnboardingURLs.CREATE_PASSWORD);
          }}
          activeStep={0}
          steps={3}
        />
      </Stack>
      {isModalOpen && selectedMethod === RecoveryMethodTypes.TOTP && (
        <AuthenticatorModal
          activeStep={AuthenticatorSteps.SCAN}
          onFinish={() => {
            capture('recoveryMethodAdded', { method: selectedMethod });
            history.push(OnboardingURLs.CREATE_PASSWORD);
          }}
          onCancel={() => {
            capture(`FidoDevice${selectedMethod}Cancelled`);
            setIsModalOpen(false);
            setSelectedMethod(null);
          }}
        />
      )}
      {isModalOpen &&
        (selectedMethod === RecoveryMethodTypes.YUBIKEY ||
          selectedMethod === RecoveryMethodTypes.PASSKEY) && (
          <FIDOModal
            onFinish={() => {
              capture(`recoveryMethodAdded`, { method: selectedMethod });
              history.push(OnboardingURLs.CREATE_PASSWORD);
            }}
            onCancel={() => {
              setIsModalOpen(false);
              capture(`FidoDevice${selectedMethod}Cancelled`);
              setSelectedMethod(null);
            }}
            selectedMethod={selectedMethod}
          />
        )}
    </>
  );
}
