import { Minus, Plus } from 'lucide-react';
import type { Sticker, StickerState } from '../album/album.types';
import { formatStickerCode } from '../../lib/formatStickerCode';
import { flagUrl } from '../../data/worldCup2026';

type StickerCardProps = {
  sticker: Sticker;
  state: StickerState;
  onMarkOwned: () => void;
  onIncrementDuplicate: () => void;
  onDecrementDuplicate: () => void;
};

export function StickerCard({ sticker, state, onMarkOwned, onIncrementDuplicate, onDecrementDuplicate }: StickerCardProps) {
  const hasSticker = (state?.duplicates || 0) > 0;
  return (
    <article className={hasSticker ? 'sticker-card owned' : 'sticker-card'}>
      <button className="sticker-main" onClick={hasSticker ? undefined : onMarkOwned}>
        <div className="sticker-main-head">
          <img src={flagUrl(sticker.flagCode, 40)} alt="" />
          <strong>{formatStickerCode(sticker)}</strong>
        </div>
        <span className="sticker-country">
          {sticker.playerName || sticker.label}
        </span>
        <span>{hasSticker ? 'Tenho' : 'Falta'}</span>
      </button>
      <div className="duplicate-stepper">
        <button onClick={onDecrementDuplicate} disabled={state.duplicates === 0} aria-label={`Diminuir repetidas ${formatStickerCode(sticker)}`}>
          <Minus size={14} />
        </button>
        <span>{state.duplicates}</span>
        <button onClick={onIncrementDuplicate} aria-label={`Adicionar repetida ${formatStickerCode(sticker)}`}>
          <Plus size={14} />
        </button>
      </div>
    </article>
  );
}
