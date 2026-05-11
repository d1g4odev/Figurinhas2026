import type { User } from 'firebase/auth';
import { create } from 'zustand';

type AuthStore = {
  user: User | null;
  loading: boolean;
  error: string;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  error: '',
  setUser: (user) => set((state) => ({ user, loading: false, error: user ? '' : state.error })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false })
}));
