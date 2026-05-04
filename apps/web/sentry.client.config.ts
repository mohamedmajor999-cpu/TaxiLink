import * as Sentry from '@sentry/nextjs'
import { scrubEvent } from '@/lib/sentry/scrub'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10 % des transactions en prod, 100 % en dev
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Capture 10 % des replays de session en prod
  replaysSessionSampleRate: 0.1,
  // 100 % des sessions avec erreur
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Conformite RGPD : aucune PII patient (nom, telephone, motif, transcript)
  // ne doit quitter le perimetre Supabase. Scrub avant tout envoi a Sentry.
  sendDefaultPii: false,
  beforeSend: scrubEvent,
  beforeSendTransaction: scrubEvent,

  // Ne pas envoyer en local si pas de DSN configuré
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
})
