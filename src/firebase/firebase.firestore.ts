import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { firestore } from './firebase.app';
import type { AlbumState, AlbumSummary } from '../features/album/album.types';

const userRef = (uid: string) => doc(firestore, 'users', uid);
const albumRef = (uid: string) => doc(firestore, 'users', uid, 'albums', 'default');

export async function upsertUser(user: User) {
  const snap = await getDoc(userRef(user.uid));
  await setDoc(userRef(user.uid), {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
    providerId: 'google.com',
    createdAt: snap.exists() ? snap.data().createdAt || serverTimestamp() : serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function loadAlbumState(user: User) {
  await upsertUser(user);
  const snap = await getDoc(albumRef(user.uid));
  if (!snap.exists()) return null;
  return snap.data().state as AlbumState | null;
}

export async function saveAlbumState(user: User, state: AlbumState, summary: AlbumSummary) {
  await upsertUser(user);
  await setDoc(albumRef(user.uid), {
    state,
    summary,
    schemaVersion: 2,
    updatedAt: serverTimestamp()
  }, { merge: true });
}
