import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useRef, type PropsWithChildren } from 'react';
import { useAuthStore } from '../features/auth/auth.store';
import { signInAnonymousUser, subscribeToAuth } from '../firebase/firebase.auth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false
    }
  }
});

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthObserver />
      {children}
    </QueryClientProvider>
  );
}

function AuthObserver() {
  const setUser = useAuthStore((state) => state.setUser);
  const setError = useAuthStore((state) => state.setError);
  const signingInRef = useRef(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      if (user) {
        setUser(user);
        return;
      }
      setUser(null);
      if (signingInRef.current) return;
      signingInRef.current = true;
      signInAnonymousUser()
        .catch((err) => {
          console.warn('Falha no login anônimo', err);
          setError('Não consegui criar sua sessão. Verifique sua conexão.');
        })
        .finally(() => {
          signingInRef.current = false;
        });
    });
    return unsubscribe;
  }, [setError, setUser]);

  return null;
}
