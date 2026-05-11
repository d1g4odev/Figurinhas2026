import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  indexedDBLocalPersistence,
  initializeAuth,
  linkWithPopup,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCredential,
  signInWithPopup,
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
  if (code === 'auth/popup-blocked') return 'O navegador bloqueou a janela de login. Libere popups e tente novamente.';
  if (code === 'auth/popup-closed-by-user') return 'A janela do Google foi fechada antes de concluir.';
  if (code === 'auth/credential-already-in-use') return 'Essa conta Google já tem um álbum salvo. Recarregue a página pra entrar nela.';
  if (code === 'auth/admin-restricted-operation') return 'Login anônimo desabilitado. Ative em Firebase Authentication > Sign-in method > Anonymous.';
  return `Não consegui concluir o login${code ? ` (${code})` : ''}.`;
}

export function signInAnonymousUser() {
  return signInAnonymously(auth);
}

/**
 * Smart helper: if the current user is anonymous, links the Google credential
 * to upgrade the anon account to a permanent one (keeps Firestore data).
 * Otherwise, signs in with Google fresh (replaces current session).
 * On `credential-already-in-use`, falls back to signing in with that Google
 * account directly — anon album becomes orphaned but the user reaches their
 * existing cloud album.
 */
export async function linkOrSignInWithGoogle() {
  const current = auth.currentUser;
  if (current && current.isAnonymous) {
    try {
      return await linkWithPopup(current, googleProvider);
    } catch (err: unknown) {
      const code = typeof err === 'object' && err && 'code' in err ? String((err as { code: string }).code) : '';
      if (code === 'auth/credential-already-in-use') {
        const credential = GoogleAuthProvider.credentialFromError(err as Parameters<typeof GoogleAuthProvider.credentialFromError>[0]);
        if (credential) {
          return await signInWithCredential(auth, credential);
        }
      }
      throw err;
    }
  }
  return signInWithPopup(auth, googleProvider);
}

export function signOutUser() {
  return signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
