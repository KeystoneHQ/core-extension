import { FeatureGates } from '@avalabs/posthog-sdk';

export const DEFAULT_FLAGS = {
  [FeatureGates.EVERYTHING]: true,
  [FeatureGates.EVENTS]: true,
  [FeatureGates.SWAP]: true,
  [FeatureGates.BRIDGE]: true,
  [FeatureGates.BRIDGE_ETH]: true,
  [FeatureGates.BRIDGE_BTC]: true,
  [FeatureGates.SEND]: true,
};

export enum FeatureFlagEvents {
  FEATURE_FLAG_UPDATED = 'FeatureFlagEvents: FEATURE_FLAG_UPDATED',
}