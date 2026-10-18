'use client';

import { useEffect, useId, useMemo, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { ChevronDown, ChevronsUpDown, ChevronUp, Inbox, TriangleAlert, type LucideIcon } from 'lucide-react';
import { BELT_COLOR, beltName } from '@/lib/format';

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

/* ---------- Botões ---------- */
type Variant = 'primary' | 'ghost' | 'danger' | 'outline';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-gold text-ink hover:bg-gold2 font-semibold',
  outline: 'border border-gold/50 text-gold hover:bg-gold/10',
  ghost: 'border border-line text-fg hover:bg-card2',
  danger: 'bg-danger/15 border border-danger/50 text-danger hover:bg-danger/25',
};

export function Button({
  variant = 'primary', small, loading, className, children, disabled, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; small?: boolean; loading?: boolean }) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        small ? 'min-h-9 px-3 py-1.5 text-xs' : 'min-h-11 px-4 py-2.5 text-sm',
        VARIANTS[variant],
        className,
      )}
    >
      {loading && <Spinner size={14} />}
      {children}
    </button>
  );
}

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <span
      role="status"
      aria-label="Carregando"
      className="inline-block rounded-full border-2 border-current border-t-transparent"
      style={{ width: size, height: size, animation: 'rf-spin .7s linear infinite' }}
    />
  );
}

/* ---------- Layout de página ---------- */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-4xl uppercase tracking-wider">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-dim">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className }: { title?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx('rounded-[20px] border border-line bg-card p-5', className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title && <h2 className="text-base font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, hint, tone = 'default', icon: Icon }: { label: string; value: string; hint?: string; tone?: 'default' | 'gold' | 'danger'; icon?: LucideIcon }) {
  return (
    <div className="rounded-[20px] border border-line bg-card p-5">
      <div className="flex items-center gap-2 text-muted">
        {Icon && <Icon size={16} strokeWidth={2} className={cx(tone === 'gold' && 'text-gold', tone === 'danger' && 'text-danger')} aria-hidden />}
        <p className="font-mono text-[11px] uppercase tracking-wider">{label}</p>
      </div>
      <p className={cx('mt-3 font-display text-4xl tracking-wide tabular-nums', tone === 'gold' && 'text-gold', tone === 'danger' && 'text-danger')}>{value}</p>
      {hint && <p className="mt-1 font-mono text-[11px] text-dim">{hint}</p>}
    </div>
  );
}

/* ---------- Estados ---------- */
export function Loading({ label = 'Carregando' }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-4">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-28" />)}
      </div>
      <div className="skeleton h-56" />
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-[20px] border border-danger/30 bg-danger/10 p-8 text-center">
      <TriangleAlert size={32} className="text-danger" aria-hidden />
      <p className="mt-3 text-sm text-danger">{message}</p>
      {onRetry && <Button variant="ghost" small className="mt-4" onClick={onRetry}>Tentar de novo</Button>}
    </div>
  );
}

export function Empty({ title, hint, action, icon: Icon = Inbox }: { title: string; hint?: string; action?: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col items-center rounded-[20px] border border-dashed border-line px-6 py-12 text-center">
      <Icon size={36} className="text-muted" aria-hidden />
      <p className="mt-3 font-semibold">{title}</p>
      {hint && <p className="mt-1 text-sm text-dim">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Mostra Loading/Erro enquanto não há dado. */
export function Async<T>({ state, children }: { state: { data: T | null; error: string | null; loading: boolean; reload: () => void }; children: (d: T) => ReactNode }) {
  if (state.data === null) {
    if (state.error) return <ErrorState message={state.error} onRetry={state.reload} />;
    return <Loading />;
  }
  return <>{children(state.data)}</>;
}

/* ---------- Badges ---------- */
export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'ok' | 'danger' | 'gold' | 'info'; children: ReactNode }) {
  const tones = {
    neutral: 'bg-card2 text-dim border-line',
    ok: 'bg-ok/10 text-ok border-ok/30',
    danger: 'bg-danger/10 text-danger border-danger/30',
    gold: 'bg-gold/10 text-gold border-gold/30',
    info: 'bg-info/10 text-info border-info/30',
  };
  return <span className={cx('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold', tones[tone])}>{children}</span>;
}

export function BeltBadge({ color, degree }: { color?: string | null; degree?: number | null }) {
  if (!color) return <span className="text-dim">—</span>;
  const bg = BELT_COLOR[color] ?? '#999';
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className="relative inline-block h-3 w-9 rounded-sm border border-white/20" style={{ background: bg }}>
        {!!degree && (
          <span className="absolute right-0.5 top-0 flex h-full items-center gap-px">
            {Array.from({ length: Math.min(degree, 4) }).map((_, i) => (
              <span key={i} className="h-full w-[2px]" style={{ background: color === 'BRANCA' ? '#111' : '#fff' }} />
            ))}
          </span>
        )}
      </span>
      {beltName(color)}
      {!!degree && <span className="text-xs text-dim">{degree}º grau</span>}
    </span>
  );
}

/* ---------- Formulário ---------- */
const fieldBase =
  'w-full rounded-xl border border-line bg-card px-3 py-2.5 text-sm text-fg placeholder:text-dim/60 focus:border-gold focus:outline-none disabled:opacity-50';

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactNode }) {
  const id = useId();
  const descId = error || hint ? `${id}-d` : undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold">{label}</label>
      {children({ id, 'aria-invalid': !!error, 'aria-describedby': descId })}
      {(error || hint) && (
        <p id={descId} className={cx('mt-1 text-xs', error ? 'text-danger' : 'text-dim')}>{error || hint}</p>
      )}
    </div>
  );
}

type InputProps = { label: string; error?: string; hint?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'children'>;
export function TextField({ label, error, hint, className, ...rest }: InputProps) {
  return (
    <Field label={label} error={error} hint={hint}>
      {(p) => <input {...p} {...rest} className={cx(fieldBase, error && 'border-danger', className)} />}
    </Field>
  );
}

export function TextArea({ label, error, hint, ...rest }: { label: string; error?: string; hint?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field label={label} error={error} hint={hint}>
      {(p) => <textarea rows={3} {...p} {...rest} className={cx(fieldBase, error && 'border-danger')} />}
    </Field>
  );
}

export function SelectField({ label, error, hint, children, ...rest }: { label: string; error?: string; hint?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field label={label} error={error} hint={hint}>
      {(p) => <select {...p} {...rest} className={cx(fieldBase, error && 'border-danger')}>{children}</select>}
    </Field>
  );
}

export function SearchBox({ value, onChange, placeholder = 'Buscar…' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="search"
      aria-label={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cx(fieldBase, 'w-full sm:w-72')}
    />
  );
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children?: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => {
      const f = ref.current?.querySelector<HTMLElement>('input, select, textarea');
      (f ?? ref.current?.querySelector<HTMLElement>('button:last-of-type'))?.focus();
    }, 30);
    return () => {
      document.removeEventListener('keydown', onKey);
      clearTimeout(t);
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId}
        className={cx('rf-pop max-h-[90vh] w-full overflow-y-auto rounded-[20px] border border-line bg-card p-6 shadow-2xl', wide ? 'max-w-2xl' : 'max-w-md')}>
        <h2 id={titleId} className="mb-4 text-lg font-semibold">{title}</h2>
        {children}
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Tabela com ordenação ---------- */
export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  align?: 'right';
  className?: string;
}

export function DataTable<T extends { id: string }>({ rows, columns, initialSort, empty }: { rows: T[]; columns: Column<T>[]; initialSort?: { key: string; dir: 'asc' | 'desc' }; empty?: ReactNode }) {
  const [sort, setSort] = useState(initialSort ?? null);
  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort?.key);
    if (!col?.sortValue || !sort) return rows;
    const sv = col.sortValue;
    return [...rows].sort((a, b) => {
      const x = sv(a), y = sv(b);
      const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'pt-BR');
      return sort.dir === 'asc' ? r : -r;
    });
  }, [rows, columns, sort]);

  if (!rows.length && empty) return <>{empty}</>;

  return (
    <div className="overflow-x-auto rounded-[20px] border border-line bg-card">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-line font-mono text-[11px] uppercase tracking-wider text-muted">
            {columns.map((c) => {
              const active = sort?.key === c.key;
              return (
                <th key={c.key} scope="col" className={cx('px-4 py-3 font-normal', c.align === 'right' && 'text-right')}
                  aria-sort={active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                  {c.sortValue ? (
                    <button type="button" onClick={() => setSort(active && sort!.dir === 'asc' ? { key: c.key, dir: 'desc' } : { key: c.key, dir: 'asc' })}
                      className={cx('inline-flex items-center gap-1 hover:text-fg', active && 'text-gold')}>
                      {c.label}
                      {active ? (sort!.dir === 'asc' ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />) : <ChevronsUpDown size={14} aria-hidden />}
                    </button>
                  ) : c.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.id} className="border-b border-line/60 last:border-0 hover:bg-card2/50">
              {columns.map((c) => (
                <td key={c.key} className={cx('px-4 py-3 align-middle', c.align === 'right' && 'text-right font-mono text-[13px]', c.className)}>{c.render(r)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="mb-1 flex justify-between gap-2 text-xs text-dim"><span>{label}</span><span className="font-mono">{v}%</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-card2" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full rounded-full bg-gold" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}
