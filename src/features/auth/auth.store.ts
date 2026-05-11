import type { User } from 'firebase/auth';
import { create } from 'zustand';
import type { UserProfile } from '../../firebase/firebase.firestore';

type AuthStore = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  profile: null,
  loading: true,
  error: '',
  setUser: (user) => set((state) => ({
    user,
    profile: user ? state.profile : null,
    loading: false,
    error: user ? '' : state.error
  })),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false })
}));
