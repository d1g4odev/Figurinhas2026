import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, type PropsWithChildren } from 'react';
import { useAuthStore } from '../features/auth/auth.store';
import { authErrorMessage, resolveRedirectLogin, subscribeToAuth } from '../firebase/firebase.auth';

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

  useEffect(() => {
    resolveRedirectLogin().catch((error) => {
      console.warn('Erro ao finalizar login Google', error);
      setError(authErrorMessage(error));
    });

    return subscribeToAuth(setUser);
  }, [setError, setUser]);

  return null;
}
