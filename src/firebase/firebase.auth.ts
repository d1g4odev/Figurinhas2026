import {
  browserLocalPersistence,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User
} from 'firebase/auth';
import { firebaseApp } from './firebase.app';

export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({ prompt: 'select_account' });

const persistenceReady = setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn('Firebase Auth persistence indisponível', error);
});

function preferRedirect() {
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches ||
    navigatorWithStandalone.standalone === true ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function authErrorMessage(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code === 'auth/operation-not-allowed') return 'Ative o provedor Google no Firebase Authentication.';
  if (code === 'auth/unauthorized-domain') return 'Domínio não autorizado. Adicione localhost, 127.0.0.1 e o domínio publicado em Authentication > Settings > Authorized domains.';
  if (code === 'auth/web-storage-unsupported') return 'O navegador bloqueou cookies/armazenamento. Libere para este site e tente novamente.';
  if (code === 'auth/network-request-failed') return 'Falha de rede ao falar com o Firebase. Confira sua conexão e tente de novo.';
  if (code === 'auth/popup-closed-by-user') return 'A janela do Google foi fechada antes de concluir o login.';
  return `Não consegui concluir o login com Google${code ? ` (${code})` : ''}.`;
}

export async function signInWithGoogle() {
  await persistenceReady;
  if (preferRedirect()) return signInWithRedirect(auth, googleProvider);

  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
    if (['auth/popup-blocked', 'auth/cancelled-popup-request', 'auth/popup-closed-by-user'].includes(code)) {
      return signInWithRedirect(auth, googleProvider);
    }
    throw error;
  }
}

export function signOutUser() {
  return signOut(auth);
}

export async function resolveRedirectLogin() {
  await persistenceReady;
  return getRedirectResult(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
