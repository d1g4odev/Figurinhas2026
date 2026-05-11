import { useMemo } from 'react';
import { useAlbumStore } from './album.store';
import { duplicateStickers, missingStickers, ownedStickers, summarizeAlbum } from './album.utils';

export function useAlbum() {
  const album = useAlbumStore((state) => state.album);
  const actions = useAlbumStore((state) => ({
    toggleOwned: state.toggleOwned,
    incrementDuplicate: state.incrementDuplicate,
    decrementDuplicate: state.decrementDuplicate
  }));

  return {
    album,
    ...actions,
    summary: useMemo(() => summarizeAlbum(album), [album]),
    owned: useMemo(() => ownedStickers(album), [album]),
    missing: useMemo(() => missingStickers(album), [album]),
    duplicates: useMemo(() => duplicateStickers(album), [album])
  };
}
