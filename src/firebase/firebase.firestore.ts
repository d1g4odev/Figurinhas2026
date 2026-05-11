import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { firestore } from './firebase.app';
import type { AlbumState, AlbumSummary } from '../features/album/album.types';

const userRef = (uid: string) => doc(firestore, 'users', uid);
const albumRef = (uid: string) => doc(firestore, 'users', uid, 'albums', 'default');

export type UserProfile = {
  uid: string;
  memberId?: string;
  username?: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  providerId?: string;
};

export async function upsertUser(user: User) {
  const snap = await getDoc(userRef(user.uid));
  const providerId = user.providerData.some((provider) => provider.providerId === 'google.com')
    ? 'google.com'
    : user.providerData[0]?.providerId || 'custom';
  await setDoc(userRef(user.uid), {
    uid: user.uid,
    email: user.email || snap.data()?.email || '',
    displayName: user.displayName || snap.data()?.displayName || '',
    photoURL: user.photoURL || snap.data()?.photoURL || '',
    providerId,
    createdAt: snap.exists() ? snap.data().createdAt || serverTimestamp() : serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function loadUserProfile(uid: string) {
  const snap = await getDoc(userRef(uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
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
