import {
  browserSessionPersistence,
  browserLocalPersistence,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  indexedDBLocalPersistence,
  initializeAuth,
  linkWithRedirect,
  onAuthStateChanged,
  setPersistence,
  signInWithCustomToken,
  signInWithCredential,
  signInWithRedirect,
  signOut,
  type User
} from 'firebase/auth';
import { firebaseApp } from './firebase.app';

const REMEMBER_DEVICE_KEY = 'figs2026.remember-device';

type UsernameAuthPayload = {
  username: string;
  pin: string;
  rememberDevice: boolean;
};

type UsernameAuthResponse = {
  token: string;
  user: {
    uid: string;
    memberId: string;
    username: string;
    authMethod: 'pin';
  };
};

export const auth = (() => {
  try {
    return initializeAuth(firebaseApp, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence]
    });
  } catch {
    return getAuth(firebaseApp);
  }
})();

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export function getRememberDeviceDefault() {
  return localStorage.getItem(REMEMBER_DEVICE_KEY) !== '0';
}

export function saveRememberDevicePreference(rememberDevice: boolean) {
  localStorage.setItem(REMEMBER_DEVICE_KEY, rememberDevice ? '1' : '0');
}

async function configurePersistence(rememberDevice: boolean) {
  saveRememberDevicePreference(rememberDevice);
  await setPersistence(
    auth,
    rememberDevice ? indexedDBLocalPersistence : browserSessionPersistence
  );
}

export function authErrorMessage(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code === 'auth/operation-not-allowed') return 'Ative o provedor Google no Firebase Authentication.';
  if (code === 'auth/unauthorized-domain') return 'Domínio não autorizado. Adicione este domínio em Authentication > Settings > Authorized domains.';
  if (code === 'auth/web-storage-unsupported') return 'O navegador bloqueou cookies/armazenamento. Libere para este site e tente novamente.';
  if (code === 'auth/network-request-failed') return 'Falha de rede ao falar com o Firebase. Confira sua conexão.';
  if (code === 'auth/credential-already-in-use') return 'Essa conta Google já tem um álbum salvo. Vamos entrar nela.';
  if (code === 'auth/invalid-custom-token') return 'Seu token de acesso não foi aceito. Verifique a configuração do backend.';
  if (code === 'auth/custom-token-mismatch') return 'O token foi gerado para outro projeto Firebase.';
  if (code === 'auth/too-many-requests') return 'Muitas tentativas. Aguarde um pouco antes de tentar novamente.';
  if (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return `Não consegui concluir o login${code ? ` (${code})` : ''}.`;
}

async function postAuthEndpoint(path: string, payload: UsernameAuthPayload) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = (await response.json().catch(() => ({}))) as Partial<UsernameAuthResponse> & { error?: string };
  if (!response.ok || !data.token) {
    throw new Error(data.error || 'Não consegui validar sua conta.');
  }

  return data as UsernameAuthResponse;
}

export async function signInWithUsernamePin(payload: UsernameAuthPayload) {
  await configurePersistence(payload.rememberDevice);
  const data = await postAuthEndpoint('/api/auth/login', payload);
  await signInWithCustomToken(auth, data.token);
  return data.user;
}

export async function registerWithUsernamePin(payload: UsernameAuthPayload) {
  await configurePersistence(payload.rememberDevice);
  const data = await postAuthEndpoint('/api/auth/register', payload);
  await signInWithCustomToken(auth, data.token);
  return data.user;
}

/**
 * Starts a redirect-based Google sign-in flow. Works reliably on every
 * platform (iOS Safari with ITP, PWA standalone, webviews, etc.) where
 * popup-based flows would fail intermittently with auth/argument-error.
 *
 * - If current user is anonymous → linkWithRedirect (preserves UID + Firestore data)
 * - Else → signInWithRedirect (fresh sign-in, replaces session)
 *
 * The page navigates to Google. The promise never resolves. The result is
 * processed by resolvePendingGoogleLogin() on the next app load.
 */
export async function linkOrSignInWithGoogle(rememberDevice = true) {
  await configurePersistence(rememberDevice);
  const current = auth.currentUser;
  const alreadyLinkedToGoogle = !!current?.providerData.some((provider) => provider.providerId === 'google.com');
  if (current && !alreadyLinkedToGoogle) {
    return linkWithRedirect(current, googleProvider);
  }
  return signInWithRedirect(auth, googleProvider);
}

/**
 * Processes a pending Google redirect result on app start. Idempotent — safe
 * to call when there is no pending redirect (returns null). Handles
 * credential-already-in-use by falling back to signInWithCredential so the
 * user reaches their existing cloud album when their Google identity already
 * has data tied to it. Swallows stale-state errors silently.
 */
export async function resolvePendingGoogleLogin() {
  try {
    return await getRedirectResult(auth);
  } catch (err: unknown) {
    const code = typeof err === 'object' && err && 'code' in err ? String((err as { code: string }).code) : '';
    if (code === 'auth/credential-already-in-use') {
      const credential = GoogleAuthProvider.credentialFromError(
        err as Parameters<typeof GoogleAuthProvider.credentialFromError>[0]
      );
      if (credential) {
        try {
          return await signInWithCredential(auth, credential);
        } catch (innerErr) {
          console.warn('Fallback signInWithCredential falhou', innerErr);
        }
      }
    }
    console.warn('Resolução do redirect Google ignorada', err);
    return null;
  }
}

export function signOutUser() {
  return signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
