import { Camera, Check, Clock3, Crosshair, Keyboard, Settings, Sparkles, X, Zap } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalog } from '../album/album.utils';
import { useAlbum } from '../album/useAlbum';
import { flagUrl } from '../../data/worldCup2026';
import {
  createFrameHashes,
  extractStickerIdFromText,
  extractStickerCandidatesFromFrontText,
  getVisualIndexStats,
  matchStickerCandidatesByVisualHashes,
  type StickerCandidate
} from './scanner.utils';
import { recognizeTextFromCanvases, warmUpScannerOcr } from './scanner.ocr';

const catalogById = new Map(catalog.map((sticker) => [sticker.id, sticker]));

const AUTO_SCAN_INTERVAL = 1100;
const SAME_STICKER_COOLDOWN = 4000;
const visualIndexStats = getVisualIndexStats();
const PHOTO_FRAME_WIDTH = 0.6;
const PHOTO_FRAME_HEIGHT = 0.72;

type ScanPreset = 'turbo' | 'classic';
type OcrEngine = 'auto' | 'native' | 'tesseract';

function cropCanvas(
  source: HTMLCanvasElement,
  crop: { x: number; y: number; width: number; height: number },
  outputWidth = crop.width,
  outputHeight = crop.height
) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(outputWidth));
  canvas.height = Math.max(1, Math.round(outputHeight));
  const context = canvas.getContext('2d');
  if (!context) return canvas;
  context.drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function applyThreshold(canvas: HTMLCanvasElement, threshold = 132) {
  const context = canvas.getContext('2d');
  if (!context) return canvas;
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = image.data;

  for (let index = 0; index < pixels.length; index += 4) {
    const gray = pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114;
    const value = gray > threshold ? 255 : 0;
    pixels[index] = value;
    pixels[index + 1] = value;
    pixels[index + 2] = value;
  }

  context.putImageData(image, 0, 0);
  return canvas;
}

function filterCanvas(
  source: HTMLCanvasElement,
  filter: string,
  scale = 1,
  cropInset = 0
) {
  const crop = {
    x: Math.round(source.width * cropInset),
    y: Math.round(source.height * cropInset),
    width: Math.round(source.width * (1 - cropInset * 2)),
    height: Math.round(source.height * (1 - cropInset * 2))
  };
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(crop.width * scale));
  canvas.height = Math.max(1, Math.round(crop.height * scale));
  const context = canvas.getContext('2d');
  if (!context) return canvas;
  context.filter = filter;
  context.drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function buildScanPayload(canvas: HTMLCanvasElement, preset: ScanPreset) {
  const cropWidth = Math.round(canvas.width * PHOTO_FRAME_WIDTH);
  const cropHeight = Math.round(canvas.height * PHOTO_FRAME_HEIGHT);
  const cropX = Math.round((canvas.width - cropWidth) / 2);
  const cropY = Math.round((canvas.height - cropHeight) / 2);
  const baseCrop = cropCanvas(canvas, { x: cropX, y: cropY, width: cropWidth, height: cropHeight });

  if (preset === 'classic') {
    return {
      primary: baseCrop,
      ocrCanvases: [baseCrop],
      visualCanvases: [baseCrop]
    };
  }

  const zoomCrop = filterCanvas(baseCrop, 'contrast(1.45) saturate(1.1)', 1.3, 0.08);
  const contrastCrop = filterCanvas(baseCrop, 'grayscale(1) contrast(2.1) brightness(1.08)', 1.15);
  const thresholdCrop = applyThreshold(filterCanvas(baseCrop, 'grayscale(1) contrast(2.4) brightness(1.14)', 1.2), 148);

  return {
    primary: baseCrop,
    ocrCanvases: [baseCrop, zoomCrop, contrastCrop, thresholdCrop],
    visualCanvases: [baseCrop, zoomCrop]
  };
}

function mergeCandidates(candidateLists: StickerCandidate[][]) {
  const merged = new Map<string, StickerCandidate>();

  for (const list of candidateLists) {
    for (const candidate of list) {
      const previous = merged.get(candidate.stickerId);
      if (!previous || candidate.confidence > previous.confidence || candidate.score > previous.score) {
        merged.set(candidate.stickerId, candidate);
      }
    }
  }

  return [...merged.values()].sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return b.score - a.score;
  });
}

export function ScannerPage() {
  const navigate = useNavigate();
  const { album, markOwned, incrementDuplicate } = useAlbum();
  const [mode, setMode] = useState<'photo' | 'code'>('photo');
  const [scanPreset, setScanPreset] = useState<ScanPreset>('turbo');
  const [ocrEngine, setOcrEngine] = useState<OcrEngine>('auto');
  const [manualCode, setManualCode] = useState('');
  const [status, setStatus] = useState('Aponte a câmera para a figurinha.');
  const [pendingStickerId, setPendingStickerId] = useState<string | null>(null);
  const [pendingCandidateIds, setPendingCandidateIds] = useState<string[]>([]);
  const [duplicateStickerId, setDuplicateStickerId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [quickMode, setQuickMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editedCode, setEditedCode] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraAvailableRef = useRef(true);
  const scanningRef = useRef(false);
  const lastDetectedRef = useRef<{ id: string; at: number } | null>(null);

  const pendingSticker = useMemo(
    () => (pendingStickerId ? catalogById.get(pendingStickerId) || null : null),
    [pendingStickerId]
  );
  const duplicateSticker = useMemo(
    () => (duplicateStickerId ? catalogById.get(duplicateStickerId) || null : null),
    [duplicateStickerId]
  );

  /* Live re-mapping of the modal preview as user edits the code. */
  const previewSticker = useMemo(() => {
    if (!pendingSticker) return null;
    const normalized = editedCode.toUpperCase().replace(/\s+/g, '');
    if (!normalized) return pendingSticker;
    const candidateId = extractStickerIdFromText(normalized);
    if (candidateId) return catalogById.get(candidateId) || pendingSticker;
    return pendingSticker;
  }, [editedCode, pendingSticker]);
  const alternateCandidates = useMemo(
    () => pendingCandidateIds
      .filter((candidateId) => candidateId !== previewSticker?.id)
      .map((candidateId) => catalogById.get(candidateId))
      .filter((candidate): candidate is NonNullable<typeof candidate> => !!candidate)
      .slice(0, 3),
    [pendingCandidateIds, previewSticker]
  );

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(async () => {
    if (mode !== 'photo' || streamRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      cameraAvailableRef.current = true;
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      cameraAvailableRef.current = false;
    }
  }, [mode]);

  useEffect(() => {
    if (mode === 'photo') void startCamera();
    if (mode === 'code') stopCamera();
    return stopCamera;
  }, [mode, startCamera, stopCamera]);

  useEffect(() => {
    if (mode !== 'photo') return;
    warmUpScannerOcr(ocrEngine).catch(() => undefined);
  }, [mode, ocrEngine]);

  function applyStickerDetection(stickerId: string, candidateIds: string[] = []) {
    const sticker = catalogById.get(stickerId);
    if (!sticker) {
      setStatus('Código não está no álbum.');
      return;
    }
    const last = lastDetectedRef.current;
    if (last && last.id === stickerId && Date.now() - last.at < SAME_STICKER_COOLDOWN) {
      return;
    }
    lastDetectedRef.current = { id: stickerId, at: Date.now() };

    if (quickMode) {
      const state = album.stickers[stickerId];
      if (state?.owned) {
        incrementDuplicate(stickerId);
        setStatus(`${sticker.teamCode} ${sticker.number} · repetida adicionada`);
      } else {
        markOwned(stickerId);
        setStatus(`${sticker.teamCode} ${sticker.number} · marcada`);
      }
      return;
    }
    setPendingStickerId(stickerId);
    setPendingCandidateIds(candidateIds);
    setEditedCode(`${sticker.teamCode}${sticker.number}`);
  }

  const detectStickerFromCamera = useCallback(async () => {
    if (scanningRef.current) return;
    if (!videoRef.current || !cameraAvailableRef.current) return;
    scanningRef.current = true;
    setIsScanning(true);

    try {
      const canvas = document.createElement('canvas');
      const sourceWidth = videoRef.current.videoWidth || 1280;
      const sourceHeight = videoRef.current.videoHeight || 720;
      canvas.width = sourceWidth;
      canvas.height = sourceHeight;
      const context = canvas.getContext('2d');
      if (!context) return;
      context.drawImage(videoRef.current, 0, 0, sourceWidth, sourceHeight);

      const payload = buildScanPayload(canvas, scanPreset);
      const visualCandidates = payload.visualCanvases
        .flatMap((variant) => {
          const variantContext = variant.getContext('2d');
          if (!variantContext) return [];
          return matchStickerCandidatesByVisualHashes(
            createFrameHashes(variantContext, variant.width, variant.height),
            undefined,
            2
          );
        })
        .slice(0, 4);

      const recognizedChunks = await recognizeTextFromCanvases(payload.ocrCanvases, ocrEngine);
      const combinedText = recognizedChunks.join(' ').trim();
      const textCandidates = extractStickerCandidatesFromFrontText(combinedText, 3);
      const candidates = mergeCandidates([visualCandidates, textCandidates]).slice(0, 3);

      if (!candidates.length) {
        setStatus(
          scanPreset === 'turbo'
            ? 'Turbo leu o frame, mas ainda não encontrei um candidato forte.'
            : 'Não reconheci essa figurinha. Tente aproximar um pouco.'
        );
        return;
      }

      const [bestCandidate] = candidates;
      const candidateIds = candidates.map((candidate) => candidate.stickerId);
      const reasonLabel =
        bestCandidate.reason === 'visual'
          ? 'Visual reconhecido'
          : bestCandidate.reason === 'code'
            ? 'Código reconhecido'
            : 'Frente reconhecida';

      setStatus(`${reasonLabel} · confiança ${Math.round(bestCandidate.confidence * 100)}%`);
      applyStickerDetection(bestCandidate.stickerId, candidateIds);
    } catch {
      // ignore — auto-scan will retry
    } finally {
      setIsScanning(false);
      scanningRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickMode, album, scanPreset, ocrEngine]);

  /* Auto-scan loop while in foto mode with no modal open */
  useEffect(() => {
    if (mode !== 'photo') return;
    if (pendingStickerId || duplicateStickerId || settingsOpen) return;
    const interval = window.setInterval(() => {
      void detectStickerFromCamera();
    }, AUTO_SCAN_INTERVAL);
    return () => window.clearInterval(interval);
  }, [mode, pendingStickerId, duplicateStickerId, settingsOpen, detectStickerFromCamera]);

  function detectStickerFromCode() {
    const stickerId = extractStickerIdFromText(manualCode);
    if (!stickerId) {
      setStatus('Código inválido. Exemplo: FRA19 ou GER 6.');
      return;
    }
    applyStickerDetection(stickerId);
  }

  function dismissPending() {
    setPendingStickerId(null);
    setPendingCandidateIds([]);
    setEditedCode('');
    /* short cooldown so the same sticker in view doesn't re-trigger immediately */
    lastDetectedRef.current = { id: '__dismissed__', at: Date.now() };
  }

  function confirmSticker() {
    if (!previewSticker) return;
    const stickerState = album.stickers[previewSticker.id];
    setPendingStickerId(null);
    setEditedCode('');

    if (stickerState?.owned) {
      setDuplicateStickerId(previewSticker.id);
      return;
    }

    markOwned(previewSticker.id);
    setStatus(`${previewSticker.teamCode} ${previewSticker.number} marcada no álbum.`);
  }

  function confirmDuplicate() {
    if (!duplicateSticker) return;
    incrementDuplicate(duplicateSticker.id);
    setStatus(`Repetida adicionada para ${duplicateSticker.teamCode} ${duplicateSticker.number}.`);
    setDuplicateStickerId(null);
  }

  const helperLine =
    mode === 'photo'
      ? <>Aponte para a <em>frente da figurinha</em></>
      : <>Digite o <em>código</em> da figurinha</>;

  const helperSub =
    mode === 'photo'
      ? quickMode
        ? 'Auto-scan ligado · Quick mode marca direto'
        : scanPreset === 'turbo'
          ? `Turbo ligado · multi-zoom + OCR ${ocrEngine === 'auto' ? 'híbrido' : ocrEngine}`
          : visualIndexStats.count
            ? `Clássico ligado · índice visual com ${visualIndexStats.count} figurinhas`
            : 'Clássico ligado · leitura simples da frente da figurinha'
      : status;

  return (
    <section className="scanner-screen">
      {mode === 'photo' ? (
        <div className="scanner-camera">
          <video ref={videoRef} muted playsInline className="scanner-video" />
          <div className="scanner-frame" aria-hidden />
        </div>
      ) : (
        <div className="scanner-camera scanner-camera--code">
          <div className="scanner-code-form">
            <Keyboard size={22} />
            <input
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value.toUpperCase())}
              placeholder="FRA19, GER 6..."
              autoFocus
              spellCheck={false}
              inputMode="text"
            />
          </div>
        </div>
      )}

      <div className="scanner-top">
        <button
          type="button"
          className="scanner-icon-btn"
          onClick={() => navigate('/album')}
          aria-label="Fechar scanner"
        >
          <X size={20} />
        </button>
        <div className="scanner-status">
          <Crosshair size={14} />
          {isScanning ? 'Escaneando' : 'Pronto'}
        </div>
        <button
          type="button"
          className="scanner-icon-btn"
          onClick={() => setSettingsOpen(true)}
          aria-label="Abrir configurações do scanner"
        >
          <Settings size={18} />
        </button>
      </div>

      <div className="scanner-mode-toggle" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'photo'}
          className={mode === 'photo' ? 'active' : ''}
          onClick={() => setMode('photo')}
        >
          <Camera size={14} />
          Foto
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'code'}
          className={mode === 'code' ? 'active' : ''}
          onClick={() => setMode('code')}
        >
          <Keyboard size={14} />
          Código
        </button>
      </div>

      <div className="scanner-helper">
        <p className="scanner-helper-main">{helperLine}</p>
        <p className="scanner-helper-sub">{helperSub}</p>
      </div>

      <div className="scanner-bottom">
        <div className="scanner-quick">
          <Settings size={18} />
          <div className="scanner-quick-text">
            <strong>Quick mode</strong>
            <small>Marca direto, sem confirmar</small>
          </div>
          <label className="scanner-switch">
            <input
              type="checkbox"
              checked={quickMode}
              onChange={(event) => setQuickMode(event.target.checked)}
              aria-label="Ativar Quick mode"
            />
            <span />
          </label>
        </div>
        {mode === 'photo' && (
          <button
            type="button"
            className="scanner-shoot"
            onClick={() => void detectStickerFromCamera()}
            disabled={isScanning}
          >
            <Sparkles size={18} />
            {isScanning ? 'Lendo figurinha...' : scanPreset === 'turbo' ? 'Escanear agora' : 'Capturar agora'}
          </button>
        )}
        {mode === 'code' && (
          <button
            type="button"
            className="scanner-shoot"
            onClick={detectStickerFromCode}
          >
            <Check size={18} />
            Confirmar código
          </button>
        )}
      </div>

      {settingsOpen && (
        <div className="scanner-modal-backdrop" onClick={() => setSettingsOpen(false)}>
          <div className="scanner-modal scanner-settings-modal" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="scanner-modal-close"
              onClick={() => setSettingsOpen(false)}
              aria-label="Fechar configurações"
            >
              <X size={18} />
            </button>
            <div className="scanner-settings-head">
              <h3>Configurações do scanner</h3>
              <p>Escolha como o scanner lê as figurinhas. Apenas um modo fica ativo por vez.</p>
            </div>

            <button
              type="button"
              className={`scanner-settings-option ${scanPreset === 'turbo' ? 'active' : ''}`}
              onClick={() => setScanPreset('turbo')}
            >
              <span className="scanner-settings-option-icon scanner-settings-option-icon--turbo">
                <Zap size={18} />
              </span>
              <span className="scanner-settings-option-copy">
                <strong>Turbo (multi-zoom + alto contraste)</strong>
                <small>Faz zoom digital em varias escalas e aplica contraste antes do OCR. Melhor para iPhone e cartas com brilho.</small>
              </span>
              <span className="scanner-settings-badge">Padrão</span>
              <label className="scanner-switch">
                <input
                  type="checkbox"
                  checked={scanPreset === 'turbo'}
                  onChange={() => setScanPreset('turbo')}
                  aria-label="Ativar modo turbo"
                />
                <span />
              </label>
            </button>

            <button
              type="button"
              className={`scanner-settings-option ${scanPreset === 'classic' ? 'active' : ''}`}
              onClick={() => setScanPreset('classic')}
            >
              <span className="scanner-settings-option-icon scanner-settings-option-icon--classic">
                <Clock3 size={18} />
              </span>
              <span className="scanner-settings-option-copy">
                <strong>Clássico (sem zoom automático)</strong>
                <small>Captura uma única escala, sem pré-processamento pesado. Mais leve e útil em aparelhos lentos.</small>
              </span>
              <label className="scanner-switch">
                <input
                  type="checkbox"
                  checked={scanPreset === 'classic'}
                  onChange={() => setScanPreset('classic')}
                  aria-label="Ativar modo clássico"
                />
                <span />
              </label>
            </button>

            <div className="scanner-settings-engine">
              <span>OCR</span>
              <div className="scanner-settings-engine-buttons">
                {(['auto', 'native', 'tesseract'] as OcrEngine[]).map((engine) => (
                  <button
                    key={engine}
                    type="button"
                    className={ocrEngine === engine ? 'active' : ''}
                    onClick={() => setOcrEngine(engine)}
                  >
                    {engine === 'auto' ? 'Auto' : engine === 'native' ? 'Nativo' : 'Tesseract'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {previewSticker && (
        <div className="scanner-modal-backdrop" onClick={dismissPending}>
          <div className="scanner-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="scanner-modal-close"
              onClick={dismissPending}
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
            <div className="scanner-preview">
              <div className="scanner-preview-card">
                {previewSticker.imageUrl ? (
                  <img
                    src={previewSticker.imageUrl}
                    alt=""
                    className="scanner-preview-card-image"
                  />
                ) : (
                  <img src={flagUrl(previewSticker.flagCode, 160)} alt="" />
                )}
                <span className="scanner-preview-card-code">
                  {previewSticker.teamCode} {previewSticker.number}
                </span>
              </div>
              <h3 className="scanner-preview-code">
                {previewSticker.teamCode}{previewSticker.number}
              </h3>
              <p className="scanner-preview-name">
                {previewSticker.playerName
                  ? `${previewSticker.playerName} · ${previewSticker.teamNameEn}`
                  : previewSticker.label}
              </p>
            </div>
            <input
              className="scanner-modal-input"
              value={editedCode}
              onChange={(event) => setEditedCode(event.target.value.toUpperCase())}
              spellCheck={false}
              inputMode="text"
              aria-label="Código da figurinha (editável)"
            />
            {alternateCandidates.length > 0 && (
              <div className="scanner-candidate-list">
                {alternateCandidates.map((candidate) => (
                  <button
                    key={candidate.id}
                    type="button"
                    className="scanner-candidate-chip"
                    onClick={() => setEditedCode(`${candidate.teamCode}${candidate.number}`)}
                  >
                    {candidate.teamCode}{candidate.number}
                  </button>
                ))}
              </div>
            )}
            <div className="scanner-modal-actions">
              <button
                type="button"
                className="scanner-modal-cancel"
                onClick={dismissPending}
              >
                <X size={16} />
                Cancelar
              </button>
              <button
                type="button"
                className="scanner-modal-confirm"
                onClick={confirmSticker}
              >
                <Check size={16} />
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {duplicateSticker && (
        <div className="scanner-modal-backdrop" onClick={() => setDuplicateStickerId(null)}>
          <div className="scanner-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="scanner-modal-close"
              onClick={() => setDuplicateStickerId(null)}
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
            <div className="scanner-preview">
              <div className="scanner-preview-card">
                {duplicateSticker.imageUrl ? (
                  <img
                    src={duplicateSticker.imageUrl}
                    alt=""
                    className="scanner-preview-card-image"
                  />
                ) : (
                  <img src={flagUrl(duplicateSticker.flagCode, 160)} alt="" />
                )}
                <span className="scanner-preview-card-code">
                  {duplicateSticker.teamCode} {duplicateSticker.number}
                </span>
              </div>
              <h3 className="scanner-preview-code">
                {duplicateSticker.teamCode}{duplicateSticker.number}
              </h3>
              <p className="scanner-preview-name">Você já tem essa. Marcar como repetida?</p>
            </div>
            <div className="scanner-modal-actions">
              <button
                type="button"
                className="scanner-modal-cancel"
                onClick={() => setDuplicateStickerId(null)}
              >
                <X size={16} />
                Cancelar
              </button>
              <button
                type="button"
                className="scanner-modal-confirm"
                onClick={confirmDuplicate}
              >
                <Check size={16} />
                Marcar repetida
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
