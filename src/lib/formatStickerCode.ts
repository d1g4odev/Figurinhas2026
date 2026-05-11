import type { Sticker } from '../features/album/album.types';

export function formatStickerCode(sticker: Pick<Sticker, 'teamCode' | 'number'>) {
  return `${sticker.teamCode} ${sticker.number}`;
}
