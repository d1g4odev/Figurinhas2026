import { Chrome, ShieldCheck, Sparkles, Trophy } from 'lucide-react';
import type { User } from 'firebase/auth';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { authErrorMessage, signInWithGoogle } from '../../firebase/firebase.auth';
import { useAlbumStore } from '../album/album.store';
import { catalog, createEmptyAlbum } from '../album/album.utils';
import { useAuth } from './useAuth';
import { useAuthStore } from './auth.store';

function activatePreviewMode() {
  const seed = createEmptyAlbum();
  catalog.slice(0, 40).forEach((sticker) => {
    seed.stickers[sticker.id] = { owned: true, duplicates: 0 };
  });
  catalog.slice(5, 13).forEach((sticker, i) => {
    seed.stickers[sticker.id] = { owned: true, duplicates: (i % 3) + 1 };
  });
  seed.expenses = [
    { id: 'preview-1', amount: 12, createdAt: new Date().toISOString() },
    { id: 'preview-2', amount: 30, createdAt: new Date().toISOString() },
    { id: 'preview-3', amount: 18.5, createdAt: new Date().toISOString() }
  ];
  useAlbumStore.getState().replaceAlbum(seed);
  useAuthStore.getState().setUser({
    uid: '__preview__',
    displayName: 'Preview · Modo Dev',
    email: 'preview@local',
    photoURL: ''
  } as unknown as User);
}

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
        {import.meta.env.DEV && (
          <button type="button" className="dev-preview-link" onClick={activatePreviewMode}>
            <Sparkles size={14} />
            Entrar em modo design (sem login)
          </button>
        )}
      </div>
    </main>
  );
}
