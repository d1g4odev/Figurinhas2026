import { useMemo } from 'react';
import { useAlbumStore } from './album.store';
import { duplicateStickers, missingStickers, ownedStickers, summarizeAlbum } from './album.utils';

export function useAlbum() {
  const album = useAlbumStore((state) => state.album);
  const markOwned = useAlbumStore((state) => state.markOwned);
  const incrementDuplicate = useAlbumStore((state) => state.incrementDuplicate);
  const decrementDuplicate = useAlbumStore((state) => state.decrementDuplicate);
  const addExpense = useAlbumStore((state) => state.addExpense);
  const removeExpense = useAlbumStore((state) => state.removeExpense);

  return {
    album,
    markOwned,
    incrementDuplicate,
    decrementDuplicate,
    addExpense,
    removeExpense,
    summary: useMemo(() => summarizeAlbum(album), [album]),
    owned: useMemo(() => ownedStickers(album), [album]),
    missing: useMemo(() => missingStickers(album), [album]),
    duplicates: useMemo(() => duplicateStickers(album), [album]),
    expenses: album.expenses
  };
}
