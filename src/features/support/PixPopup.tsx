import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

const PIX_KEY = 'd9edce4e-4718-471c-9ab6-238f434077a7';
const INTERVAL_MS = 5 * 60 * 1000;

export function PixPopup() {
  const [visible, setVisible] = useState(false);
  const { copied, copy } = useCopyToClipboard();

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, []);

  function dismiss() {
    setVisible(false);
    window.setTimeout(() => setVisible(true), INTERVAL_MS);
  }

  if (!visible) return null;

  return (
    <div className="pix-overlay" onClick={dismiss}>
      <div className="pix-card" onClick={(e) => e.stopPropagation()}>
        <button className="pix-close" onClick={dismiss} aria-label="Fechar">
          <X size={18} />
        </button>

        <span className="eyebrow">Apoie o criador</span>
        <h2 className="pix-title">Gostou do app?</h2>
        <p className="pix-body">
          Se o app está te ajudando com o álbum, manda um Pix de qualquer valor — faz a diferença!
        </p>

        <div className="pix-key-box">
          <span className="pix-key-label">Chave aleatória</span>
          <strong className="pix-key-value">Rodrigo Duarte Ribeiro</strong>
          <span className="pix-key-name">Mercado Pago</span>
        </div>

        <button
          className="button button-primary pix-copy-btn"
          onClick={() => copy(PIX_KEY)}
        >
          {copied ? '✓ Chave copiada!' : 'Copiar chave Pix'}
        </button>

        <button className="pix-dismiss" onClick={dismiss}>
          Talvez depois
        </button>
      </div>
    </div>
  );
}
