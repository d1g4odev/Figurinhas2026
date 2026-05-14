import { create } from 'zustand';
import type { AlbumState, ExpenseEntry } from './album.types';
import { createEmptyAlbum, normalizeAlbumState } from './album.utils';

export const STORAGE_KEY = 'figurinhas-copa-2026-react-v1';
const LEGACY_STORAGE_KEY = 'figurinhas-copa-2026-v1';

type AlbumStore = {
  album: AlbumState;
  hasHydrated: boolean;
  hydrate: () => void;
  replaceAlbum: (album: AlbumState) => void;
  markOwned: (stickerId: string) => void;
  toggleOwned: (stickerId: string) => void;
  incrementDuplicate: (stickerId: string) => void;
  decrementDuplicate: (stickerId: string) => void;
  addExpense: (amount: number) => void;
  removeExpense: (id: string) => void;
};

function loadLocalAlbum() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return createEmptyAlbum();
    return normalizeAlbumState(JSON.parse(raw));
  } catch {
    return createEmptyAlbum();
  }
}

function persist(album: AlbumState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(album));
}

function updateSticker(album: AlbumState, stickerId: string, updater: (current: AlbumState['stickers'][string]) => AlbumState['stickers'][string]) {
  const current = album.stickers[stickerId];
  return {
    ...album,
    stickers: {
      ...album.stickers,
      [stickerId]: updater(current)
    }
  };
}

export const useAlbumStore = create<AlbumStore>((set, get) => ({
  album: createEmptyAlbum(),
  hasHydrated: false,
  hydrate: () => {
    const album = loadLocalAlbum();
    persist(album);
    set({ album, hasHydrated: true });
  },
  replaceAlbum: (album) => {
    const normalized = normalizeAlbumState(album);
    persist(normalized);
    set({ album: normalized, hasHydrated: true });
  },
  markOwned: (stickerId) => {
    const album = get().album;
    const next = updateSticker(album, stickerId, (current) => ({
      ...current,
      owned: true,
      updatedAt: new Date().toISOString()
    }));
    persist(next);
    set({ album: next });
  },
  toggleOwned: (stickerId) => {
    const album = get().album;
    const next = updateSticker(album, stickerId, (current) => ({
      ...current,
      owned: !current?.owned,
      updatedAt: new Date().toISOString()
    }));
    persist(next);
    set({ album: next });
  },
  incrementDuplicate: (stickerId) => {
    const album = get().album;
    const next = updateSticker(album, stickerId, (current) => ({
      ...current,
      owned: true,
      duplicates: (current?.duplicates || 0) + 1,
      updatedAt: new Date().toISOString()
    }));
    persist(next);
    set({ album: next });
  },
  decrementDuplicate: (stickerId) => {
    const album = get().album;
    const next = updateSticker(album, stickerId, (current) => {
      const newDuplicates = Math.max(0, (current?.duplicates || 0) - 1);
      return {
        ...current,
        duplicates: newDuplicates,
        // se chegou a 0, desmarca como "tenho" automaticamente
        owned: newDuplicates > 0 ? current?.owned : false,
        updatedAt: new Date().toISOString()
      };
    });
    persist(next);
    set({ album: next });
  },
  addExpense: (amount) => {
    const safeAmount = Number(amount);
    if (!Number.isFinite(safeAmount) || safeAmount <= 0) return;

    const album = get().album;
    const entry: ExpenseEntry = {
      id: crypto.randomUUID(),
      amount: safeAmount,
      createdAt: new Date().toISOString()
    };
    const next = {
      ...album,
      expenses: [...album.expenses, entry]
    };
    persist(next);
    set({ album: next });
  },
  removeExpense: (id) => {
    const album = get().album;
    const next = {
      ...album,
      expenses: album.expenses.filter((entry) => entry.id !== id)
    };
    persist(next);
    set({ album: next });
  }
}));
