import { Copy } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { buildCopyText } from '../album/album.utils';
import { useAlbum } from '../album/useAlbum';

export function MissingPage() {
  const { missing } = useAlbum();
  const { copied, copy } = useCopyToClipboard();

  return (
    <section className="page-stack">
      <div className="section-head">
        <div>
          <span className="eyebrow">Lista para colar</span>
          <h2>Faltantes</h2>
          <p>{missing.length} figurinhas ainda faltam no álbum.</p>
        </div>
        <Button variant="primary" onClick={() => copy(buildCopyText('Figurinhas que faltam:', missing))}>
          <Copy size={18} />
          {copied ? 'Copiado' : 'Copiar'}
        </Button>
      </div>
      <div className="plain-list">
        {missing.map((sticker) => <span key={sticker.id}>{sticker.teamCode} {sticker.number}</span>)}
      </div>
    </section>
  );
}
