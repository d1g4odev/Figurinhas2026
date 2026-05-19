import { ArrowLeft, ChevronRight, Copy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { buildCopyText } from '../album/album.utils';
import { useAlbum } from '../album/useAlbum';
import {
  STICKERS_PER_TEAM,
  flagUrl,
  specialStickers,
  teamByCode,
  teams
} from '../../data/worldCup2026';
import type { Sticker } from '../album/album.types';

type TeamRow = {
  code: string;
  nameEn: string;
  flagCode: string;
  missing: number;
  total: number;
};

export function MissingPage() {
  const { missing } = useAlbum();
  const { copied, copy } = useCopyToClipboard();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const missingByTeam = useMemo(() => {
    const map = new Map<string, Sticker[]>();
    for (const sticker of missing) {
      const list = map.get(sticker.teamCode) || [];
      list.push(sticker);
      map.set(sticker.teamCode, list);
    }
    return map;
  }, [missing]);

  const teamRows = useMemo<TeamRow[]>(() => {
    const rows: TeamRow[] = [];
    if (missingByTeam.has('FWC')) {
      rows.push({
        code: 'FWC',
        nameEn: 'FIFA World Cup 2026',
        flagCode: 'un',
        missing: missingByTeam.get('FWC')!.length,
        total: specialStickers.length
      });
    }
    for (const team of teams) {
      const list = missingByTeam.get(team.code);
      if (!list || list.length === 0) continue;
      rows.push({
        code: team.code,
        nameEn: team.nameEn,
        flagCode: team.flagCode,
        missing: list.length,
        total: STICKERS_PER_TEAM
      });
    }
    return rows;
  }, [missingByTeam]);

  if (selectedTeam) {
    const teamInfo =
      selectedTeam === 'FWC'
        ? { code: 'FWC', nameEn: 'FIFA World Cup 2026', flagCode: 'un' }
        : teamByCode.get(selectedTeam);
    const teamMissing = missingByTeam.get(selectedTeam) || [];
    const title = teamInfo?.nameEn || selectedTeam;

    return (
      <section className="page-stack">
        <div className="missing-back-bar">
          <div className="missing-back-top">
            <button
              type="button"
              className="missing-back"
              onClick={() => setSelectedTeam(null)}
            >
              <ArrowLeft size={16} />
              Voltar
            </button>
            <Button
              variant="primary"
              onClick={() => copy(buildCopyText(`FALTAM · ${title.toUpperCase()}`, teamMissing))}
            >
              <Copy size={18} />
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
          </div>
          <div className="missing-back-title">
            {teamInfo && <img src={flagUrl(teamInfo.flagCode, 80)} alt="" />}
            <strong>{title}</strong>
            <span>{teamMissing.length} faltam</span>
          </div>
        </div>

        {teamMissing.length === 0 ? (
          <p className="album-empty">Você completou essa seleção. Aplaudo.</p>
        ) : (
          <div className="plain-list detailed">
            {teamMissing.map((sticker) => (
              <span key={sticker.id}>
                <img src={flagUrl(sticker.flagCode, 40)} alt="" />
                <b>{sticker.teamCode} {sticker.number}</b>
                <small>{sticker.playerName || sticker.label}</small>
              </span>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="page-stack">
      <div className="section-head">
        <div>
          <span className="eyebrow">Lista para colar</span>
          <h2>Faltantes</h2>
          <p>
            {missing.length} figurinhas em {teamRows.length}{' '}
            {teamRows.length === 1 ? 'seleção' : 'seleções'}.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => copy(buildCopyText('MINHAS FALTANTES', missing))}
        >
          <Copy size={18} />
          {copied ? 'Copiado' : 'Copiar'}
        </Button>
      </div>

      {teamRows.length === 0 ? (
        <p className="album-empty">Você já tem tudo. Lendário.</p>
      ) : (
        <div className="missing-team-grid">
          {teamRows.map((row) => (
            <button
              key={row.code}
              type="button"
              className="missing-team-card"
              onClick={() => setSelectedTeam(row.code)}
              aria-label={`Ver figurinhas que faltam · ${row.nameEn}`}
            >
              <img src={flagUrl(row.flagCode, 80)} alt="" />
              <div className="missing-team-info">
                <strong>{row.code}</strong>
                <small>{row.nameEn}</small>
              </div>
              <span className="missing-team-count">{row.missing}/{row.total}</span>
              <ChevronRight size={20} aria-hidden />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
