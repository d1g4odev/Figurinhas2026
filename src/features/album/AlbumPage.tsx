import { CircleDollarSign, PieChart, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { teams } from '../../data/worldCup2026';
import { Button } from '../../components/ui/Button';
import { catalog } from './album.utils';
import { useAlbum } from './useAlbum';
import { StickerGrid } from '../stickers/StickerGrid';
import { flagUrl } from '../../data/worldCup2026';

export function AlbumPage() {
  const { summary, addExpense } = useAlbum();
  const [teamCode, setTeamCode] = useState('FWC');
  const [search, setSearch] = useState('');
  const [expenseInput, setExpenseInput] = useState('');
  const progress = Math.round((summary.owned / summary.total) * 100);

  const stickers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return catalog.filter((sticker) => {
      const matchTeam = teamCode === 'ALL' || sticker.teamCode === teamCode;
      const matchSearch = !normalizedSearch || `${sticker.teamCode} ${sticker.number}`.toLowerCase().includes(normalizedSearch);
      return matchTeam && matchSearch;
    });
  }, [search, teamCode]);

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
        <div className="progress-ring" style={{ '--progress': `${progress}%` } as React.CSSProperties} aria-label="Progresso do álbum">
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
              inputMode="decimal"
              placeholder="Digite o valor gasto"
            />
          </label>
          <Button variant="primary" onClick={registerExpense}>Adicionar</Button>
        </div>
      </div>

      <label className="search-field">
        <Search size={18} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por código..." />
      </label>

      <div className="chips" aria-label="Filtrar seleção">
        <button className={teamCode === 'FWC' ? 'selected' : ''} onClick={() => setTeamCode('FWC')}>FWC</button>
        <button className={teamCode === 'ALL' ? 'selected' : ''} onClick={() => setTeamCode('ALL')}>ALL</button>
        {teams.map((team) => (
          <button key={team.code} className={teamCode === team.code ? 'selected' : ''} onClick={() => setTeamCode(team.code)}>
            <img src={flagUrl(team.flagCode, 40)} alt="" />
            {team.code}
          </button>
        ))}
      </div>

      <StickerGrid stickers={stickers} />
    </section>
  );
}
