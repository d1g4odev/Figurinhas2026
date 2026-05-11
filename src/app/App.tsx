import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { useAlbumStore } from '../features/album/album.store';
import { summarizeAlbum } from '../features/album/album.utils';
import { useAuth } from '../features/auth/useAuth';
import { useAuthStore } from '../features/auth/auth.store';
import { loadAlbumState, loadUserProfile, saveAlbumState } from '../firebase/firebase.firestore';

export function App() {
  const { user, loading } = useAuth();
  const album = useAlbumStore((state) => state.album);
  const hydrate = useAlbumStore((state) => state.hydrate);
  const replaceAlbum = useAlbumStore((state) => state.replaceAlbum);
  const hasHydrated = useAlbumStore((state) => state.hasHydrated);
  const setProfile = useAuthStore((state) => state.setProfile);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const isPreview = user?.uid === '__preview__';

  useEffect(() => {
    if (!user || isPreview) return;
    loadUserProfile(user.uid)
      .then((profile) => {
        setProfile(profile);
      })
      .catch((err) => {
        console.warn('Não consegui carregar o perfil do Firestore', err);
      });

    loadAlbumState(user)
      .then((cloudAlbum) => {
        if (cloudAlbum) replaceAlbum(cloudAlbum);
      })
      .catch((err) => {
        console.warn('Não consegui carregar o álbum do Firestore', err);
      });
  }, [isPreview, replaceAlbum, setProfile, user]);

  useEffect(() => {
    if (!user || isPreview || !hasHydrated) return;
    const timer = window.setTimeout(() => {
      saveAlbumState(user, album, summarizeAlbum(album)).catch((err) => {
        console.warn('Não consegui sincronizar com Firestore', err);
      });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [album, hasHydrated, isPreview, user]);

  if (loading) return <div className="splash">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <AppShell user={user}>
      <Outlet />
    </AppShell>
  );
}
