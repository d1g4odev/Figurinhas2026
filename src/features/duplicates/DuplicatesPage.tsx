import { Copy } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { buildCopyText } from '../album/album.utils';
import { useAlbum } from '../album/useAlbum';

export function DuplicatesPage() {
  const { album, duplicates } = useAlbum();
  const { copied, copy } = useCopyToClipboard();

  return (
    <section className="page-stack">
      <div className="section-head">
        <div>
          <span className="eyebrow">Trocas</span>
          <h2>Repetidas</h2>
          <p>{duplicates.length} códigos com repetidas marcadas.</p>
        </div>
        <Button variant="primary" onClick={() => copy(buildCopyText('Figurinhas repetidas:', duplicates, album))}>
          <Copy size={18} />
          {copied ? 'Copiado' : 'Copiar'}
        </Button>
      </div>
      <div className="plain-list">
        {duplicates.map((sticker) => (
          <span key={sticker.id}>
            {sticker.teamCode} {sticker.number}
            {(album.stickers[sticker.id]?.duplicates || 0) > 1 ? ` x${album.stickers[sticker.id].duplicates}` : ''}
          </span>
        ))}
      </div>
    </section>
  );
}
