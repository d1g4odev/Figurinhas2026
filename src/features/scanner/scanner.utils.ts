import { catalog } from '../album/album.utils';

const stickerIds = new Set(catalog.map((sticker) => sticker.id));

function toStickerId(teamCode: string, numberText: string) {
  const safeNumber = String(Number(numberText));
  const normalized = `${teamCode}${safeNumber}`;
  return stickerIds.has(normalized) ? normalized : null;
}

export function extractStickerIdFromText(text: string) {
  const normalized = text.toUpperCase();
  const tokens = normalized.match(/FWC\s?\d{1,2}|[A-Z]{3}\s?\d{1,2}/g) || [];

  for (const token of tokens) {
    const compact = token.replace(/\s+/g, '');
    if (compact.startsWith('FWC')) {
      const number = compact.replace('FWC', '');
      const id = number === '00' ? 'FWC00' : `FWC${String(Number(number))}`;
      if (stickerIds.has(id)) return id;
      continue;
    }

    const teamCode = compact.slice(0, 3);
    const number = compact.slice(3);
    const id = toStickerId(teamCode, number);
    if (id) return id;
  }

  return null;
}
