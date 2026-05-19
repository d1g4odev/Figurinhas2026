import { createCatalog, DATA_VERSION, flagEmoji, TOTAL_STICKERS } from '../../data/worldCup2026';
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

  // Antes da v8, `duplicates` guardava só os extras (0 = tenho 1, 1 = tenho 2…).
  // De v8 em diante, `duplicates` é a contagem TOTAL (0 = não tenho, 1 = tenho, >1 = repetida).
  const incomingVersion = Number(state.version || 0);
  const needsCountMigration = incomingVersion < 8;

  return {
    version: DATA_VERSION,
    stickers: Object.fromEntries(
      catalog.map((sticker) => {
        const current = state.stickers?.[sticker.id];
        const rawDuplicates = Math.max(0, Number(current?.duplicates || 0));
        const wasOwned = Boolean(current?.owned);
        const count = needsCountMigration
          ? (wasOwned ? rawDuplicates + 1 : 0)
          : rawDuplicates;
        return [
          sticker.id,
          {
            owned: count > 0,
            duplicates: count,
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
    duplicates: values.reduce((sum, sticker) => sum + Math.max(0, sticker.duplicates - 1), 0),
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
  return catalog.filter((sticker) => (state.stickers[sticker.id]?.duplicates || 0) > 1);
}

export function buildCopyText(title: string, stickers: Sticker[], _state?: AlbumState) {
  if (!stickers.length) return `*${title}*\nNenhuma figurinha nesta lista.`;

  const byTeam = new Map<string, { flagCode: string; numbers: string[] }>();
  for (const sticker of stickers) {
    if (!byTeam.has(sticker.teamCode)) {
      byTeam.set(sticker.teamCode, { flagCode: sticker.flagCode, numbers: [] });
    }
    byTeam.get(sticker.teamCode)!.numbers.push(sticker.number);
  }

  const lines: string[] = [];
  for (const [teamCode, { flagCode, numbers }] of byTeam) {
    lines.push(`${flagEmoji(flagCode)} ${teamCode} ${numbers.join(', ')}`);
  }

  const appUrl = window.location.origin;
  const footer = `📲 Use o App pra gerenciar seu álbum!\n${appUrl}`;

  return `*${title}*\n\n${lines.join('\n')}\n\n${footer}`;
}
