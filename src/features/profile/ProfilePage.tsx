import { LogOut } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { signOutUser } from '../../firebase/firebase.auth';
import { useAlbum } from '../album/useAlbum';
import { useAuth } from '../auth/useAuth';

export function ProfilePage() {
  const { user } = useAuth();
  const { summary } = useAlbum();

  return (
    <section className="page-stack">
      <div className="profile-card">
        <img src={user?.photoURL || '/icons/icon-192.png'} alt="" />
        <div>
          <span className="eyebrow">Conta Google</span>
          <h2>{user?.displayName || 'Colecionador'}</h2>
          <p>{user?.email}</p>
        </div>
      </div>

      <div className="stats-grid">
        <div><strong>{summary.owned}</strong><span>Tenho</span></div>
        <div><strong>{summary.missing}</strong><span>Faltam</span></div>
        <div><strong>{summary.duplicates}</strong><span>Repetidas</span></div>
        <div><strong>R$ {summary.totalSpent.toFixed(2)}</strong><span>Gastos</span></div>
      </div>

      <Button variant="danger" onClick={() => signOutUser()}>
        <LogOut size={18} />
        Sair da conta
      </Button>
    </section>
  );
}
