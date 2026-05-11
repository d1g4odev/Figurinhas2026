import { catalog } from '../album/album.utils';
import type { Sticker } from '../album/album.types';

const stickerIds = new Set(catalog.map((sticker) => sticker.id));
const catalogById = new Map(catalog.map((sticker) => [sticker.id, sticker]));

type StickerMatch = {
  stickerId: string | null;
  reason: 'code' | 'front' | 'none';
  confidence: number;
};

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeIncludes(text: string, value?: string | null) {
  if (!value) return false;
  return text.includes(normalizeText(value));
}

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

function scoreFrontSticker(text: string, sticker: Sticker) {
  let score = 0;

  if (safeIncludes(text, sticker.playerName)) score += 120;
  if (safeIncludes(text, sticker.teamNameEn)) score += 35;
  if (safeIncludes(text, sticker.teamCode)) score += 24;
  if (safeIncludes(text, sticker.number)) score += 10;

  if (sticker.stickerType === 'logo' && (safeIncludes(text, 'logo') || safeIncludes(text, 'crest'))) score += 16;
  if (sticker.stickerType === 'team_photo' && (safeIncludes(text, 'team') || safeIncludes(text, 'squad'))) score += 16;
  if (sticker.stickerType === 'intro' && safeIncludes(text, 'fifa')) score += 20;

  return score;
}

export function extractStickerMatchFromFrontText(rawText: string): StickerMatch {
  const codeMatch = extractStickerIdFromText(rawText);
  if (codeMatch) {
    return { stickerId: codeMatch, reason: 'code', confidence: 1 };
  }

  const normalizedText = normalizeText(rawText);
  if (!normalizedText) {
    return { stickerId: null, reason: 'none', confidence: 0 };
  }

  let bestSticker: Sticker | null = null;
  let bestScore = 0;
  let secondScore = 0;

  for (const sticker of catalog) {
    const score = scoreFrontSticker(normalizedText, sticker);
    if (score > bestScore) {
      secondScore = bestScore;
      bestScore = score;
      bestSticker = sticker;
    } else if (score > secondScore) {
      secondScore = score;
    }
  }

  if (!bestSticker || bestScore < 40) {
    return { stickerId: null, reason: 'none', confidence: 0 };
  }

  const confidence = secondScore ? Math.min(0.99, bestScore / (bestScore + secondScore)) : 0.99;
  return { stickerId: bestSticker.id, reason: 'front', confidence };
}

export function getStickerById(stickerId: string) {
  return catalogById.get(stickerId) || null;
}
