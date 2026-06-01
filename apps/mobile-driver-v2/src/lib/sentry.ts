import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    console.info('[sentry] EXPO_PUBLIC_SENTRY_DSN absent, monitoring désactivé');
    return;
  }
  Sentry.init({
    dsn,
    enableNative: !__DEV__,
    debug: __DEV__,
    environment: __DEV__ ? 'development' : 'production',
    release: Constants.expoConfig?.version ?? '0.0.0',
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  });
  initialized = true;
}

export function captureException(
  err: unknown,
  options?: { tags?: Record<string, string> },
): void {
  if (!initialized) {
    console.error('[sentry not init]', err, options?.tags);
    return;
  }
  Sentry.captureException(err, options);
}
