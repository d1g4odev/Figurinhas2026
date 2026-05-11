import type { Sticker, Team } from '../features/album/album.types';

export const STICKERS_PER_TEAM = 20;
export const DATA_VERSION = 6;

export const teams: Team[] = [
  { code: 'MEX', name: 'Mexico', nameEn: 'Mexico', group: 'Group A', host: true, flagCode: 'mx' },
  { code: 'RSA', name: 'South Africa', nameEn: 'South Africa', group: 'Group A', flagCode: 'za' },
  { code: 'KOR', name: 'South Korea', nameEn: 'South Korea', group: 'Group A', flagCode: 'kr' },
  { code: 'CZE', name: 'Czech Republic', nameEn: 'Czech Republic', group: 'Group A', flagCode: 'cz' },
  { code: 'CAN', name: 'Canada', nameEn: 'Canada', group: 'Group B', host: true, flagCode: 'ca' },
  { code: 'BIH', name: 'Bosnia and Herzegovina', nameEn: 'Bosnia and Herzegovina', group: 'Group B', flagCode: 'ba' },
  { code: 'QAT', name: 'Qatar', nameEn: 'Qatar', group: 'Group B', flagCode: 'qa' },
  { code: 'SUI', name: 'Switzerland', nameEn: 'Switzerland', group: 'Group B', flagCode: 'ch' },
  { code: 'BRA', name: 'Brazil', nameEn: 'Brazil', group: 'Group C', flagCode: 'br' },
  { code: 'MAR', name: 'Morocco', nameEn: 'Morocco', group: 'Group C', flagCode: 'ma' },
  { code: 'HAI', name: 'Haiti', nameEn: 'Haiti', group: 'Group C', flagCode: 'ht' },
  { code: 'SCO', name: 'Scotland', nameEn: 'Scotland', group: 'Group C', flagCode: 'gb-sct' },
  { code: 'USA', name: 'United States', nameEn: 'United States', group: 'Group D', host: true, flagCode: 'us' },
  { code: 'PAR', name: 'Paraguay', nameEn: 'Paraguay', group: 'Group D', flagCode: 'py' },
  { code: 'AUS', name: 'Australia', nameEn: 'Australia', group: 'Group D', flagCode: 'au' },
  { code: 'TUR', name: 'Turkey', nameEn: 'Turkey', group: 'Group D', flagCode: 'tr' },
  { code: 'GER', name: 'Germany', nameEn: 'Germany', group: 'Group E', flagCode: 'de' },
  { code: 'CUW', name: 'Curacao', nameEn: 'Curacao', group: 'Group E', flagCode: 'cw' },
  { code: 'CIV', name: "Cote d'Ivoire", nameEn: "Cote d'Ivoire", group: 'Group E', flagCode: 'ci' },
  { code: 'ECU', name: 'Ecuador', nameEn: 'Ecuador', group: 'Group E', flagCode: 'ec' },
  { code: 'NED', name: 'Netherlands', nameEn: 'Netherlands', group: 'Group F', flagCode: 'nl' },
  { code: 'JPN', name: 'Japan', nameEn: 'Japan', group: 'Group F', flagCode: 'jp' },
  { code: 'SWE', name: 'Sweden', nameEn: 'Sweden', group: 'Group F', flagCode: 'se' },
  { code: 'TUN', name: 'Tunisia', nameEn: 'Tunisia', group: 'Group F', flagCode: 'tn' },
  { code: 'BEL', name: 'Belgium', nameEn: 'Belgium', group: 'Group G', flagCode: 'be' },
  { code: 'EGY', name: 'Egypt', nameEn: 'Egypt', group: 'Group G', flagCode: 'eg' },
  { code: 'IRN', name: 'Iran', nameEn: 'Iran', group: 'Group G', flagCode: 'ir' },
  { code: 'NZL', name: 'New Zealand', nameEn: 'New Zealand', group: 'Group G', flagCode: 'nz' },
  { code: 'ESP', name: 'Spain', nameEn: 'Spain', group: 'Group H', flagCode: 'es' },
  { code: 'CPV', name: 'Cape Verde', nameEn: 'Cape Verde', group: 'Group H', flagCode: 'cv' },
  { code: 'KSA', name: 'Saudi Arabia', nameEn: 'Saudi Arabia', group: 'Group H', flagCode: 'sa' },
  { code: 'URU', name: 'Uruguay', nameEn: 'Uruguay', group: 'Group H', flagCode: 'uy' },
  { code: 'FRA', name: 'France', nameEn: 'France', group: 'Group I', flagCode: 'fr' },
  { code: 'SEN', name: 'Senegal', nameEn: 'Senegal', group: 'Group I', flagCode: 'sn' },
  { code: 'IRQ', name: 'Iraq', nameEn: 'Iraq', group: 'Group I', flagCode: 'iq' },
  { code: 'NOR', name: 'Norway', nameEn: 'Norway', group: 'Group I', flagCode: 'no' },
  { code: 'ARG', name: 'Argentina', nameEn: 'Argentina', group: 'Group J', flagCode: 'ar' },
  { code: 'ALG', name: 'Algeria', nameEn: 'Algeria', group: 'Group J', flagCode: 'dz' },
  { code: 'AUT', name: 'Austria', nameEn: 'Austria', group: 'Group J', flagCode: 'at' },
  { code: 'JOR', name: 'Jordan', nameEn: 'Jordan', group: 'Group J', flagCode: 'jo' },
  { code: 'POR', name: 'Portugal', nameEn: 'Portugal', group: 'Group K', flagCode: 'pt' },
  { code: 'COD', name: 'DR Congo', nameEn: 'DR Congo', group: 'Group K', flagCode: 'cd' },
  { code: 'UZB', name: 'Uzbekistan', nameEn: 'Uzbekistan', group: 'Group K', flagCode: 'uz' },
  { code: 'COL', name: 'Colombia', nameEn: 'Colombia', group: 'Group K', flagCode: 'co' },
  { code: 'ENG', name: 'England', nameEn: 'England', group: 'Group L', flagCode: 'gb-eng' },
  { code: 'CRO', name: 'Croatia', nameEn: 'Croatia', group: 'Group L', flagCode: 'hr' },
  { code: 'GHA', name: 'Ghana', nameEn: 'Ghana', group: 'Group L', flagCode: 'gh' },
  { code: 'PAN', name: 'Panama', nameEn: 'Panama', group: 'Group L', flagCode: 'pa' }
];

export const teamByCode = new Map(teams.map((team) => [team.code, team]));

export const specialStickers: Sticker[] = [
  { id: 'FWC00', teamCode: 'FWC', number: '00', label: 'Official Poster', teamNameEn: 'FIFA World Cup 2026', flagCode: 'un' },
  ...Array.from({ length: 19 }, (_, index) => {
    const number = String(index + 1);
    return {
      id: `FWC${number}`,
      teamCode: 'FWC',
      number,
      label: 'FIFA World Cup Special',
      teamNameEn: 'FIFA World Cup 2026',
      flagCode: 'un'
    };
  })
];

export const TOTAL_STICKERS = teams.length * STICKERS_PER_TEAM + specialStickers.length;

export function createCatalog(): Sticker[] {
  const teamStickers = teams.flatMap((team) =>
    Array.from({ length: STICKERS_PER_TEAM }, (_, index) => {
      const number = String(index + 1);
      return {
        id: `${team.code}${number}`,
        teamCode: team.code,
        number,
        label: `${team.code} ${number}`,
        teamNameEn: team.nameEn,
        flagCode: team.flagCode
      };
    })
  );

  return [...specialStickers, ...teamStickers];
}

export function flagUrl(flagCode: string, width = 80) {
  return `https://flagcdn.com/w${width}/${flagCode}.png`;
}
