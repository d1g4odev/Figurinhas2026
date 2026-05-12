import { formatSupabaseError, loadAlbumBackup, saveAlbumBackup } from '../../lib/supabase';
import type { AlbumState } from '../album/album.types';

export async function syncAlbumToCloud(album: AlbumState) {
  try {
    return await saveAlbumBackup(album);
  } catch (error) {
    throw new Error(formatSupabaseError(error));
  }
}

export async function restoreAlbumFromCloud() {
  try {
    return await loadAlbumBackup();
  } catch (error) {
    throw new Error(formatSupabaseError(error));
  }
}
