import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, type PropsWithChildren } from 'react';
import { useAuthStore } from '../features/auth/auth.store';
import { subscribeToAuth } from '../firebase/firebase.auth';

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

  useEffect(() => subscribeToAuth(setUser), [setUser]);

  return null;
}
