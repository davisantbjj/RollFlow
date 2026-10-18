'use client';

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { monthLabel, money, num } from '@/lib/format';
import type { MonthlyPoint } from '@/lib/types';
import { Card, Empty } from './ui';

const GOLD = '#e8b84b';
const BLUE = '#4b7ee8';
const GREEN = '#4be87a';

const tooltipStyle = {
  contentStyle: { background: '#1e2330', border: '1px solid #2a2f3d', borderRadius: 12, color: '#eef0f5', fontSize: 13 },
  labelStyle: { color: '#9aa1b2' },
  cursor: { fill: 'rgba(255,255,255,0.04)', stroke: '#2a2f3d' },
};

export function MonthlyCharts({ data }: { data: MonthlyPoint[] }) {
  if (!data?.length) return <Empty title="Sem histórico ainda" hint="Os gráficos aparecem quando houver alunos, presenças ou pagamentos." />;
  const rows = data.map((d) => ({ ...d, label: monthLabel(d.month) }));
  const axis = { stroke: '#6b7280', fontSize: 12, tickLine: false, axisLine: false } as const;

  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      <Card title="Alunos novos por mês">
        <div className="h-56" role="img" aria-label="Gráfico de alunos novos por mês">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows}>
              <CartesianGrid stroke="#2a2f3d" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" {...axis} />
              <YAxis allowDecimals={false} width={32} {...axis} />
              <Tooltip {...tooltipStyle} formatter={(v) => [num(Number(v)), 'Alunos novos']} />
              <Bar dataKey="newStudents" fill={BLUE} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card title="Presenças por mês">
        <div className="h-56" role="img" aria-label="Gráfico de presenças por mês">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows}>
              <defs>
                <linearGradient id="gAtt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GREEN} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#2a2f3d" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" {...axis} />
              <YAxis allowDecimals={false} width={36} {...axis} />
              <Tooltip {...tooltipStyle} formatter={(v) => [num(Number(v)), 'Presenças']} />
              <Area dataKey="attendance" stroke={GREEN} strokeWidth={2} fill="url(#gAtt)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card title="Receita por mês" className="lg:col-span-2 xl:col-span-1">
        <div className="h-56" role="img" aria-label="Gráfico de receita por mês">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GOLD} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#2a2f3d" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" {...axis} />
              <YAxis width={52} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} {...axis} />
              <Tooltip {...tooltipStyle} formatter={(v) => [money(Number(v)), 'Receita']} />
              <Area dataKey="revenue" stroke={GOLD} strokeWidth={2} fill="url(#gRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
