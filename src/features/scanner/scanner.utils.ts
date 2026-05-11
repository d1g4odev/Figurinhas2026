import { catalog } from '../album/album.utils';
import type { Sticker } from '../album/album.types';
import visualIndexData from '../../data/panini2026-visual-index.json';

const stickerIds = new Set(catalog.map((sticker) => sticker.id));
const catalogById = new Map(catalog.map((sticker) => [sticker.id, sticker]));
const HASH_SIZE = 16;

type VisualIndexEntry = {
  id: string;
  type: string;
  fullHash: string;
  portraitHash: string;
  width: number;
  height: number;
  sourceUrl?: string;
};

type VisualIndexFile = {
  version: number;
  generatedAt: string | null;
  count: number;
  items: VisualIndexEntry[];
};

type StickerMatch = {
  stickerId: string | null;
  reason: 'code' | 'front' | 'visual' | 'none';
  confidence: number;
};

const visualIndex = visualIndexData as VisualIndexFile;

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

function computeHashFromContext(
  context: CanvasRenderingContext2D,
  crop: { x: number; y: number; width: number; height: number }
) {
  const cols = HASH_SIZE + 1;
  const rows = HASH_SIZE;
  const hashCanvas = document.createElement('canvas');
  hashCanvas.width = cols;
  hashCanvas.height = rows;
  const hashContext = hashCanvas.getContext('2d');
  if (!hashContext) return null;

  hashContext.filter = 'grayscale(1) contrast(1.15)';
  hashContext.drawImage(
    context.canvas,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    cols,
    rows
  );

  const pixels = hashContext.getImageData(0, 0, cols, rows).data;
  const bits: string[] = [];

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols - 1; x += 1) {
      const left = pixels[(y * cols + x) * 4];
      const right = pixels[(y * cols + x + 1) * 4];
      bits.push(left > right ? '1' : '0');
    }
  }

  const hex: string[] = [];
  for (let i = 0; i < bits.length; i += 4) {
    hex.push(parseInt(bits.slice(i, i + 4).join(''), 2).toString(16));
  }

  return hex.join('');
}

function hammingDistance(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return Number.POSITIVE_INFINITY;

  let distance = 0;
  for (let i = 0; i < a.length; i += 1) {
    const xor = Number.parseInt(a[i], 16) ^ Number.parseInt(b[i], 16);
    distance += xor.toString(2).replace(/0/g, '').length;
  }

  return distance;
}

export function createFrameHashes(
  context: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const fullCrop = { x: 0, y: 0, width, height };
  const portraitCrop = {
    x: Math.round(width * 0.18),
    y: Math.round(height * 0.1),
    width: Math.round(width * 0.64),
    height: Math.round(height * 0.76)
  };

  return {
    fullHash: computeHashFromContext(context, fullCrop),
    portraitHash: computeHashFromContext(context, portraitCrop)
  };
}

export function matchStickerByVisualHashes(
  hashes: { fullHash: string | null; portraitHash: string | null },
  expectedType?: Sticker['stickerType'] | null
): StickerMatch {
  if (!hashes.fullHash || !hashes.portraitHash) {
    return { stickerId: null, reason: 'none', confidence: 0 };
  }

  const candidates = expectedType
    ? visualIndex.items.filter((item) => item.type === expectedType)
    : visualIndex.items;

  if (!candidates.length) {
    return { stickerId: null, reason: 'none', confidence: 0 };
  }

  let best: VisualIndexEntry | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  let secondScore = Number.POSITIVE_INFINITY;

  for (const item of candidates) {
    const fullDistance = hammingDistance(hashes.fullHash, item.fullHash);
    const portraitDistance = hammingDistance(hashes.portraitHash, item.portraitHash);
    const score = fullDistance * 0.4 + portraitDistance * 0.6;

    if (score < bestScore) {
      secondScore = bestScore;
      bestScore = score;
      best = item;
    } else if (score < secondScore) {
      secondScore = score;
    }
  }

  if (!best || !Number.isFinite(bestScore)) {
    return { stickerId: null, reason: 'none', confidence: 0 };
  }

  const separation = Number.isFinite(secondScore) ? Math.max(0, secondScore - bestScore) : 40;
  const confidence = Math.max(
    0,
    Math.min(0.99, 0.45 + separation / 40 - Math.min(bestScore, 48) / 96)
  );

  if (confidence < 0.62) {
    return { stickerId: null, reason: 'none', confidence };
  }

  return { stickerId: best.id, reason: 'visual', confidence };
}

export function getVisualIndexStats() {
  return {
    count: visualIndex.count,
    generatedAt: visualIndex.generatedAt
  };
}
