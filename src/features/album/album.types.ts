export type Team = {
  code: string;
  name: string;
  group: string;
  host?: boolean;
  colors: [string, string];
};

export type Sticker = {
  id: string;
  teamCode: string;
  number: string;
  label: string;
};

export type StickerState = {
  owned: boolean;
  duplicates: number;
  updatedAt?: string;
};

export type AlbumState = {
  version: number;
  stickers: Record<string, StickerState>;
};

export type AlbumSummary = {
  total: number;
  owned: number;
  missing: number;
  duplicates: number;
};
