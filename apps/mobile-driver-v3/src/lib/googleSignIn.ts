import { getSupabaseClient, profileService } from '@taxilink/services';

export class GoogleSignInCancelledError extends Error {
  constructor() {
    super('Connexion Google annulée.');
    this.name = 'GoogleSignInCancelledError';
  }
}

export class GoogleSignInUnavailableError extends Error {
  constructor() {
    super(
      "Connexion Google indisponible dans Expo Go. Utilise un build EAS de développement.",
    );
    this.name = 'GoogleSignInUnavailableError';
  }
}

// Le module @react-native-google-signin/google-signin embarque un TurboModule
// natif (RNGoogleSignin) qui n'existe PAS dans le binaire Expo Go. On lazy-load
// au premier appel pour eviter le crash global du bundle au boot.
type GoogleSignInModule = typeof import('@react-native-google-signin/google-signin');

let mod: GoogleSignInModule | null = null;
let configured = false;

function loadModule(): GoogleSignInModule {
  if (mod) return mod;
  try {
    // require dynamique : l'evaluation n'arrive qu'au clic Google, pas au boot.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('@react-native-google-signin/google-signin') as GoogleSignInModule;
    return mod;
  } catch {
    throw new GoogleSignInUnavailableError();
  }
}

function ensureConfigured() {
  if (configured) return;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) {
    throw new Error('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID manquant dans .env.local.');
  }
  const { GoogleSignin } = loadModule();
  GoogleSignin.configure({
    webClientId,
    scopes: ['profile', 'email'],
    offlineAccess: true,
  });
  configured = true;
}

// Lance le flow Google natif : popup Google sur l'appareil → idToken →
// supabase.signInWithIdToken. Pas de navigateur ouvert, pas de redirect URL.
export async function signInWithGoogle(): Promise<void> {
  ensureConfigured();
  const { GoogleSignin, statusCodes, isErrorWithCode } = loadModule();

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const result = await GoogleSignin.signIn();
    const idToken = result.data?.idToken;
    if (!idToken) throw new Error('Aucun idToken renvoyé par Google.');

    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    if (isErrorWithCode(err) && err.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new GoogleSignInCancelledError();
    }
    throw err;
  }
}

// Apres un signIn Google : verifier si le profile DB a phone + departement.
// Google ne fournit pas ces infos → premier signin = profil incomplet.
// Retourne la route cible : '/' si complet, '/complete-profile' sinon.
export async function resolvePostGoogleSignInRoute(): Promise<'/' | '/complete-profile'> {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return '/complete-profile';
  const profile = await profileService.getProfile(data.user.id).catch(() => null);
  const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
  const phone = profile?.phone ?? (typeof meta.phone === 'string' ? meta.phone : null);
  const dept = Array.isArray(meta.dept_preferences) && meta.dept_preferences.length > 0;
  return phone && dept ? '/' : '/complete-profile';
}
