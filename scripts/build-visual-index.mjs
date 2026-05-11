import { readFile, writeFile } from 'node:fs/promises';
import { createCanvas, loadImage } from '@napi-rs/canvas';

const INPUT = 'src/data/panini2026.json';
const OUTPUT = 'src/data/panini2026-visual-index.json';
const CONCURRENCY = 12;

const raw = await readFile(INPUT, 'utf8');
const data = JSON.parse(raw);
const stickers = [...data.intro, ...data.base].filter((item) => item.imageUrl);

function computeDHash(image, crop, cols = 9, rows = 8) {
  const canvas = createCanvas(cols, rows);
  const ctx = canvas.getContext('2d');
  ctx.filter = 'grayscale(1) contrast(1.15)';
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, cols, rows);
  const { data: pixels } = ctx.getImageData(0, 0, cols, rows);
  const bits = [];

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols - 1; x += 1) {
      const left = pixels[(y * cols + x) * 4];
      const right = pixels[(y * cols + x + 1) * 4];
      bits.push(left > right ? '1' : '0');
    }
  }

  const hex = [];
  for (let i = 0; i < bits.length; i += 4) {
    hex.push(parseInt(bits.slice(i, i + 4).join(''), 2).toString(16));
  }
  return hex.join('');
}

function stickerCrops(image, type) {
  const width = image.width;
  const height = image.height;
  const full = { x: 0, y: 0, width, height };

  if (type === 'player') {
    return {
      full,
      portrait: {
        x: Math.round(width * 0.14),
        y: Math.round(height * 0.12),
        width: Math.round(width * 0.72),
        height: Math.round(height * 0.62)
      }
    };
  }

  if (type === 'team_photo') {
    return {
      full,
      portrait: {
        x: Math.round(width * 0.08),
        y: Math.round(height * 0.18),
        width: Math.round(width * 0.84),
        height: Math.round(height * 0.48)
      }
    };
  }

  return {
    full,
    portrait: {
      x: Math.round(width * 0.12),
      y: Math.round(height * 0.12),
      width: Math.round(width * 0.76),
      height: Math.round(height * 0.58)
    }
  };
}

async function processSticker(item) {
  const response = await fetch(item.imageUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      Referer: 'https://www.laststicker.com/',
      Origin: 'https://www.laststicker.com'
    }
  });
  if (!response.ok) {
    throw new Error(`Falha ao baixar ${item.code}: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const image = await loadImage(buffer);
  const crops = stickerCrops(image, item.type);

  return {
    id: item.code,
    sourceUrl: item.imageUrl,
    type: item.type || 'player',
    fullHash: computeDHash(image, crops.full),
    portraitHash: computeDHash(image, crops.portrait),
    width: image.width,
    height: image.height
  };
}

const results = [];
let index = 0;

async function worker() {
  while (index < stickers.length) {
    const current = stickers[index];
    index += 1;
    try {
      const entry = await processSticker(current);
      results.push(entry);
      console.log(`✓ ${entry.id}`);
    } catch (error) {
      console.warn(`x ${current.code} · ${error instanceof Error ? error.message : 'falha desconhecida'}`);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
results.sort((a, b) => a.id.localeCompare(b.id));

await writeFile(OUTPUT, `${JSON.stringify({
  version: 1,
  generatedAt: new Date().toISOString(),
  count: results.length,
  items: results
}, null, 2)}\n`);

console.log(`\npronto · ${results.length} fingerprints em ${OUTPUT}`);
