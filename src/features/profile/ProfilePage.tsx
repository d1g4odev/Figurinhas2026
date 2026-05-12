import { CloudDownload, CloudUpload, DatabaseZap, RotateCcw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { useAlbum } from '../album/useAlbum';
import { useAlbumStore, STORAGE_KEY } from '../album/album.store';
import { createEmptyAlbum } from '../album/album.utils';
import { restoreAlbumFromCloud, syncAlbumToCloud } from './profile.cloud';
import { ensureSupabaseSession, isSupabaseConfigured } from '../../lib/supabase';

export function ProfilePage() {
  const { album, summary } = useAlbum();
  const replaceAlbum = useAlbumStore((state) => state.replaceAlbum);
  const [feedback, setFeedback] = useState('');
  const [cloudStatus, setCloudStatus] = useState(isSupabaseConfigured ? 'Conectando ao Supabase...' : 'Supabase ainda não configurado neste build.');
  const [cloudBusy, setCloudBusy] = useState(false);
  const [cloudUserId, setCloudUserId] = useState('');
  const [lastCloudSync, setLastCloudSync] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    ensureSupabaseSession()
      .then(({ session, error }) => {
        if (error) {
          setCloudStatus(`Supabase conectado, mas a sessão não abriu: ${error.message}`);
          return;
        }

        if (session?.user?.id) {
          setCloudUserId(session.user.id);
          setCloudStatus('Supabase conectado e sessão anônima ativa neste dispositivo.');
        }
      })
      .catch((error: unknown) => {
        setCloudStatus(`Supabase respondeu com erro: ${error instanceof Error ? error.message : 'erro desconhecido'}`);
      });
  }, []);

  function resetAlbum() {
    if (!window.confirm('Tem certeza? Isso apaga todo o seu progresso local neste dispositivo.')) return;
    replaceAlbum(createEmptyAlbum());
    setFeedback('Álbum local resetado neste dispositivo.');
  }

  function exportAlbum() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setFeedback('Nenhum dado local para exportar.');
      return;
    }

    navigator.clipboard.writeText(raw)
      .then(() => setFeedback('Backup local copiado para a área de transferência.'))
      .catch(() => setFeedback('Não consegui copiar o backup local.'));
  }

  async function pushCloudBackup() {
    setCloudBusy(true);
    setFeedback('');

    try {
      const result = await syncAlbumToCloud(album);
      setCloudUserId(result.userId);
      setLastCloudSync(result.updatedAt);
      setCloudStatus('Backup salvo na nuvem com sucesso.');
      setFeedback('Sincronizei seu álbum local com o Supabase.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não consegui salvar o álbum na nuvem.');
    } finally {
      setCloudBusy(false);
    }
  }

  async function pullCloudBackup() {
    setCloudBusy(true);
    setFeedback('');

    try {
      const result = await restoreAlbumFromCloud();
      setCloudUserId(result.userId);

      if (!result.payload) {
        setFeedback('Ainda não existe backup desse álbum na nuvem.');
        return;
      }

      replaceAlbum(result.payload);
      setLastCloudSync(result.updatedAt || '');
      setCloudStatus('Backup da nuvem restaurado neste dispositivo.');
      setFeedback('Restaurei o álbum salvo no Supabase.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não consegui restaurar o álbum da nuvem.');
    } finally {
      setCloudBusy(false);
    }
  }

  return (
    <section className="page-stack">
      <div className="profile-card">
        <img src="/icons/icon-192.png" alt="" />
        <div>
          <span className="eyebrow">{isSupabaseConfigured ? 'Conta invisível' : 'Modo local'}</span>
          <h2>{isSupabaseConfigured ? 'Conta automática por dispositivo' : 'Dados neste dispositivo'}</h2>
          <p>
            {isSupabaseConfigured
              ? 'Cada dispositivo entra sozinho com uma conta anônima persistente e salva o progresso automaticamente na nuvem.'
              : 'O álbum está salvo apenas no navegador atual, sem login e sem nuvem.'}
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div><strong>{summary.owned}</strong><span>Tenho</span></div>
        <div><strong>{summary.missing}</strong><span>Faltam</span></div>
        <div><strong>{summary.duplicates}</strong><span>Repetidas</span></div>
        <div><strong>R$ {summary.totalSpent.toFixed(2)}</strong><span>Gastos</span></div>
      </div>

      <div className="profile-cloud-card">
        <div className="profile-cloud-head">
          <DatabaseZap size={18} />
          <strong>Supabase</strong>
        </div>
        <p>{cloudStatus}</p>
        {cloudUserId && <small>ID da sessão: {cloudUserId.slice(0, 8)}...</small>}
        {lastCloudSync && <small>Último sync: {new Date(lastCloudSync).toLocaleString('pt-BR')}</small>}
      </div>

      {isSupabaseConfigured && (
        <>
          <Button variant="primary" onClick={pushCloudBackup} disabled={cloudBusy}>
            <CloudUpload size={18} />
            {cloudBusy ? 'Sincronizando...' : 'Sincronizar agora'}
          </Button>

          <Button variant="secondary" onClick={pullCloudBackup} disabled={cloudBusy}>
            <CloudDownload size={18} />
            {cloudBusy ? 'Buscando backup...' : 'Forçar restauração'}
          </Button>
        </>
      )}

      <Button variant="secondary" onClick={exportAlbum}>
        <RotateCcw size={18} />
        Copiar backup local
      </Button>

      <Button variant="danger" onClick={resetAlbum}>
        <Trash2 size={18} />
        Resetar álbum local
      </Button>

      {feedback && <p className="form-error">{feedback}</p>}
    </section>
  );
}
