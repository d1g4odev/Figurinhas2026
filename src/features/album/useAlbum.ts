import { useMemo } from 'react';
import { useAlbumStore } from './album.store';
import { duplicateStickers, missingStickers, ownedStickers, summarizeAlbum } from './album.utils';

export function useAlbum() {
  const album = useAlbumStore((state) => state.album);
  const toggleOwned = useAlbumStore((state) => state.toggleOwned);
  const incrementDuplicate = useAlbumStore((state) => state.incrementDuplicate);
  const decrementDuplicate = useAlbumStore((state) => state.decrementDuplicate);

  return {
    album,
    toggleOwned,
    incrementDuplicate,
    decrementDuplicate,
    summary: useMemo(() => summarizeAlbum(album), [album]),
    owned: useMemo(() => ownedStickers(album), [album]),
    missing: useMemo(() => missingStickers(album), [album]),
    duplicates: useMemo(() => duplicateStickers(album), [album])
  };
}
