import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Na renderização web do lado do servidor não existe `window`; ali a sessão não é salva
const isServer = Platform.OS === 'web' && typeof window === 'undefined';
const noopStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

export type Role = 'MASTER' | 'ADMIN' | 'PROFESSOR' | 'ALUNO' | 'RESPONSAVEL';

export interface User {
  id: string;
  name: string;
  email?: string;
  role: Role;
  academyId: string | null;
  beltColor?: string;
  beltDegree?: number;
  phone?: string;
  /** inadimplente: só acessa Financeiro e Perfil */
  isBlocked?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  /** true quando a sessão salva já foi lida do armazenamento */
  hydrated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setBlocked: (isBlocked: boolean) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      hydrated: false,
      login: (user, token) => set({ user, token, isLoading: false }),
      logout: () => set({ user: null, token: null }),
      setBlocked: (isBlocked) =>
        set((state) => (state.user && state.user.isBlocked !== isBlocked ? { user: { ...state.user, isBlocked } } : state)),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'rollflow-auth',
      storage: createJSONStorage(() => (isServer ? noopStorage : AsyncStorage)),
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ hydrated: true });
      },
    }
  )
);

// No app, o MASTER não tem academia (usa o painel web): as telas de academia são só do dono e do professor.
export const isMaster = (role?: Role | null) => role === 'MASTER';
export const isManagement = (role?: Role | null) => role === 'ADMIN';
export const isStaff = (role?: Role | null) => role === 'ADMIN' || role === 'PROFESSOR';
