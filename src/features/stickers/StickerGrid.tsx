import type { Sticker } from '../album/album.types';
import { useAlbum } from '../album/useAlbum';
import { StickerCard } from './StickerCard';

type StickerGridProps = {
  stickers: Sticker[];
};

export function StickerGrid({ stickers }: StickerGridProps) {
  const { album, toggleOwned, incrementDuplicate, decrementDuplicate } = useAlbum();

  return (
    <div className="sticker-grid">
      {stickers.map((sticker) => (
        <StickerCard
          key={sticker.id}
          sticker={sticker}
          state={album.stickers[sticker.id]}
          onToggleOwned={() => toggleOwned(sticker.id)}
          onIncrementDuplicate={() => incrementDuplicate(sticker.id)}
          onDecrementDuplicate={() => decrementDuplicate(sticker.id)}
        />
      ))}
    </div>
  );
}
