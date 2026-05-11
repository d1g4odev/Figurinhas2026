import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { teams } from '../../data/worldCup2026';
import { catalog } from './album.utils';
import { useAlbum } from './useAlbum';
import { StickerGrid } from '../stickers/StickerGrid';

export function AlbumPage() {
  const { summary } = useAlbum();
  const [teamCode, setTeamCode] = useState('FWC');
  const [search, setSearch] = useState('');
  const progress = Math.round((summary.owned / summary.total) * 100);

  const stickers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return catalog.filter((sticker) => {
      const matchTeam = teamCode === 'ALL' || sticker.teamCode === teamCode;
      const matchSearch = !normalizedSearch || `${sticker.teamCode} ${sticker.number}`.toLowerCase().includes(normalizedSearch);
      return matchTeam && matchSearch;
    });
  }, [search, teamCode]);

  return (
    <section className="page-stack">
      <div className="hero-panel">
        <div>
          <span className="eyebrow">Progresso geral</span>
          <h2>{summary.owned} de {summary.total}</h2>
          <p>{summary.missing} faltando · {summary.duplicates} repetidas</p>
        </div>
        <div className="progress-ring" style={{ '--progress': `${progress}%` } as React.CSSProperties}>
          <span>{progress}%</span>
        </div>
      </div>

      <label className="search-field">
        <Search size={18} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar GER 6..." />
      </label>

      <div className="chips" aria-label="Filtrar seleção">
        <button className={teamCode === 'FWC' ? 'selected' : ''} onClick={() => setTeamCode('FWC')}>FWC</button>
        <button className={teamCode === 'ALL' ? 'selected' : ''} onClick={() => setTeamCode('ALL')}>Todas</button>
        {teams.map((team) => (
          <button key={team.code} className={teamCode === team.code ? 'selected' : ''} onClick={() => setTeamCode(team.code)}>
            {team.code}
          </button>
        ))}
      </div>

      <StickerGrid stickers={stickers} />
    </section>
  );
}
