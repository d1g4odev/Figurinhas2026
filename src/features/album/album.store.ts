import { create } from 'zustand';
import type { AlbumState } from './album.types';
import { createEmptyAlbum, normalizeAlbumState } from './album.utils';

const STORAGE_KEY = 'figurinhas-copa-2026-react-v1';
const LEGACY_STORAGE_KEY = 'figurinhas-copa-2026-v1';

type AlbumStore = {
  album: AlbumState;
  hasHydrated: boolean;
  hydrate: () => void;
  replaceAlbum: (album: AlbumState) => void;
  toggleOwned: (stickerId: string) => void;
  incrementDuplicate: (stickerId: string) => void;
  decrementDuplicate: (stickerId: string) => void;
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
  toggleOwned: (stickerId) => {
    const album = get().album;
    const current = album.stickers[stickerId];
    const next = {
      ...album,
      stickers: {
        ...album.stickers,
        [stickerId]: {
          ...current,
          owned: !current?.owned,
          updatedAt: new Date().toISOString()
        }
      }
    };
    persist(next);
    set({ album: next });
  },
  incrementDuplicate: (stickerId) => {
    const album = get().album;
    const current = album.stickers[stickerId];
    const next = {
      ...album,
      stickers: {
        ...album.stickers,
        [stickerId]: {
          ...current,
          owned: true,
          duplicates: (current?.duplicates || 0) + 1,
          updatedAt: new Date().toISOString()
        }
      }
    };
    persist(next);
    set({ album: next });
  },
  decrementDuplicate: (stickerId) => {
    const album = get().album;
    const current = album.stickers[stickerId];
    const next = {
      ...album,
      stickers: {
        ...album.stickers,
        [stickerId]: {
          ...current,
          duplicates: Math.max(0, (current?.duplicates || 0) - 1),
          updatedAt: new Date().toISOString()
        }
      }
    };
    persist(next);
    set({ album: next });
  }
}));
