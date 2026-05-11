type NativeBlock = { rawValue?: string; text?: string };

type OcrEngine = 'auto' | 'native' | 'tesseract';

type ScannerWorker = {
  recognize: (image: HTMLCanvasElement) => Promise<{ data: { text: string } }>;
};

let tesseractWorkerPromise: Promise<ScannerWorker> | null = null;

async function getNativeDetector() {
  const DetectorCtor = (window as unknown as {
    TextDetector?: new () => { detect: (source: ImageBitmap) => Promise<NativeBlock[]> };
  }).TextDetector;

  if (!DetectorCtor) return null;
  return new DetectorCtor();
}

async function getTesseractWorker() {
  if (!tesseractWorkerPromise) {
    tesseractWorkerPromise = import('tesseract.js').then(async ({ createWorker }) => {
      const worker = await createWorker('eng', 1, {
        logger: () => undefined
      });
      return worker as ScannerWorker;
    });
  }

  return tesseractWorkerPromise;
}

async function detectWithNative(canvases: HTMLCanvasElement[]) {
  const detector = await getNativeDetector();
  if (!detector) return [];

  const chunks: string[] = [];
  for (const canvas of canvases) {
    const bitmap = await createImageBitmap(canvas);
    try {
      const blocks = await detector.detect(bitmap);
      const text = blocks.map((item) => item.rawValue || item.text || '').join(' ').trim();
      if (text) chunks.push(text);
    } finally {
      bitmap.close();
    }
  }

  return chunks;
}

async function detectWithTesseract(canvases: HTMLCanvasElement[]) {
  const worker = await getTesseractWorker();
  const chunks: string[] = [];

  for (const canvas of canvases) {
    const result = await worker.recognize(canvas);
    const text = result.data.text.trim();
    if (text) chunks.push(text);
  }

  return chunks;
}

export async function recognizeTextFromCanvases(
  canvases: HTMLCanvasElement[],
  engine: OcrEngine
) {
  if (engine === 'native') {
    return detectWithNative(canvases);
  }

  if (engine === 'tesseract') {
    return detectWithTesseract(canvases);
  }

  const nativeChunks = await detectWithNative(canvases);
  if (nativeChunks.join(' ').replace(/\s+/g, '').length >= 6) {
    return nativeChunks;
  }

  const tesseractChunks = await detectWithTesseract(canvases);
  return [...nativeChunks, ...tesseractChunks];
}

export async function warmUpScannerOcr(engine: OcrEngine) {
  if (engine === 'tesseract' || engine === 'auto') {
    await getTesseractWorker();
  }
}
