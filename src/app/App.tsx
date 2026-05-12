import { useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { useAlbumStore } from '../features/album/album.store';
import { isAlbumPristine } from '../features/album/album.utils';
import { ensureSupabaseSession, isSupabaseConfigured, loadAlbumBackup, saveAlbumBackup } from '../lib/supabase';

export function App() {
  const hydrate = useAlbumStore((state) => state.hydrate);
  const hasHydrated = useAlbumStore((state) => state.hasHydrated);
  const album = useAlbumStore((state) => state.album);
  const replaceAlbum = useAlbumStore((state) => state.replaceAlbum);
  const cloudBootstrapped = useRef(false);
  const cloudRestoring = useRef(false);
  const lastCloudSignature = useRef('');
  const syncTimeout = useRef<number | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hasHydrated || !isSupabaseConfigured || cloudBootstrapped.current) return;

    let cancelled = false;

    async function bootstrapCloudAccount() {
      try {
        await ensureSupabaseSession();
        const remote = await loadAlbumBackup();

        if (cancelled) return;

        if (remote.payload && isAlbumPristine(album)) {
          cloudRestoring.current = true;
          replaceAlbum(remote.payload);
          lastCloudSignature.current = JSON.stringify(remote.payload);
        } else {
          lastCloudSignature.current = JSON.stringify(album);
        }
      } catch {
        lastCloudSignature.current = JSON.stringify(album);
      } finally {
        if (!cancelled) {
          cloudBootstrapped.current = true;
          window.setTimeout(() => {
            cloudRestoring.current = false;
          }, 50);
        }
      }
    }

    bootstrapCloudAccount();

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, replaceAlbum]);

  useEffect(() => {
    if (!hasHydrated || !isSupabaseConfigured || !cloudBootstrapped.current) return;
    if (cloudRestoring.current) return;

    const signature = JSON.stringify(album);
    if (signature === lastCloudSignature.current) return;

    if (syncTimeout.current) {
      window.clearTimeout(syncTimeout.current);
    }

    syncTimeout.current = window.setTimeout(() => {
      saveAlbumBackup(album)
        .then(() => {
          lastCloudSignature.current = signature;
        })
        .catch(() => undefined);
    }, 1200);

    return () => {
      if (syncTimeout.current) {
        window.clearTimeout(syncTimeout.current);
        syncTimeout.current = null;
      }
    };
  }, [album, hasHydrated]);

  if (!hasHydrated) return <div className="splash">Carregando...</div>;

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
