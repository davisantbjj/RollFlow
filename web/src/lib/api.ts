export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

export const STORAGE = { token: 'rf_token', user: 'rf_user', academy: 'rf_academy' } as const;

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function read(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function clearSession() {
  try {
    Object.values(STORAGE).forEach((k) => localStorage.removeItem(k));
  } catch { /* storage indisponível */ }
}

interface Opts { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown }

export async function api<T = unknown>(path: string, opts: Opts = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  const token = read(STORAGE.token);
  if (token) headers.Authorization = `Bearer ${token}`;

  // Rotas /master/* e /auth/* não levam contexto de academia.
  if (!path.startsWith('/master') && !path.startsWith('/auth')) {
    try {
      const academy = JSON.parse(read(STORAGE.academy) || 'null') as { id: string } | null;
      if (academy?.id) headers['X-Academy-Id'] = academy.id;
    } catch { /* ignora */ }
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. Verifique sua conexão.', 0);
  }

  if (res.status === 401 && !path.startsWith('/auth/login')) {
    clearSession();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new ApiError('Sessão expirada. Entre novamente.', 401);
  }

  if (res.status === 204) return undefined as T;

  let data: unknown = null;
  try { data = await res.json(); } catch { /* corpo vazio */ }

  if (!res.ok) {
    const d = data as { error?: string; code?: string; message?: string } | null;
    throw new ApiError(d?.error || d?.message || `Erro ${res.status}`, res.status, d?.code);
  }
  return data as T;
}
