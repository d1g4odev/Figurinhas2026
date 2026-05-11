import type { Sticker, Team } from '../features/album/album.types';

export const STICKERS_PER_TEAM = 20;
export const DATA_VERSION = 5;

export const teams: Team[] = [
  { code: 'MEX', name: 'México', group: 'Grupo A', host: true, colors: ['#006847', '#ce1126'] },
  { code: 'RSA', name: 'África do Sul', group: 'Grupo A', colors: ['#007749', '#ffb81c'] },
  { code: 'KOR', name: 'Coreia do Sul', group: 'Grupo A', colors: ['#003478', '#c60c30'] },
  { code: 'CZE', name: 'Rep. Tcheca', group: 'Grupo A', colors: ['#11457e', '#d7141a'] },
  { code: 'CAN', name: 'Canadá', group: 'Grupo B', host: true, colors: ['#ff0000', '#ffffff'] },
  { code: 'BIH', name: 'Bósnia', group: 'Grupo B', colors: ['#002f6c', '#ffcd00'] },
  { code: 'QAT', name: 'Catar', group: 'Grupo B', colors: ['#8a1538', '#ffffff'] },
  { code: 'SUI', name: 'Suíça', group: 'Grupo B', colors: ['#da291c', '#ffffff'] },
  { code: 'BRA', name: 'Brasil', group: 'Grupo C', colors: ['#ffdf00', '#009c3b'] },
  { code: 'MAR', name: 'Marrocos', group: 'Grupo C', colors: ['#c1272d', '#006233'] },
  { code: 'HAI', name: 'Haiti', group: 'Grupo C', colors: ['#00209f', '#d21034'] },
  { code: 'SCO', name: 'Escócia', group: 'Grupo C', colors: ['#005eb8', '#ffffff'] },
  { code: 'USA', name: 'Estados Unidos', group: 'Grupo D', host: true, colors: ['#3c3b6e', '#b22234'] },
  { code: 'PAR', name: 'Paraguai', group: 'Grupo D', colors: ['#d52b1e', '#0038a8'] },
  { code: 'AUS', name: 'Austrália', group: 'Grupo D', colors: ['#ffcd00', '#00843d'] },
  { code: 'TUR', name: 'Turquia', group: 'Grupo D', colors: ['#e30a17', '#ffffff'] },
  { code: 'GER', name: 'Alemanha', group: 'Grupo E', colors: ['#000000', '#ffcc00'] },
  { code: 'CUW', name: 'Curaçao', group: 'Grupo E', colors: ['#002b7f', '#f9e814'] },
  { code: 'CIV', name: 'Costa do Marfim', group: 'Grupo E', colors: ['#ff8200', '#009e60'] },
  { code: 'ECU', name: 'Equador', group: 'Grupo E', colors: ['#ffd100', '#0033a0'] },
  { code: 'NED', name: 'Holanda', group: 'Grupo F', colors: ['#ff6900', '#ffffff'] },
  { code: 'JPN', name: 'Japão', group: 'Grupo F', colors: ['#bc002d', '#ffffff'] },
  { code: 'SWE', name: 'Suécia', group: 'Grupo F', colors: ['#006aa7', '#fecc00'] },
  { code: 'TUN', name: 'Tunísia', group: 'Grupo F', colors: ['#e70013', '#ffffff'] },
  { code: 'BEL', name: 'Bélgica', group: 'Grupo G', colors: ['#fae042', '#ed2939'] },
  { code: 'EGY', name: 'Egito', group: 'Grupo G', colors: ['#ce1126', '#ffffff'] },
  { code: 'IRN', name: 'Irã', group: 'Grupo G', colors: ['#239f40', '#da0000'] },
  { code: 'NZL', name: 'Nova Zelândia', group: 'Grupo G', colors: ['#ffffff', '#012169'] },
  { code: 'ESP', name: 'Espanha', group: 'Grupo H', colors: ['#aa151b', '#f1bf00'] },
  { code: 'CPV', name: 'Cabo Verde', group: 'Grupo H', colors: ['#003893', '#f7d116'] },
  { code: 'KSA', name: 'Arábia Saudita', group: 'Grupo H', colors: ['#006c35', '#ffffff'] },
  { code: 'URU', name: 'Uruguai', group: 'Grupo H', colors: ['#7bb6e1', '#ffffff'] },
  { code: 'FRA', name: 'França', group: 'Grupo I', colors: ['#0055a4', '#ef4135'] },
  { code: 'SEN', name: 'Senegal', group: 'Grupo I', colors: ['#00853f', '#fdef42'] },
  { code: 'IRQ', name: 'Iraque', group: 'Grupo I', colors: ['#ce1126', '#000000'] },
  { code: 'NOR', name: 'Noruega', group: 'Grupo I', colors: ['#ef2b2d', '#002868'] },
  { code: 'ARG', name: 'Argentina', group: 'Grupo J', colors: ['#75aadb', '#ffffff'] },
  { code: 'ALG', name: 'Argélia', group: 'Grupo J', colors: ['#006233', '#ffffff'] },
  { code: 'AUT', name: 'Áustria', group: 'Grupo J', colors: ['#ed2939', '#ffffff'] },
  { code: 'JOR', name: 'Jordânia', group: 'Grupo J', colors: ['#000000', '#ce1126'] },
  { code: 'POR', name: 'Portugal', group: 'Grupo K', colors: ['#006600', '#ff0000'] },
  { code: 'COD', name: 'Congo', group: 'Grupo K', colors: ['#007fff', '#f7d618'] },
  { code: 'UZB', name: 'Uzbequistão', group: 'Grupo K', colors: ['#1eb53a', '#0099b5'] },
  { code: 'COL', name: 'Colômbia', group: 'Grupo K', colors: ['#fcd116', '#003893'] },
  { code: 'ENG', name: 'Inglaterra', group: 'Grupo L', colors: ['#ffffff', '#ce1124'] },
  { code: 'CRO', name: 'Croácia', group: 'Grupo L', colors: ['#ff0000', '#ffffff'] },
  { code: 'GHA', name: 'Gana', group: 'Grupo L', colors: ['#006b3f', '#fcd116'] },
  { code: 'PAN', name: 'Panamá', group: 'Grupo L', colors: ['#005aa7', '#d21034'] }
];

export const specialStickers: Sticker[] = [
  { id: 'FWC00', teamCode: 'FWC', number: '00', label: 'Pôster oficial' },
  ...Array.from({ length: 19 }, (_, index) => {
    const number = String(index + 1);
    return { id: `FWC${number}`, teamCode: 'FWC', number, label: 'Especial FIFA World Cup' };
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
        label: `${team.code} ${number}`
      };
    })
  );

  return [...specialStickers, ...teamStickers];
}
