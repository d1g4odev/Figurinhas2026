import { Camera, Check, Keyboard, RefreshCcw, ScanSearch, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { catalog } from '../album/album.utils';
import { useAlbum } from '../album/useAlbum';
import { extractStickerIdFromText } from './scanner.utils';

const catalogById = new Map(catalog.map((sticker) => [sticker.id, sticker]));

export function ScannerPage() {
  const { album, markOwned, incrementDuplicate } = useAlbum();
  const [mode, setMode] = useState<'photo' | 'code'>('photo');
  const [manualCode, setManualCode] = useState('');
  const [status, setStatus] = useState('Aponte a câmera para o código da figurinha.');
  const [pendingStickerId, setPendingStickerId] = useState<string | null>(null);
  const [duplicateStickerId, setDuplicateStickerId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraAvailableRef = useRef(true);

  const pendingSticker = useMemo(
    () => (pendingStickerId ? catalogById.get(pendingStickerId) || null : null),
    [pendingStickerId]
  );
  const duplicateSticker = useMemo(
    () => (duplicateStickerId ? catalogById.get(duplicateStickerId) || null : null),
    [duplicateStickerId]
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

  function handleDetectedSticker(stickerId: string) {
    if (!catalogById.has(stickerId)) {
      setStatus('Código detectado não existe no álbum.');
      return;
    }
    setPendingStickerId(stickerId);
  }

  async function detectStickerFromCamera() {
    if (!videoRef.current || !cameraAvailableRef.current) {
      setStatus('Não consegui acessar a câmera. Use o modo Código.');
      return;
    }
    setIsScanning(true);
    setStatus('Escaneando...');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 1280;
      canvas.height = videoRef.current.videoHeight || 720;
      const context = canvas.getContext('2d');
      if (!context) {
        setStatus('Não consegui processar a imagem da câmera.');
        return;
      }
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const DetectorCtor = (window as unknown as {
        TextDetector?: new () => { detect: (source: ImageBitmap) => Promise<Array<{ rawValue?: string; text?: string }>> };
      }).TextDetector;

      if (!DetectorCtor) {
        setStatus('Seu navegador não suporta OCR nativo. Use o modo Código.');
        return;
      }

      const detector = new DetectorCtor();
      const bitmap = await createImageBitmap(canvas);
      const blocks = await detector.detect(bitmap);
      bitmap.close();
      const combinedText = blocks.map((item) => item.rawValue || item.text || '').join(' ');
      const stickerId = extractStickerIdFromText(combinedText);

      if (!stickerId) {
        setStatus('Nenhum código válido encontrado. Tente aproximar e escanear novamente.');
        return;
      }

      handleDetectedSticker(stickerId);
    } finally {
      setIsScanning(false);
    }
  }

  function detectStickerFromCode() {
    const stickerId = extractStickerIdFromText(manualCode);
    if (!stickerId) {
      setStatus('Código inválido. Exemplo: FRA19 ou GER 6.');
      return;
    }
    handleDetectedSticker(stickerId);
  }

  function confirmSticker() {
    if (!pendingSticker) return;
    const stickerState = album.stickers[pendingSticker.id];
    setPendingStickerId(null);

    if (stickerState?.owned) {
      setDuplicateStickerId(pendingSticker.id);
      return;
    }

    markOwned(pendingSticker.id);
    setStatus(`${pendingSticker.teamCode} ${pendingSticker.number} marcada no álbum.`);
  }

  function confirmDuplicate() {
    if (!duplicateSticker) return;
    incrementDuplicate(duplicateSticker.id);
    setStatus(`Repetida adicionada para ${duplicateSticker.teamCode} ${duplicateSticker.number}.`);
    setDuplicateStickerId(null);
  }

  return (
    <section className="page-stack">
      <div className="scanner-head">
        <div>
          <span className="eyebrow">Scanner</span>
          <h2>Escaneie e marque</h2>
          <p>{status}</p>
        </div>
        <div className="scanner-modes">
          <button className={mode === 'photo' ? 'active' : ''} onClick={() => setMode('photo')}>
            <Camera size={16} />
            Foto
          </button>
          <button className={mode === 'code' ? 'active' : ''} onClick={() => setMode('code')}>
            <Keyboard size={16} />
            Código
          </button>
        </div>
      </div>

      {mode === 'photo' ? (
        <div className="scanner-view">
          <video ref={videoRef} muted playsInline className="scanner-video" />
          <div className="scanner-frame" />
          <Button variant="primary" onClick={() => void detectStickerFromCamera()} disabled={isScanning}>
            <ScanSearch size={18} />
            {isScanning ? 'Escaneando...' : 'Escanear agora'}
          </Button>
        </div>
      ) : (
        <div className="scanner-code">
          <label className="search-field">
            <Keyboard size={18} />
            <input
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value.toUpperCase())}
              placeholder="Digite FRA19 ou GER 6"
            />
          </label>
          <div className="scanner-code-actions">
            <Button variant="secondary" onClick={() => setManualCode('')}>
              <RefreshCcw size={16} />
              Limpar
            </Button>
            <Button variant="primary" onClick={detectStickerFromCode}>
              <Check size={16} />
              Confirmar
            </Button>
          </div>
        </div>
      )}

      {pendingSticker && (
        <div className="overlay-card">
          <div className="overlay-card-head">
            <h3>{pendingSticker.teamCode}{pendingSticker.number}</h3>
            <button onClick={() => setPendingStickerId(null)} aria-label="Fechar">
              <X size={18} />
            </button>
          </div>
          <p>{pendingSticker.teamNameEn}</p>
          <div className="overlay-card-actions">
            <Button variant="secondary" onClick={() => setPendingStickerId(null)}>Cancelar</Button>
            <Button variant="primary" onClick={confirmSticker}>Marcar no álbum</Button>
          </div>
        </div>
      )}

      {duplicateSticker && (
        <div className="overlay-card">
          <div className="overlay-card-head">
            <h3>{duplicateSticker.teamCode}{duplicateSticker.number}</h3>
            <button onClick={() => setDuplicateStickerId(null)} aria-label="Fechar">
              <X size={18} />
            </button>
          </div>
          <p>Essa figurinha já existe no álbum. Quer marcar como repetida?</p>
          <div className="overlay-card-actions">
            <Button variant="secondary" onClick={() => setDuplicateStickerId(null)}>Cancelar</Button>
            <Button variant="primary" onClick={confirmDuplicate}>Marcar repetida</Button>
          </div>
        </div>
      )}
    </section>
  );
}
