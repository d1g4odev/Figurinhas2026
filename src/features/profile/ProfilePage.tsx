import { Cloud, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { authErrorMessage, linkOrSignInWithGoogle, signOutUser } from '../../firebase/firebase.auth';
import { useAlbum } from '../album/useAlbum';
import { useAuth } from '../auth/useAuth';

export function ProfilePage() {
  const { user } = useAuth();
  const { summary } = useAlbum();
  const [busy, setBusy] = useState(false);
  const [linkError, setLinkError] = useState('');

  const isAnonymous = !!user?.isAnonymous;

  async function handleLinkGoogle() {
    setBusy(true);
    setLinkError('');
    try {
      await linkOrSignInWithGoogle();
    } catch (err) {
      setLinkError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page-stack">
      <div className="profile-card">
        <img src={user?.photoURL || '/icons/icon-192.png'} alt="" />
        <div>
          <span className="eyebrow">{isAnonymous ? 'Modo convidado' : 'Conta Google'}</span>
          <h2>{user?.displayName || (isAnonymous ? 'Colecionador anônimo' : 'Colecionador')}</h2>
          <p>
            {isAnonymous
              ? 'Seu álbum está salvo só nesse dispositivo. Sincronize com Google pra usar em qualquer celular.'
              : user?.email}
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div><strong>{summary.owned}</strong><span>Tenho</span></div>
        <div><strong>{summary.missing}</strong><span>Faltam</span></div>
        <div><strong>{summary.duplicates}</strong><span>Repetidas</span></div>
        <div><strong>R$ {summary.totalSpent.toFixed(2)}</strong><span>Gastos</span></div>
      </div>

      {isAnonymous ? (
        <Button variant="primary" onClick={handleLinkGoogle} disabled={busy}>
          <Cloud size={18} />
          {busy ? 'Abrindo Google...' : 'Sincronizar com Google'}
        </Button>
      ) : (
        <Button variant="danger" onClick={() => signOutUser()}>
          <LogOut size={18} />
          Sair da conta
        </Button>
      )}

      {linkError && <p className="form-error">{linkError}</p>}
    </section>
  );
}
