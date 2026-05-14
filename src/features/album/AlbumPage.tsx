import { CircleDollarSign, PieChart, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  STICKERS_PER_TEAM,
  flagUrl,
  specialStickers,
  teamByCode,
  teams
} from '../../data/worldCup2026';
import { Button } from '../../components/ui/Button';
import type { Sticker } from './album.types';
import { catalog } from './album.utils';
import { useAlbum } from './useAlbum';
import { StickerGrid } from '../stickers/StickerGrid';

type StatusFilter = 'all' | 'owned' | 'missing' | 'duplicates';

const statusOptions: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'owned', label: 'Tenho' },
  { key: 'missing', label: 'Faltam' },
  { key: 'duplicates', label: 'Repetidas' }
];

export function AlbumPage() {
  const { album, summary, addExpense } = useAlbum();
  const [teamCode, setTeamCode] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [expenseInput, setExpenseInput] = useState('');
  const progress = Math.round((summary.owned / summary.total) * 100);

  const teamStats = useMemo(() => {
    const stats = new Map<string, { owned: number; total: number }>();
    teams.forEach((team) => stats.set(team.code, { owned: 0, total: STICKERS_PER_TEAM }));
    stats.set('FWC', { owned: 0, total: specialStickers.length });
    for (const sticker of catalog) {
      const bucket = stats.get(sticker.teamCode);
      if (!bucket) continue;
      if (album.stickers[sticker.id]?.owned) bucket.owned++;
    }
    return stats;
  }, [album]);

  const groupStats = useMemo(() => {
    const stats = new Map<string, { owned: number; total: number }>();
    for (const team of teams) {
      const bucket = stats.get(team.group) || { owned: 0, total: 0 };
      bucket.total += STICKERS_PER_TEAM;
      bucket.owned += teamStats.get(team.code)?.owned || 0;
      stats.set(team.group, bucket);
    }
    return stats;
  }, [teamStats]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return catalog.filter((sticker) => {
      const matchTeam = teamCode === 'ALL' || sticker.teamCode === teamCode;
      const matchSearch =
        !normalizedSearch ||
        `${sticker.teamCode} ${sticker.number}`.toLowerCase().includes(normalizedSearch);
      const state = album.stickers[sticker.id];
      const owned = !!state?.owned;
      const duplicates = state?.duplicates || 0;
      const matchStatus =
        statusFilter === 'all' ? true :
        statusFilter === 'owned' ? owned :
        statusFilter === 'missing' ? !owned :
        duplicates > 1;
      return matchTeam && matchSearch && matchStatus;
    });
  }, [album, search, statusFilter, teamCode]);

  const groups = useMemo(() => {
    if (teamCode !== 'ALL') return null;
    const buckets = new Map<string, Sticker[]>();
    for (const sticker of filtered) {
      const key = sticker.teamCode === 'FWC'
        ? '__FWC__'
        : (teamByCode.get(sticker.teamCode)?.group || 'Outras');
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(sticker);
    }
    return Array.from(buckets, ([key, stickers]) => {
      const label = key === '__FWC__' ? 'Especiais' : key.replace('Group ', 'Grupo ');
      const stats =
        key === '__FWC__'
          ? teamStats.get('FWC') || { owned: 0, total: 0 }
          : groupStats.get(key) || { owned: 0, total: 0 };
      return { key, label, stickers, stats };
    });
  }, [filtered, groupStats, teamCode, teamStats]);

  function registerExpense() {
    const amount = Number(expenseInput.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) return;
    addExpense(amount);
    setExpenseInput('');
  }

  return (
    <section className="page-stack">
      <div className="hero-panel">
        <div>
          <span className="eyebrow">Minha coleção</span>
          <h2>{summary.owned} de {summary.total}</h2>
          <p>{summary.missing} faltam · {summary.duplicates} repetidas</p>
        </div>
        <div
          className="progress-ring"
          style={{ '--progress': `${progress}%` } as React.CSSProperties}
          aria-label="Progresso do álbum"
        >
          <span>{progress}%</span>
        </div>
      </div>

      <div className="progress-card">
        <div className="progress-card-head">
          <h3>
            <PieChart size={18} />
            Progresso do álbum
          </h3>
        </div>
        <div className="pie-wrap">
          <div className="pie-chart" style={{ '--progress': `${progress}%` } as React.CSSProperties} />
          <div className="pie-legend">
            <strong>{summary.total}</strong>
            <span>Total</span>
            <strong>{summary.owned}</strong>
            <span>Coletadas</span>
            <strong>{summary.missing}</strong>
            <span>Faltam</span>
            <strong>{summary.duplicates}</strong>
            <span>Repetidas</span>
          </div>
        </div>
      </div>

      <div className="expense-card">
        <div className="expense-title">
          <h3>
            <CircleDollarSign size={18} />
            Tracker de gastos
          </h3>
          <strong>R$ {summary.totalSpent.toFixed(2)}</strong>
        </div>
        <div className="expense-actions">
          <label className="search-field">
            <span>R$</span>
            <input
              value={expenseInput}
              onChange={(event) => setExpenseInput(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && registerExpense()}
              inputMode="decimal"
              placeholder="Digite o valor gasto"
            />
          </label>
          <Button variant="primary" onClick={registerExpense}>Adicionar</Button>
        </div>
      </div>

      <label className="search-field">
        <Search size={18} />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por código..."
        />
      </label>

      <div className="chips chips--status" aria-label="Filtrar por status">
        {statusOptions.map((option) => (
          <button
            key={option.key}
            className={statusFilter === option.key ? 'selected' : ''}
            onClick={() => setStatusFilter(option.key)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="chips" aria-label="Filtrar seleção">
        <button
          className={teamCode === 'ALL' ? 'selected' : ''}
          onClick={() => setTeamCode('ALL')}
        >
          ALL
          <span className="chip-count">{summary.owned}/{summary.total}</span>
        </button>
        <button
          className={teamCode === 'FWC' ? 'selected' : ''}
          onClick={() => setTeamCode('FWC')}
        >
          FWC
          <span className="chip-count">
            {teamStats.get('FWC')?.owned ?? 0}/{teamStats.get('FWC')?.total ?? 0}
          </span>
        </button>
        {teams.map((team) => {
          const stats = teamStats.get(team.code);
          return (
            <button
              key={team.code}
              className={teamCode === team.code ? 'selected' : ''}
              onClick={() => setTeamCode(team.code)}
            >
              <img src={flagUrl(team.flagCode, 40)} alt="" />
              {team.code}
              <span className="chip-count">{stats?.owned ?? 0}/{stats?.total ?? 0}</span>
            </button>
          );
        })}
      </div>

      {groups ? (
        groups.length === 0 ? (
          <p className="album-empty">Nada por aqui com esses filtros.</p>
        ) : (
          groups.map((group) => (
            <div key={group.key} className="album-group">
              <div className="album-group-head">
                <h3>{group.label}</h3>
                <span className="album-group-count">
                  {group.stats.owned} / {group.stats.total}
                </span>
              </div>
              <StickerGrid stickers={group.stickers} />
            </div>
          ))
        )
      ) : filtered.length === 0 ? (
        <p className="album-empty">Nada por aqui com esses filtros.</p>
      ) : (
        <StickerGrid stickers={filtered} />
      )}
    </section>
  );
}
