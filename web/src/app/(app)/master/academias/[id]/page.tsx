'use client';

import { CalendarDays, ClipboardCheck, DollarSign, GraduationCap, TriangleAlert, Users } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { errMsg, useFetch } from '@/lib/useFetch';
import { dateBR, money, num } from '@/lib/format';
import type { MasterAcademy } from '@/lib/types';
import { useFeedback } from '@/components/feedback';
import { Async, Button, Card, Kpi, PageHeader, TextField } from '@/components/ui';
import { MonthlyCharts } from '@/components/charts';

export default function AcademiaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const state = useFetch<MasterAcademy>(`/master/academies/${id}`);
  const { setAcademy } = useAuth();
  const router = useRouter();

  return (
    <Async state={state}>
      {(a) => (
        <>
          <PageHeader
            title={a.name}
            subtitle={`Cliente desde ${dateBR(a.createdAt)} · Última atividade: ${dateBR(a.lastActivityAt)}`}
            actions={<Button onClick={() => { setAcademy({ id: a.id, name: a.name }); router.push('/painel'); }}>Entrar na academia</Button>}
          />
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              <Kpi icon={Users} label="Alunos ativos" value={num(a.activeStudents)} />
              <Kpi icon={GraduationCap} label="Professores" value={num(a.teachersCount)} />
              <Kpi icon={CalendarDays} label="Turmas" value={num(a.classesCount)} />
              <Kpi icon={ClipboardCheck} label="Presenças (30 dias)" value={num(a.attendanceLast30d)} />
              <Kpi icon={DollarSign} label="Receita do mês" value={money(a.revenueThisMonth)} tone="gold" />
              <Kpi icon={TriangleAlert} label="Cobranças atrasadas" value={num(a.overdueCount)} tone={a.overdueCount ? 'danger' : 'default'} />
            </div>
            <MonthlyCharts data={a.monthly ?? []} />
            <div className="grid gap-4 lg:grid-cols-2">
              <Card title="Dono">
                {a.owner ? (
                  <dl className="space-y-1 text-sm">
                    <div><dt className="inline text-dim">Nome: </dt><dd className="inline">{a.owner.name}</dd></div>
                    <div><dt className="inline text-dim">E-mail: </dt><dd className="inline">{a.owner.email}</dd></div>
                  </dl>
                ) : <p className="text-sm text-dim">Esta academia ainda não tem um dono cadastrado.</p>}
              </Card>
              <EditForm academy={a} onSaved={state.reload} />
            </div>
          </div>
        </>
      )}
    </Async>
  );
}

function EditForm({ academy, onSaved }: { academy: MasterAcademy; onSaved: () => void }) {
  const { notify } = useFeedback();
  const [f, setF] = useState({ name: '', cnpj: '', phone: '', address: '', blockAfterDays: '5' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setF({
      name: academy.name,
      cnpj: academy.cnpj ?? '',
      phone: academy.phone ?? '',
      address: academy.address ?? '',
      blockAfterDays: String(academy.blockAfterDays ?? 5),
    });
  }, [academy]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (f.name.trim().length < 2) err.name = 'Informe o nome da academia.';
    const days = Number(f.blockAfterDays);
    if (!Number.isInteger(days) || days < 0) err.blockAfterDays = 'Use um número inteiro de dias (0 ou mais).';
    setErrors(err);
    if (Object.keys(err).length) return;
    setBusy(true);
    try {
      await api(`/master/academies/${academy.id}`, {
        method: 'PUT',
        body: { name: f.name.trim(), cnpj: f.cnpj.trim() || undefined, phone: f.phone.trim() || undefined, address: f.address.trim() || undefined, blockAfterDays: days },
      });
      notify('Dados da academia salvos.');
      onSaved();
    } catch (e2) {
      notify(errMsg(e2), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Dados da academia">
      <form onSubmit={submit} noValidate className="space-y-4">
        <TextField label="Nome" value={f.name} onChange={set('name')} error={errors.name} />
        <TextField label="CNPJ" value={f.cnpj} onChange={set('cnpj')} />
        <TextField label="Telefone" value={f.phone} onChange={set('phone')} />
        <TextField label="Endereço" value={f.address} onChange={set('address')} />
        <TextField label="Bloquear aluno após (dias de atraso)" type="number" min={0} value={f.blockAfterDays} onChange={set('blockAfterDays')} error={errors.blockAfterDays} />
        <Button type="submit" loading={busy}>Salvar alterações</Button>
      </form>
    </Card>
  );
}
