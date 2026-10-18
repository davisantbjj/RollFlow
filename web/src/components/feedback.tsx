'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Button, Modal } from './ui';

type ToastKind = 'ok' | 'error';
interface Toast { id: number; kind: ToastKind; text: string }

interface ConfirmOpts { title: string; message?: string; confirmLabel?: string; danger?: boolean }

interface FeedbackCtx {
  notify: (text: string, kind?: ToastKind) => void;
  confirm: (opts: ConfirmOpts) => Promise<boolean>;
}

const Ctx = createContext<FeedbackCtx | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [ask, setAsk] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const idRef = useRef(0);

  const notify = useCallback((text: string, kind: ToastKind = 'ok') => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const confirm = useCallback(
    (opts: ConfirmOpts) => new Promise<boolean>((resolve) => setAsk({ ...opts, resolve })),
    [],
  );

  const close = (v: boolean) => {
    ask?.resolve(v);
    setAsk(null);
  };

  return (
    <Ctx.Provider value={{ notify, confirm }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex w-[min(92vw,360px)] flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rf-pop rounded-xl border px-4 py-3 text-sm shadow-xl ${
              t.kind === 'ok' ? 'border-ok/40 bg-card text-fg' : 'border-danger/50 bg-card text-fg'
            }`}
          >
            <span className={t.kind === 'ok' ? 'text-ok' : 'text-danger'}>{t.kind === 'ok' ? 'Pronto. ' : 'Erro. '}</span>
            {t.text}
          </div>
        ))}
      </div>
      <Modal
        open={!!ask}
        onClose={() => close(false)}
        title={ask?.title ?? ''}
        footer={
          <>
            <Button variant="ghost" onClick={() => close(false)}>Cancelar</Button>
            <Button variant={ask?.danger ? 'danger' : 'primary'} onClick={() => close(true)}>
              {ask?.confirmLabel ?? 'Confirmar'}
            </Button>
          </>
        }
      >
        {ask?.message && <p className="text-sm text-dim">{ask.message}</p>}
      </Modal>
    </Ctx.Provider>
  );
}

export function useFeedback() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useFeedback fora do FeedbackProvider');
  return c;
}
