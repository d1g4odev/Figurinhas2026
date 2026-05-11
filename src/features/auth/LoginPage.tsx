import { Chrome, ShieldCheck, Trophy } from 'lucide-react';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { authErrorMessage, signInWithGoogle } from '../../firebase/firebase.auth';
import { useAuth } from './useAuth';

export function LoginPage() {
  const { user, loading, error: authError } = useAuth();
  const [localError, setLocalError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/album" replace />;

  async function handleLogin() {
    setBusy(true);
    setLocalError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setLocalError(authErrorMessage(err));
      setBusy(false);
    }
  }

  const error = localError || authError;

  return (
    <main className="login-page">
      <div className="float-ball ball-one"><Trophy size={26} /></div>
      <div className="float-ball ball-two"><ShieldCheck size={24} /></div>
      <div className="login-card">
        <img src="/imagemoficial.png" alt="Figurinhas Copa 2026" className="login-logo" />
        <div className="login-copy">
          <span className="eyebrow">Álbum conectado</span>
          <h1>Figurinhas Copa 2026</h1>
          <p>Controle suas figurinhas, repetidas e faltantes com backup na sua conta Google.</p>
        </div>
        <Button variant="primary" onClick={handleLogin} disabled={busy || loading}>
          <Chrome size={20} />
          {busy ? 'Abrindo Google...' : 'Entrar com Google'}
        </Button>
        {error && <p className="form-error">{error}</p>}
      </div>
    </main>
  );
}
