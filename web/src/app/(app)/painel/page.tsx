'use client';

import { ClipboardCheck, DollarSign, TrendingUp, TriangleAlert, UserX, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { errMsg, useFetch } from '@/lib/useFetch';
import { dateBR, money, num } from '@/lib/format';
import type { Analytics, StudentRef } from '@/lib/analytics';
import { MonthlyCharts } from '@/components/charts';
import { useFeedback } from '@/components/feedback';
import { Async, BeltBadge, Button, Card, Kpi, PageHeader, ProgressBar } from '@/components/ui';

const SHORTCUTS = [
  { href: '/alunos', title: 'Alunos' },
  { href: '/professores', title: 'Professores' },
  { href: '/turmas', title: 'Turmas' },
  { href: '/financeiro', title: 'Financeiro' },
];

function Who({ s }: { s: StudentRef }) {
  return (
    <div className="min-w-0">
      <Link href={`/alunos/${s.id}`} className="block truncate font-medium hover:text-gold">{s.name}</Link>
      <BeltBadge color={s.beltColor} degree={s.beltDegree} />
    </div>
  );
}

function ListCard({ title, hint, empty, children, isEmpty }: { title: string; hint?: string; empty: string; children: ReactNode; isEmpty: boolean }) {
  return (
    <Card title={title}>
      {hint && <p className="-mt-2 mb-3 text-xs text-dim">{hint}</p>}
      {isEmpty ? <p className="py-6 text-center text-sm text-dim">{empty}</p> : <ul className="divide-y divide-line">{children}</ul>}
    </Card>
  );
}

const Row = ({ children }: { children: ReactNode }) => <li className="flex items-center justify-between gap-3 py-2.5 text-sm">{children}</li>;

export default function PainelPage() {
  const { user, academy } = useAuth();
  const state = useFetch<Analytics>('/dashboard/analytics');
  const { notify, confirm } = useFeedback();

  async function pay(paymentId: string, name: string, amount: number) {
    if (!(await confirm({ title: 'Marcar como pago?', message: `${name} · ${money(amount)}. Se não restar atraso, o aluno é desbloqueado.`, confirmLabel: 'Marcar como pago' }))) return;
    try {
      await api(`/payments/${paymentId}/pay`, { method: 'POST' });
      notify('Pagamento registrado.');
      state.reload();
    } catch (e) {
      notify(errMsg(e), 'error');
    }
  }

  return (
    <>
      <PageHeader
        title={academy ? academy.name : 'Painel'}
        subtitle={`Olá, ${user?.name.split(' ')[0]}. Veja como a academia está indo e quem precisa da sua atenção.`}
      />
      <Async state={state}>
        {(d) => {
          const s = d.summary;
          const gap = s.expectedRevenueThisMonth - s.revenueThisMonth;
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <Kpi icon={DollarSign} label="Receita do mês" value={money(s.revenueThisMonth)} tone="gold" hint={`Prevista ${money(s.expectedRevenueThisMonth)}${gap > 0 ? ` · faltam ${money(gap)}` : ''}`} />
                <Kpi icon={TriangleAlert} label="Inadimplência" value={`${Math.round(s.delinquencyRate * 100)}%`} tone={s.overdueCount ? 'danger' : 'default'} hint={`${num(s.overdueCount)} em atraso · ${money(s.overdueTotal)}`} />
                <Kpi icon={Users} label="Alunos ativos" value={num(s.activeStudents)} hint={`${num(s.newStudentsThisMonth)} novos neste mês`} />
                <Kpi icon={ClipboardCheck} label="Presença média" value={s.avgAttendancePerStudent30d.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} hint={`treinos por aluno em 30 dias · ${num(s.attendanceLast30d)} no total`} />
                <Kpi icon={UserX} label="Em risco de evasão" value={num(s.atRiskCount)} tone={s.atRiskCount ? 'danger' : 'default'} hint="14+ dias sem treinar" />
                <Kpi icon={TrendingUp} label="Prontos para graduar" value={num(s.readyToPromoteCount)} tone={s.readyToPromoteCount ? 'gold' : 'default'} />
              </div>

              <MonthlyCharts data={d.monthly} />

              <div className="grid gap-4 xl:grid-cols-2">
                <ListCard title="Inadimplentes" empty="Nenhuma cobrança atrasada." isEmpty={!d.overdue.length}>
                  {d.overdue.map((o) => (
                    <Row key={o.paymentId}>
                      <Who s={o.student} />
                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-right">
                          <p className="font-medium tabular-nums text-danger">{money(o.amount)}</p>
                          <p className="text-xs text-dim">{o.daysLate} dias de atraso{o.isBlocked ? ' · bloqueado' : ''}</p>
                        </div>
                        <Button small onClick={() => pay(o.paymentId, o.student.name, o.amount)}>Marcar como pago</Button>
                      </div>
                    </Row>
                  ))}
                </ListCard>

                <ListCard title="Alunos em risco de evasão" hint="Sem treinar há duas semanas ou mais." empty="Todo mundo está treinando." isEmpty={!d.atRisk.length}>
                  {d.atRisk.map((r) => (
                    <Row key={r.student.id}>
                      <Who s={r.student} />
                      <div className="shrink-0 text-right text-xs text-dim">
                        <p className="text-sm font-medium text-danger">{r.daysSinceLastAttendance === null ? 'Nunca treinou' : `${r.daysSinceLastAttendance} dias`}</p>
                        {r.lastAttendanceAt && <p>Último treino {dateBR(r.lastAttendanceAt)}</p>}
                      </div>
                    </Row>
                  ))}
                </ListCard>

                <ListCard title="Quem mais falta" hint="Presenças nos últimos 30 dias, comparadas aos 30 anteriores." empty="Sem dados de presença ainda." isEmpty={!d.lowAttendance.length}>
                  {d.lowAttendance.map((r) => {
                    const diff = r.attendanceLast30d - r.attendancePrev30d;
                    return (
                      <Row key={r.student.id}>
                        <Who s={r.student} />
                        <div className="shrink-0 text-right">
                          <p className="font-medium tabular-nums">{r.attendanceLast30d} <span className="text-xs text-dim">vs {r.attendancePrev30d}</span></p>
                          <p className={`text-xs ${diff < 0 ? 'text-danger' : 'text-dim'}`}>{diff === 0 ? 'igual' : `${diff > 0 ? '+' : ''}${diff}`}</p>
                        </div>
                      </Row>
                    );
                  })}
                </ListCard>

                <ListCard title="Prontos para graduar" hint="Abra o aluno para promover." empty="Ninguém atingiu os critérios ainda." isEmpty={!d.readyToPromote.length}>
                  {d.readyToPromote.map((r) => (
                    <Row key={r.student.id}>
                      <Who s={r.student} />
                      <Link href={`/alunos/${r.student.id}`}><Button small>Promover</Button></Link>
                    </Row>
                  ))}
                </ListCard>

                <ListCard title="Progressão mais baixa" empty="Sem alunos para mostrar." isEmpty={!d.lowProgress.length}>
                  {d.lowProgress.map((r) => (
                    <Row key={r.student.id}>
                      <Who s={r.student} />
                      <div className="w-40 shrink-0"><ProgressBar label="Progresso" value={r.progress} /></div>
                    </Row>
                  ))}
                </ListCard>

                <ListCard title="Sem avaliação recente" hint="Há 60 dias ou mais sem avaliar." empty="Todas as avaliações estão em dia." isEmpty={!d.noRecentEvaluation.length}>
                  {d.noRecentEvaluation.map((r) => (
                    <Row key={r.student.id}>
                      <Who s={r.student} />
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-xs text-dim">{r.daysSinceEvaluation === null ? 'Nunca avaliado' : `${r.daysSinceEvaluation} dias`}</span>
                        <Link href={`/alunos/${r.student.id}`}><Button small variant="outline">Avaliar</Button></Link>
                      </div>
                    </Row>
                  ))}
                </ListCard>
              </div>

              <Card title="Ocupação das turmas">
                {d.classes.length ? (
                  <ul className="grid gap-4 md:grid-cols-2">
                    {d.classes.map((c) => (
                      <li key={c.id} className="rounded-xl border border-line bg-panel p-4">
                        <div className="mb-2 flex justify-between gap-2 text-sm">
                          <span className="font-medium">{c.name}</span>
                          <span className="text-dim">{[c.dayOfWeek, c.startTime].filter(Boolean).join(' ')}</span>
                        </div>
                        {c.occupancy !== null && c.maxStudents ? (
                          <ProgressBar label={`${c.enrolled} de ${c.maxStudents} vagas`} value={Math.round(c.occupancy * 100)} />
                        ) : <p className="text-xs text-dim">{c.enrolled} matriculados · sem limite de vagas</p>}
                        <p className="mt-2 text-xs text-dim">{num(c.attendanceLast30d)} presenças em 30 dias · {c.teachers.length ? c.teachers.map((t) => t.name).join(', ') : 'sem professor'}</p>
                      </li>
                    ))}
                  </ul>
                ) : <p className="py-6 text-center text-sm text-dim">Nenhuma turma cadastrada.</p>}
              </Card>

              <div className="flex flex-wrap gap-2">
                {SHORTCUTS.map((x) => <Link key={x.href} href={x.href}><Button variant="ghost">{x.title}</Button></Link>)}
              </div>
            </div>
          );
        }}
      </Async>
    </>
  );
}
