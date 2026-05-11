export type Team = {
  code: string;
  name: string;
  nameEn: string;
  group: string;
  host?: boolean;
  flagCode: string;
};

export type StickerType = 'player' | 'logo' | 'team_photo' | 'intro';

export type Sticker = {
  id: string;
  teamCode: string;
  number: string;
  label: string;
  teamNameEn: string;
  flagCode: string;
  playerName?: string | null;
  stickerType?: StickerType;
  imageUrl?: string | null;
};

export type StickerState = {
  owned: boolean;
  duplicates: number;
  updatedAt?: string;
};

export type AlbumState = {
  version: number;
  stickers: Record<string, StickerState>;
  expenses: ExpenseEntry[];
};

export type AlbumSummary = {
  total: number;
  owned: number;
  missing: number;
  duplicates: number;
  totalSpent: number;
};

export type ExpenseEntry = {
  id: string;
  amount: number;
  createdAt: string;
};
