import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

let initialized = false;

// Filet anti-PII (RGPD) : redaction des n° de téléphone / schemes de contact qui
// pourraient se glisser dans les tags, breadcrumbs ou messages. La source connue
// (url tel:/sms: taggée dans mission-detail) est déjà corrigée ; ceci couvre le reste.
const PII_PATTERNS: RegExp[] = [
  /\b(?:tel|sms|whatsapp):[^\s'"]+/gi,
  /\+?\d[\d ().-]{7,}\d/g,
];
function scrub(value: string): string {
  return PII_PATTERNS.reduce((acc, re) => acc.replace(re, '[redacted]'), value);
}
function scrubRecord(rec: Record<string, unknown> | undefined): void {
  if (!rec) return;
  for (const k of Object.keys(rec)) {
    if (typeof rec[k] === 'string') rec[k] = scrub(rec[k] as string);
  }
}

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
    // Crash reporting uniquement. AUCUN trace ni auto-perf en prod : Sentry
    // RN auto-instrumente fetch/xhr/AppState/AsyncStorage et uploadait
    // ~3-4 transactions/min → cause majeure des 38894 paquets WiFi/12min
    // observes sur device (build 2026-05-23). On garde captureException pur.
    tracesSampleRate: 0,
    enableAutoSessionTracking: false,
    enableAutoPerformanceTracing: false,
    enableNativeFramesTracking: false,
    enableUserInteractionTracing: false,
    beforeSend(event) {
      scrubRecord(event.tags as Record<string, unknown> | undefined);
      scrubRecord(event.extra);
      if (event.message) event.message = scrub(event.message);
      if (event.request?.url) event.request.url = scrub(event.request.url);
      for (const b of event.breadcrumbs ?? []) {
        if (b.message) b.message = scrub(b.message);
        scrubRecord(b.data);
      }
      return event;
    },
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
