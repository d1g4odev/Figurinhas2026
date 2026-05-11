import { Chrome, KeyRound, Sparkles, UserRound } from 'lucide-react';
import type { User } from 'firebase/auth';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import {
  authErrorMessage,
  getRememberDeviceDefault,
  linkOrSignInWithGoogle,
  registerWithUsernamePin,
  signInWithUsernamePin
} from '../../firebase/firebase.auth';
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
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [rememberDevice, setRememberDevice] = useState(getRememberDeviceDefault());

  const tagline =
    mode === 'register'
      ? 'Crie sua conta com nome de usuário e PIN de 4 dígitos. Seus dados ficam salvos no seu álbum na nuvem.'
      : 'Entre com seu usuário e PIN, ou conecte com Google para ter backup e acesso em outros dispositivos.';

  if (!loading && user && user.uid !== '__preview__') {
    return <Navigate to="/album" replace />;
  }

  async function handleGoogleLogin() {
    setBusy(true);
    setLocalError('');
    try {
      await linkOrSignInWithGoogle(rememberDevice);
    } catch (err) {
      setLocalError(authErrorMessage(err));
      setBusy(false);
    }
  }

  async function handlePinSubmit() {
    const trimmedPin = pin.trim();
    if (!/^\d{4}$/.test(trimmedPin)) {
      setLocalError('Use um PIN com exatamente 4 números.');
      return;
    }

    if (mode === 'register' && trimmedPin !== pinConfirm.trim()) {
      setLocalError('Os PINs não conferem.');
      return;
    }

    setBusy(true);
    setLocalError('');
    try {
      if (mode === 'register') {
        await registerWithUsernamePin({ username, pin: trimmedPin, rememberDevice });
      } else {
        await signInWithUsernamePin({ username, pin: trimmedPin, rememberDevice });
      }
    } catch (err) {
      setLocalError(authErrorMessage(err));
      setBusy(false);
    }
  }

  const error = localError || authError;

  return (
    <main className="login-page">
      <div className="login-card">
        <img src="/imagemoficial.png" alt="Figurinhas Copa 2026" className="login-logo" />
        <div className="login-copy">
          <span className="eyebrow">Álbum conectado</span>
          <h1>Figurinhas Copa 2026</h1>
          <p>{tagline}</p>
        </div>
        <div className="auth-mode-switch" role="tablist" aria-label="Modo de acesso">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
          >
            Entrar
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'active' : ''}
            onClick={() => setMode('register')}
          >
            Criar conta
          </button>
        </div>
        <div className="auth-form">
          <label className="auth-field">
            <span>Nome de usuário</span>
            <div className="auth-input">
              <UserRound size={16} />
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="ex: rodrigo_10"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                maxLength={20}
              />
            </div>
          </label>

          <label className="auth-field">
            <span>PIN de 4 dígitos</span>
            <div className="auth-input">
              <KeyRound size={16} />
              <input
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="0000"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
              />
            </div>
          </label>

          {mode === 'register' && (
            <label className="auth-field">
              <span>Confirmar PIN</span>
              <div className="auth-input">
                <KeyRound size={16} />
                <input
                  value={pinConfirm}
                  onChange={(event) => setPinConfirm(event.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="0000"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                />
              </div>
            </label>
          )}

          <label className="remember-toggle">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(event) => setRememberDevice(event.target.checked)}
            />
            <span>Lembrar este dispositivo</span>
          </label>
        </div>

        <Button variant="primary" onClick={handlePinSubmit} disabled={busy || loading}>
          <KeyRound size={18} />
          {busy ? (mode === 'register' ? 'Criando conta...' : 'Entrando...') : mode === 'register' ? 'Criar conta' : 'Entrar com PIN'}
        </Button>

        <div className="auth-divider"><span>ou</span></div>

        <Button variant="secondary" onClick={handleGoogleLogin} disabled={busy || loading}>
          <Chrome size={18} />
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
