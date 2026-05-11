import { Camera, Check, Crosshair, Keyboard, Settings, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalog } from '../album/album.utils';
import { useAlbum } from '../album/useAlbum';
import { flagUrl } from '../../data/worldCup2026';
import { extractStickerIdFromText, extractStickerMatchFromFrontText } from './scanner.utils';

const catalogById = new Map(catalog.map((sticker) => [sticker.id, sticker]));

const AUTO_SCAN_INTERVAL = 1100;
const SAME_STICKER_COOLDOWN = 4000;

export function ScannerPage() {
  const navigate = useNavigate();
  const { album, markOwned, incrementDuplicate } = useAlbum();
  const [mode, setMode] = useState<'photo' | 'code'>('photo');
  const [manualCode, setManualCode] = useState('');
  const [status, setStatus] = useState('Aponte a câmera para a figurinha.');
  const [pendingStickerId, setPendingStickerId] = useState<string | null>(null);
  const [duplicateStickerId, setDuplicateStickerId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [quickMode, setQuickMode] = useState(false);
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

  function applyStickerDetection(stickerId: string) {
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

      const DetectorCtor = (window as unknown as {
        TextDetector?: new () => { detect: (source: ImageBitmap) => Promise<Array<{ rawValue?: string; text?: string }>> };
      }).TextDetector;

      if (!DetectorCtor) {
        setStatus('Seu browser não tem OCR. Use Código.');
        return;
      }

      const detector = new DetectorCtor();
      const cropWidth = Math.round(sourceWidth * 0.6);
      const cropHeight = Math.round(sourceHeight * 0.72);
      const cropX = Math.round((sourceWidth - cropWidth) / 2);
      const cropY = Math.round((sourceHeight - cropHeight) / 2);

      const cropped = document.createElement('canvas');
      cropped.width = cropWidth;
      cropped.height = cropHeight;
      const croppedContext = cropped.getContext('2d');
      if (!croppedContext) return;
      croppedContext.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

      const fullBitmap = await createImageBitmap(canvas);
      const cropBitmap = await createImageBitmap(cropped);
      const [cropBlocks, fullBlocks] = await Promise.all([
        detector.detect(cropBitmap),
        detector.detect(fullBitmap)
      ]);
      cropBitmap.close();
      fullBitmap.close();

      const combinedText = [...cropBlocks, ...fullBlocks]
        .map((item) => item.rawValue || item.text || '')
        .join(' ');

      const match = extractStickerMatchFromFrontText(combinedText);
      if (!match.stickerId) return;

      if (match.reason === 'front') {
        setStatus(`Frente reconhecida · confiança ${Math.round(match.confidence * 100)}%`);
      }
      applyStickerDetection(match.stickerId);
    } catch {
      // ignore — auto-scan will retry
    } finally {
      setIsScanning(false);
      scanningRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickMode, album]);

  /* Auto-scan loop while in foto mode with no modal open */
  useEffect(() => {
    if (mode !== 'photo') return;
    if (pendingStickerId || duplicateStickerId) return;
    const interval = window.setInterval(() => {
      void detectStickerFromCamera();
    }, AUTO_SCAN_INTERVAL);
    return () => window.clearInterval(interval);
  }, [mode, pendingStickerId, duplicateStickerId, detectStickerFromCamera]);

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
        : 'Auto-scan ligado · captura sozinho quando encontra'
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
        <span className="scanner-icon-btn scanner-icon-btn--ghost" aria-hidden />
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
