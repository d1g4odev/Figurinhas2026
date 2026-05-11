import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useRef, type PropsWithChildren } from 'react';
import { useAuthStore } from '../features/auth/auth.store';
import {
  resolvePendingGoogleLogin,
  subscribeToAuth
} from '../firebase/firebase.auth';

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
  const resolvedRedirectRef = useRef(false);

  useEffect(() => {
    if (!resolvedRedirectRef.current) {
      resolvedRedirectRef.current = true;
      resolvePendingGoogleLogin().catch(() => undefined);
    }

    const unsubscribe = subscribeToAuth((user) => {
      if (user) {
        setUser(user);
        return;
      }
      setUser(null);
      setError('');
    });
    return unsubscribe;
  }, [setError, setUser]);

  return null;
}
