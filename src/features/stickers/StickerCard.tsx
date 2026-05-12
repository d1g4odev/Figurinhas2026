import { Minus, Plus } from 'lucide-react';
import type { Sticker, StickerState } from '../album/album.types';
import { formatStickerCode } from '../../lib/formatStickerCode';
import { flagUrl } from '../../data/worldCup2026';

type StickerCardProps = {
  sticker: Sticker;
  state: StickerState;
  onToggleOwned: () => void;
  onIncrementDuplicate: () => void;
  onDecrementDuplicate: () => void;
};

export function StickerCard({ sticker, state, onToggleOwned, onIncrementDuplicate, onDecrementDuplicate }: StickerCardProps) {
  return (
    <article className={state.owned ? 'sticker-card owned' : 'sticker-card'}>
      <button className="sticker-main" onClick={onToggleOwned}>
        <div className="sticker-main-head">
          <img src={flagUrl(sticker.flagCode, 40)} alt="" />
          <strong>{formatStickerCode(sticker)}</strong>
        </div>
        <span className="sticker-country">
          {sticker.playerName || sticker.label}
        </span>
        <span>{state.owned ? 'Tenho' : 'Falta'}</span>
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
