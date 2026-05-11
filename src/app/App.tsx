import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { useAlbumStore } from '../features/album/album.store';
import { summarizeAlbum } from '../features/album/album.utils';
import { useAuth } from '../features/auth/useAuth';
import { loadAlbumState, saveAlbumState } from '../firebase/firebase.firestore';

export function App() {
  const { user, loading } = useAuth();
  const album = useAlbumStore((state) => state.album);
  const hydrate = useAlbumStore((state) => state.hydrate);
  const replaceAlbum = useAlbumStore((state) => state.replaceAlbum);
  const hasHydrated = useAlbumStore((state) => state.hasHydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!user) return;

    loadAlbumState(user)
      .then((cloudAlbum) => {
        if (cloudAlbum) replaceAlbum(cloudAlbum);
      })
      .catch((error) => {
        console.warn('Não consegui carregar o álbum do Firestore', error);
      });
  }, [replaceAlbum, user]);

  useEffect(() => {
    if (!user || !hasHydrated) return;
    const timer = window.setTimeout(() => {
      saveAlbumState(user, album, summarizeAlbum(album)).catch((error) => {
        console.warn('Não consegui sincronizar com Firestore', error);
      });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [album, hasHydrated, user]);

  if (loading) return <div className="splash">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <AppShell user={user}>
      <Outlet />
    </AppShell>
  );
}
