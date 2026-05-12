import { createCatalog, DATA_VERSION, TOTAL_STICKERS } from '../../data/worldCup2026';
import { formatStickerCode } from '../../lib/formatStickerCode';
import type { AlbumState, AlbumSummary, Sticker } from './album.types';

export const catalog = createCatalog();

export function createEmptyAlbum(): AlbumState {
  return {
    version: DATA_VERSION,
    stickers: Object.fromEntries(catalog.map((sticker) => [sticker.id, { owned: false, duplicates: 0 }])),
    expenses: []
  };
}

export function normalizeAlbumState(state?: Partial<AlbumState> | null): AlbumState {
  const empty = createEmptyAlbum();
  if (!state?.stickers) return empty;

  return {
    version: DATA_VERSION,
    stickers: Object.fromEntries(
      catalog.map((sticker) => {
        const current = state.stickers?.[sticker.id];
        return [
          sticker.id,
          {
            owned: Boolean(current?.owned),
            duplicates: Math.max(0, Number(current?.duplicates || 0)),
            updatedAt: current?.updatedAt
          }
        ];
      })
    ),
    expenses: (state.expenses || [])
      .filter((entry) => Number(entry.amount) > 0)
      .map((entry) => ({
        id: entry.id || crypto.randomUUID(),
        amount: Number(entry.amount),
        createdAt: entry.createdAt || new Date().toISOString()
      }))
  };
}

export function summarizeAlbum(state: AlbumState): AlbumSummary {
  const values = Object.values(state.stickers);
  const owned = values.filter((sticker) => sticker.owned).length;
  return {
    total: TOTAL_STICKERS,
    owned,
    missing: TOTAL_STICKERS - owned,
    duplicates: values.reduce((sum, sticker) => sum + sticker.duplicates, 0),
    totalSpent: state.expenses.reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
  };
}

export function isAlbumPristine(state: AlbumState) {
  const summary = summarizeAlbum(state);
  return summary.owned === 0 && summary.duplicates === 0 && summary.totalSpent === 0;
}

export function stickerLine(sticker: Sticker) {
  return formatStickerCode(sticker);
}

export function ownedStickers(state: AlbumState) {
  return catalog.filter((sticker) => state.stickers[sticker.id]?.owned);
}

export function missingStickers(state: AlbumState) {
  return catalog.filter((sticker) => !state.stickers[sticker.id]?.owned);
}

export function duplicateStickers(state: AlbumState) {
  return catalog.filter((sticker) => (state.stickers[sticker.id]?.duplicates || 0) > 0);
}

export function buildCopyText(title: string, stickers: Sticker[], state?: AlbumState) {
  if (!stickers.length) return `${title}\nNenhuma figurinha nesta lista.`;

  const lines = stickers.map((sticker) => {
    const duplicates = state?.stickers[sticker.id]?.duplicates || 0;
    const suffix = duplicates > 1 ? ` x${duplicates}` : '';
    return `${stickerLine(sticker)}${suffix}`;
  });

  return `${title}\n${lines.join('\n')}`;
}
