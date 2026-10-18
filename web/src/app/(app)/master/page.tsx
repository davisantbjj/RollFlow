'use client';

import { Plus } from 'lucide-react';
import { Building2, ClipboardCheck, DollarSign, GraduationCap, TriangleAlert, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useFetch } from '@/lib/useFetch';
import { dateBR, money, num } from '@/lib/format';
import type { MasterAcademy, MasterOverview } from '@/lib/types';
import { Async, Badge, Button, Card, DataTable, Empty, Kpi, PageHeader, SearchBox, type Column } from '@/components/ui';
import { MonthlyCharts } from '@/components/charts';

export default function MasterPage() {
  const overview = useFetch<MasterOverview>('/master/overview');
  const academies = useFetch<MasterAcademy[]>('/master/academies');
  const { setAcademy } = useAuth();
  const router = useRouter();
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!academies.data) return [];
    if (!t) return academies.data;
    return academies.data.filter((a) =>
      [a.name, a.owner?.name, a.owner?.email].some((s) => s?.toLowerCase().includes(t)),
    );
  }, [academies.data, q]);

  const columns: Column<MasterAcademy>[] = [
    {
      key: 'name', label: 'Academia', sortValue: (a) => a.name,
      render: (a) => (
        <Link href={`/master/academias/${a.id}`} className="font-medium hover:text-gold">{a.name}</Link>
      ),
    },
    {
      key: 'owner', label: 'Dono', sortValue: (a) => a.owner?.name ?? '',
      render: (a) => a.owner ? (<><span>{a.owner.name}</span><br /><span className="text-xs text-dim">{a.owner.email}</span></>) : <span className="text-dim">Sem dono</span>,
    },
    { key: 'students', label: 'Alunos', align: 'right', sortValue: (a) => a.activeStudents, render: (a) => num(a.activeStudents) },
    { key: 'teachers', label: 'Prof.', align: 'right', sortValue: (a) => a.teachersCount, render: (a) => num(a.teachersCount) },
    { key: 'att', label: 'Presenças 30d', align: 'right', sortValue: (a) => a.attendanceLast30d, render: (a) => num(a.attendanceLast30d) },
    { key: 'rev', label: 'Receita do mês', align: 'right', sortValue: (a) => a.revenueThisMonth, render: (a) => money(a.revenueThisMonth) },
    {
      key: 'overdue', label: 'Atrasos', align: 'right', sortValue: (a) => a.overdueCount,
      render: (a) => (a.overdueCount > 0 ? <Badge tone="danger">{a.overdueCount}</Badge> : <span className="text-dim">0</span>),
    },
    { key: 'last', label: 'Última atividade', sortValue: (a) => a.lastActivityAt ?? '', render: (a) => dateBR(a.lastActivityAt) },
    {
      key: 'go', label: '', render: (a) => (
        <Button small onClick={() => { setAcademy({ id: a.id, name: a.name }); router.push('/painel'); }}>Entrar</Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Visão geral RollFlow"
        subtitle="Todas as academias clientes em um só lugar."
        actions={<Link href="/master/academias/nova"><Button><Plus size={16} aria-hidden />Nova academia</Button></Link>}
      />

      <Async state={overview}>
        {(o) => (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              <Kpi icon={Building2} label="Academias" value={num(o.academiesCount)} tone="gold" />
              <Kpi icon={Users} label="Alunos ativos" value={num(o.activeStudents)} />
              <Kpi icon={GraduationCap} label="Professores" value={num(o.teachersCount)} />
              <Kpi icon={ClipboardCheck} label="Presenças (30 dias)" value={num(o.attendanceLast30d)} />
              <Kpi icon={DollarSign} label="Receita do mês" value={money(o.revenueThisMonth)} tone="gold" />
              <Kpi icon={TriangleAlert} label="Cobranças atrasadas" value={num(o.overdueCount)} tone={o.overdueCount ? 'danger' : 'default'} />
              <Kpi icon={TriangleAlert} label="Total em atraso" value={money(o.overdueTotal)} tone={o.overdueTotal ? 'danger' : 'default'} />
            </div>
            <MonthlyCharts data={o.monthly} />
          </div>
        )}
      </Async>

      <div className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Academias</h2>
          <SearchBox value={q} onChange={setQ} placeholder="Buscar por academia ou dono" />
        </div>
        <Async state={academies}>
          {() => (
            <DataTable
              rows={rows}
              columns={columns}
              initialSort={{ key: 'name', dir: 'asc' }}
              empty={
                <Empty
                  title={q ? 'Nenhuma academia encontrada' : 'Nenhuma academia cadastrada'}
                  hint={q ? 'Tente outro termo de busca.' : 'Cadastre a primeira academia cliente.'}
                  action={!q ? <Link href="/master/academias/nova"><Button><Plus size={16} aria-hidden />Nova academia</Button></Link> : undefined}
                />
              }
            />
          )}
        </Async>
      </div>
    </>
  );
}
