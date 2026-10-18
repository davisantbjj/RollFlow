'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useFetch } from '@/lib/useFetch';
import { ROLE_LABEL } from '@/lib/format';
import type { MasterAcademy } from '@/lib/types';
import { Building2, CalendarDays, ChartLine, GraduationCap, LogOut, Menu, Plus, Users, Wallet, type LucideIcon } from 'lucide-react';
import { Loading, cx } from './ui';
import { Logo } from './Logo';

const MASTER_NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/master', label: 'Visão geral', icon: Building2 },
  { href: '/master/academias/nova', label: 'Nova academia', icon: Plus },
];

const ACADEMY_NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/painel', label: 'Análise', icon: ChartLine },
  { href: '/alunos', label: 'Alunos', icon: Users },
  { href: '/professores', label: 'Professores', icon: GraduationCap },
  { href: '/turmas', label: 'Turmas', icon: CalendarDays },
  { href: '/financeiro', label: 'Financeiro', icon: Wallet },
];

export function Shell({ children }: { children: ReactNode }) {
  const { ready, user, academy, setAcademy, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isMaster = user?.role === 'MASTER';
  const inMasterArea = pathname.startsWith('/master');

  // Guarda de rotas
  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace('/login');
    else if (!isMaster && inMasterArea) router.replace('/painel');
    else if (isMaster && !academy && !inMasterArea) router.replace('/master');
  }, [ready, user, isMaster, academy, inMasterArea, router]);

  useEffect(() => setOpen(false), [pathname]);

  const allowed = ready && user && (isMaster ? inMasterArea || !!academy : !inMasterArea);
  if (!allowed || !user) return <Loading />;

  const nav = inMasterArea ? MASTER_NAV : ACADEMY_NAV;
  const academyLabel = isMaster ? academy?.name : null;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-40 flex w-[250px] flex-col border-r border-line bg-ink p-4 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="px-2 pb-6 pt-2"><Logo /></div>
        <nav aria-label="Menu principal" className="flex flex-1 flex-col gap-1">
          {academyLabel && !inMasterArea && (
            <p className="mb-2 truncate px-3 text-xs text-dim">Academia: <span className="text-gold">{academyLabel}</span></p>
          )}
          {inMasterArea && <p className="mb-2 px-3 text-xs text-dim">Visão geral RollFlow</p>}
          {nav.map((n) => {
            const active = n.href === '/master' ? pathname === '/master' : pathname === n.href || pathname.startsWith(n.href + '/');
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors',
                  active ? 'bg-gold/10 text-gold' : 'text-muted hover:bg-card hover:text-fg',
                )}
              >
                {active && <span aria-hidden className="absolute -left-4 top-2 bottom-2 w-1 rounded-r bg-gold" />}
                <n.icon size={22} strokeWidth={1.75} aria-hidden />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <p className="px-3 font-mono text-[11px] text-muted">painel web v0.1</p>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur lg:px-8">
          <button
            type="button"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-line lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu size={20} aria-hidden />
          </button>
          {isMaster && (
            <AcademySwitcher
              current={academy?.id ?? ''}
              onPick={(a) => {
                setAcademy(a);
                router.push(a ? '/painel' : '/master');
              }}
            />
          )}
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="font-mono text-[11px] uppercase text-muted">{ROLE_LABEL[user.role]}</p>
            </div>
            <button
              type="button"
              onClick={() => { logout(); router.replace('/login'); }}
              aria-label="Sair"
              className="flex min-h-11 items-center gap-2 rounded-xl border border-line px-3 text-sm font-semibold text-dim hover:bg-card hover:text-fg"
            >
              <LogOut size={18} aria-hidden /> <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function AcademySwitcher({ current, onPick }: { current: string; onPick: (a: { id: string; name: string } | null) => void }) {
  const { data, error, loading } = useFetch<MasterAcademy[]>('/master/academies');
  return (
    <div className="min-w-0">
      <label htmlFor="academy-switch" className="sr-only">Academia</label>
      <select
        id="academy-switch"
        value={current}
        disabled={loading && !data}
        onChange={(e) => {
          const id = e.target.value;
          if (!id) return onPick(null);
          const a = data?.find((x) => x.id === id);
          if (a) onPick({ id: a.id, name: a.name });
        }}
        className="max-w-[46vw] min-h-11 rounded-xl border border-gold/40 bg-card px-3 text-sm font-semibold text-gold focus:outline-none sm:max-w-xs"
        title={error ?? undefined}
      >
        <option value="">Visão geral RollFlow</option>
        {current && !data?.some((a) => a.id === current) && <option value={current}>Academia selecionada</option>}
        {data?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>
    </div>
  );
}
