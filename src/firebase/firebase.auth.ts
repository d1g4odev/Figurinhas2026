import {
  browserLocalPersistence,
  getAuth,
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
  return window.matchMedia('(display-mode: standalone)').matches ||
    'standalone' in window.navigator ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
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

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
