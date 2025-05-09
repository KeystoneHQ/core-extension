import { EventEmitter } from 'events';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { deleteToken, getToken } from 'firebase/messaging';
import {
  getMessaging,
  MessagePayload,
  onBackgroundMessage,
  isSupported as isSupportedBrowserByFcm,
} from 'firebase/messaging/sw';
import { singleton } from 'tsyringe';
import { FirebaseEvents, FcmMessageListener } from './models';
import sentryCaptureException, {
  SentryExceptionTypes,
} from '@src/monitoring/sentryCaptureException';
import { FeatureFlagService } from '../featureFlags/FeatureFlagService';
import { FeatureFlagEvents, FeatureGates } from '../featureFlags/models';
import { isSupportedBrowser } from '@src/utils/isSupportedBrowser';
import { MESSAGE_EVENT as APPCHECK_MESSAGE_EVENT } from '../appcheck/AppCheckService';

@singleton()
export class FirebaseService {
  #app?: FirebaseApp;
  #isFcmInitialized = false;
  #fcmToken?: string;
  #firebaseEventEmitter = new EventEmitter();
  #fcmMessageEventEmitter = new EventEmitter();
  #fcmMessageHandlers: Record<string, (payload: MessagePayload) => void> = {};

  constructor(private featureFlagService: FeatureFlagService) {
    if (!process.env.FIREBASE_CONFIG) {
      throw new Error('FIREBASE_CONFIG is missing');
    }

    if (!isSupportedBrowser()) {
      return;
    }

    this.#app = initializeApp(
      JSON.parse(Buffer.from(process.env.FIREBASE_CONFIG, 'base64').toString()),
    );

    onBackgroundMessage(getMessaging(this.#app), (payload) => {
      this.#handleMessage(payload);
    });

    this.featureFlagService.addListener(
      FeatureFlagEvents.FEATURE_FLAG_UPDATED,
      async (featureFlags) => {
        const isSupported = await isSupportedBrowserByFcm();

        if (!isSupported) {
          return;
        }

        try {
          if (
            this.#isFcmInitialized &&
            !featureFlags[FeatureGates.FIREBASE_CLOUD_MESSAGING]
          ) {
            await deleteToken(getMessaging(this.#app));

            this.#isFcmInitialized = false;
            this.#fcmToken = undefined;
            this.#firebaseEventEmitter.emit(FirebaseEvents.FCM_TERMINATED);
            return;
          }

          if (
            !this.#isFcmInitialized &&
            featureFlags[FeatureGates.FIREBASE_CLOUD_MESSAGING]
          ) {
            this.#fcmToken = await getToken(getMessaging(this.#app), {
              serviceWorkerRegistration: globalThis.registration,
            });

            this.#isFcmInitialized = true;
            this.#firebaseEventEmitter.emit(FirebaseEvents.FCM_INITIALIZED);
            return;
          }
        } catch (err) {
          sentryCaptureException(err as Error, SentryExceptionTypes.FIREBASE);
        }
      },
    );
  }

  get isFcmInitialized() {
    return this.#isFcmInitialized;
  }

  getFirebaseApp() {
    return this.#app;
  }

  getFcmToken() {
    return this.#fcmToken;
  }

  addFirebaseEventListener<T = unknown>(
    event: FirebaseEvents,
    callback: () => T,
  ) {
    this.#firebaseEventEmitter.on(event, callback);
  }

  addFcmMessageListener(type: string, listener: FcmMessageListener) {
    if (this.#fcmMessageHandlers[type]) {
      throw new Error(`Message handler for type ${type} already exists`);
    }

    this.#fcmMessageEventEmitter.on(type, listener);
    this.#fcmMessageHandlers[type] = listener;
  }

  async #handleMessage(payload: MessagePayload) {
    // TODO: remove this once we can set type for ID challenges
    if (payload.data?.event === APPCHECK_MESSAGE_EVENT) {
      this.#fcmMessageEventEmitter.emit(payload.data.event, payload);
    }

    const type = payload.data?.type ?? '';

    if (this.#fcmMessageHandlers[type]) {
      this.#fcmMessageEventEmitter.emit(type, payload);
    }
  }
}
