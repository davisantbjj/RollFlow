import { create } from 'zustand';

export type ToastKind = 'error' | 'success' | 'info';
export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

export interface ConfirmRequest {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  resolve: (ok: boolean) => void;
}

interface FeedbackState {
  toasts: Toast[];
  confirmReq: ConfirmRequest | null;
  push: (kind: ToastKind, message: string) => void;
  dismiss: (id: number) => void;
  setConfirm: (req: ConfirmRequest | null) => void;
}

let nextId = 1;

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  toasts: [],
  confirmReq: null,
  push: (kind, message) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, kind, message }] }));
    setTimeout(() => get().dismiss(id), kind === 'error' ? 5000 : 3000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setConfirm: (confirmReq) => set({ confirmReq }),
}));

/** Substitui Alert.alert (que vira window.alert e trava a página na web). */
export const notify = {
  error: (message: string) => useFeedbackStore.getState().push('error', message),
  success: (message: string) => useFeedbackStore.getState().push('success', message),
  info: (message: string) => useFeedbackStore.getState().push('info', message),
};

/** Abre o modal de confirmação e resolve true/false. */
export function confirmAction(opts: Omit<ConfirmRequest, 'resolve'>): Promise<boolean> {
  return new Promise((resolve) => {
    useFeedbackStore.getState().setConfirm({ ...opts, resolve });
  });
}

/** Extrai a mensagem de erro da API (`{ error }`) ou usa um texto padrão. */
export function apiError(err: any, fallback = 'Algo deu errado. Tente novamente.'): string {
  if (err?.response?.data?.error) return String(err.response.data.error);
  if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
    return 'Sem conexão com o servidor. Verifique sua internet.';
  }
  return fallback;
}
