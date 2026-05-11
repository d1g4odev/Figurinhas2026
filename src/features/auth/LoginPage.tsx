import { Chrome, ShieldCheck, Trophy } from 'lucide-react';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { signInWithGoogle } from '../../firebase/firebase.auth';
import { useAuth } from './useAuth';

function authMessage(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code === 'auth/operation-not-allowed') return 'Ative o provedor Google no Firebase Authentication.';
  if (code === 'auth/unauthorized-domain') return 'Adicione localhost, 127.0.0.1 e o domínio publicado nos domínios autorizados do Firebase.';
  return 'Não consegui concluir o login com Google. Tente novamente.';
}

export function LoginPage() {
  const { user, loading } = useAuth();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/album" replace />;

  async function handleLogin() {
    setBusy(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(authMessage(err));
      setBusy(false);
    }
  }

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
