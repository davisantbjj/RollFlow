import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email?: string;
  role: 'MASTER' | 'ADMIN' | 'PROFESSOR' | 'ALUNO' | 'RESPONSAVEL';
  academyId: string | null;
  beltColor?: string;
  beltDegree?: number;
  phone?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  login: (user, token) => set({ user, token, isLoading: false }),
  logout: () => set({ user: null, token: null }),
  setLoading: (isLoading) => set({ isLoading }),
}));
