import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { useAlbumStore } from '../features/album/album.store';
import { summarizeAlbum } from '../features/album/album.utils';
import { useAuth } from '../features/auth/useAuth';
import { loadAlbumState, saveAlbumState } from '../firebase/firebase.firestore';

export function App() {
  const { user, loading, error } = useAuth();
  const album = useAlbumStore((state) => state.album);
  const hydrate = useAlbumStore((state) => state.hydrate);
  const replaceAlbum = useAlbumStore((state) => state.replaceAlbum);
  const hasHydrated = useAlbumStore((state) => state.hasHydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const isPreview = user?.uid === '__preview__';

  useEffect(() => {
    if (!user || isPreview) return;
    loadAlbumState(user)
      .then((cloudAlbum) => {
        if (cloudAlbum) replaceAlbum(cloudAlbum);
      })
      .catch((err) => {
        console.warn('Não consegui carregar o álbum do Firestore', err);
      });
  }, [isPreview, replaceAlbum, user]);

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
  if (!user && error) return <Navigate to="/login" replace />;
  if (!user) return <div className="splash">Preparando seu álbum...</div>;

  return (
    <AppShell user={user}>
      <Outlet />
    </AppShell>
  );
}
