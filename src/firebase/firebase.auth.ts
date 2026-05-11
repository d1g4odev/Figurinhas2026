import {
  browserLocalPersistence,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  indexedDBLocalPersistence,
  initializeAuth,
  linkWithRedirect,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCredential,
  signInWithRedirect,
  signOut,
  type User
} from 'firebase/auth';
import { firebaseApp } from './firebase.app';

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

export function authErrorMessage(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code === 'auth/operation-not-allowed') return 'Ative o provedor Google no Firebase Authentication.';
  if (code === 'auth/unauthorized-domain') return 'Domínio não autorizado. Adicione este domínio em Authentication > Settings > Authorized domains.';
  if (code === 'auth/web-storage-unsupported') return 'O navegador bloqueou cookies/armazenamento. Libere para este site e tente novamente.';
  if (code === 'auth/network-request-failed') return 'Falha de rede ao falar com o Firebase. Confira sua conexão.';
  if (code === 'auth/credential-already-in-use') return 'Essa conta Google já tem um álbum salvo. Vamos entrar nela.';
  if (code === 'auth/admin-restricted-operation') return 'Login anônimo desabilitado. Ative em Firebase Authentication > Sign-in method > Anonymous.';
  return `Não consegui concluir o login${code ? ` (${code})` : ''}.`;
}

export function signInAnonymousUser() {
  return signInAnonymously(auth);
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
export async function linkOrSignInWithGoogle() {
  const current = auth.currentUser;
  if (current && current.isAnonymous) {
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
