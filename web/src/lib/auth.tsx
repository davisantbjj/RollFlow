'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, clearSession, STORAGE } from './api';
import type { AcademyRef, SessionUser } from './types';

interface AuthCtx {
  ready: boolean;
  user: SessionUser | null;
  academy: AcademyRef | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setAcademy: (a: AcademyRef | null) => void;
}

const Ctx = createContext<AuthCtx | null>(null);

function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function save(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  } catch { /* storage indisponível */ }
}

export class NotAllowedError extends Error {}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [academy, setAcademyState] = useState<AcademyRef | null>(null);

  useEffect(() => {
    let token: string | null = null;
    try { token = localStorage.getItem(STORAGE.token); } catch { /* ignora */ }
    const u = load<SessionUser>(STORAGE.user);
    if (token && u && (u.role === 'MASTER' || u.role === 'ADMIN')) {
      setUser(u);
      setAcademyState(u.role === 'MASTER' ? load<AcademyRef>(STORAGE.academy) : null);
    } else {
      clearSession();
    }
    setReady(true);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ token: string; user: SessionUser }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    if (res.user.role !== 'MASTER' && res.user.role !== 'ADMIN') {
      throw new NotAllowedError('O painel web é para donos de academia. Use o app RollFlow.');
    }
    clearSession();
    save(STORAGE.token, res.token);
    save(STORAGE.user, res.user);
    setUser(res.user);
    setAcademyState(null);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setAcademyState(null);
  }, []);

  const setAcademy = useCallback((a: AcademyRef | null) => {
    save(STORAGE.academy, a);
    setAcademyState(a);
  }, []);

  const value = useMemo(
    () => ({ ready, user, academy, login, logout, setAcademy }),
    [ready, user, academy, login, logout, setAcademy],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth fora do AuthProvider');
  return c;
}
