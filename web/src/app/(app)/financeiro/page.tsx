'use client';

import { Clock, DollarSign, TriangleAlert } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';
import { errMsg, useFetch } from '@/lib/useFetch';
import { INTERVAL_LABEL, dateBR, money, num } from '@/lib/format';
import type { Interval, PaymentRow, PaymentsOverview, Plan } from '@/lib/types';
import { useFeedback } from '@/components/feedback';
import { Async, Badge, Button, Card, DataTable, Empty, ErrorState, Kpi, Loading, Modal, PageHeader, SelectField, TextField, type Column } from '@/components/ui';

export default function FinanceiroPage() {
  const overview = useFetch<PaymentsOverview>('/payments/overview');
  const plans = useFetch<Plan[]>('/plans');
  const { notify, confirm } = useFeedback();
  const [paying, setPaying] = useState<string | null>(null);
  const [editing, setEditing] = useState<Plan | 'new' | null>(null);

  async function pay(p: PaymentRow) {
    const ok = await confirm({
      title: 'Marcar como pago?',
      message: `${p.user.name} · ${money(p.amount)} com vencimento em ${dateBR(p.dueDate)}. A próxima cobrança será gerada e, se não houver mais atrasos, o aluno é desbloqueado.`,
      confirmLabel: 'Marcar como pago',
    });
    if (!ok) return;
    setPaying(p.id);
    try {
      await api(`/payments/${p.id}/pay`, { method: 'POST' });
      notify('Pagamento registrado.');
      overview.reload();
    } catch (e) {
      notify(errMsg(e), 'error');
    } finally {
      setPaying(null);
    }
  }

  async function removePlan(p: Plan) {
    const ok = await confirm({
      title: `Desativar o plano ${p.name}?`,
      message: 'O plano deixa de aparecer para novas assinaturas. Quem já assina continua com ele.',
      confirmLabel: 'Desativar plano',
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/plans/${p.id}`, { method: 'DELETE' });
      notify('Plano desativado.');
      plans.reload();
    } catch (e) {
      notify(errMsg(e), 'error');
    }
  }

  const columns: Column<PaymentRow>[] = [
    { key: 'user', label: 'Aluno', sortValue: (p) => p.user.name, render: (p) => <span className="font-medium">{p.user.name}</span> },
    { key: 'plan', label: 'Plano', sortValue: (p) => p.plan?.name ?? '', render: (p) => p.plan?.name ?? '—' },
    { key: 'due', label: 'Vencimento', sortValue: (p) => p.dueDate, render: (p) => dateBR(p.dueDate) },
    { key: 'amount', label: 'Valor', align: 'right', sortValue: (p) => p.amount, render: (p) => money(p.amount) },
    { key: 'status', label: 'Situação', sortValue: (p) => (p.isOverdue ? 0 : 1), render: (p) => (p.isOverdue ? <Badge tone="danger">Atrasada</Badge> : <Badge tone="gold">Pendente</Badge>) },
    { key: 'act', label: '', align: 'right', render: (p) => <Button small loading={paying === p.id} onClick={() => pay(p)}>Marcar como pago</Button> },
  ];

  const planCols: Column<Plan>[] = [
    { key: 'name', label: 'Plano', sortValue: (p) => p.name, render: (p) => <span className="font-medium">{p.name}</span> },
    { key: 'desc', label: 'Descrição', render: (p) => <span className="text-dim">{p.description || '—'}</span> },
    { key: 'interval', label: 'Cobrança', render: (p) => INTERVAL_LABEL[p.interval] ?? p.interval },
    { key: 'price', label: 'Valor', align: 'right', sortValue: (p) => p.price, render: (p) => money(p.price) },
    {
      key: 'act', label: '', align: 'right', render: (p) => (
        <div className="flex justify-end gap-2">
          <Button small variant="ghost" onClick={() => setEditing(p)}>Editar</Button>
          <Button small variant="danger" onClick={() => removePlan(p)}>Desativar</Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Financeiro" subtitle="Mensalidades, cobranças em aberto e planos." />
      <Async state={overview}>
        {(o) => (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              <Kpi icon={DollarSign} label="Receita do mês" value={money(o.monthRevenue)} tone="gold" />
              <Kpi icon={TriangleAlert} label="Total em atraso" value={money(o.overdueTotal)} tone={o.overdueTotal ? 'danger' : 'default'} />
              <Kpi icon={TriangleAlert} label="Cobranças atrasadas" value={num(o.overdueCount)} tone={o.overdueCount ? 'danger' : 'default'} />
              <Kpi icon={Clock} label="Cobranças pendentes" value={num(o.pendingCount)} />
            </div>
            <h2 className="pt-2 text-lg font-semibold">Cobranças em aberto</h2>
            <DataTable rows={o.payments} columns={columns}
              empty={<Empty title="Nenhuma cobrança em aberto" hint="Quando um aluno assinar um plano, a cobrança aparece aqui." />} />
          </div>
        )}
      </Async>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Planos</h2>
          <Button onClick={() => setEditing('new')}>Novo plano</Button>
        </div>
        <Async state={plans}>
          {(list) => {
            const active = list.filter((p) => p.isActive !== false);
            return (
              <DataTable rows={active} columns={planCols} initialSort={{ key: 'price', dir: 'asc' }}
                empty={<Empty title="Nenhum plano cadastrado" hint="Crie planos para atribuir aos alunos." action={<Button onClick={() => setEditing('new')}>Novo plano</Button>} />} />
            );
          }}
        </Async>
      </div>
      <PlanFormModal target={editing} onClose={() => setEditing(null)} onSaved={plans.reload} />
    </>
  );
}

function PlanFormModal({ target, onClose, onSaved }: { target: Plan | 'new' | null; onClose: () => void; onSaved: () => void }) {
  const { notify } = useFeedback();
  const open = target !== null;
  const editing = target && target !== 'new' ? target : null;
  const [f, setF] = useState({ name: '', description: '', price: '', interval: 'MONTHLY' as Interval });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setF({ name: editing?.name ?? '', description: editing?.description ?? '', price: editing ? String(editing.price) : '', interval: editing?.interval ?? 'MONTHLY' });
  }, [open, editing]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    const price = Number(f.price.replace(',', '.'));
    if (f.name.trim().length < 2) err.name = 'Informe o nome do plano (mínimo 2 letras).';
    if (!f.price || !(price > 0)) err.price = 'Informe um valor maior que zero.';
    setErrors(err);
    if (Object.keys(err).length) return;
    const body = { name: f.name.trim(), description: f.description.trim() || undefined, price, interval: f.interval };
    setBusy(true);
    try {
      if (editing) await api(`/plans/${editing.id}`, { method: 'PUT', body });
      else await api('/plans', { method: 'POST', body });
      notify(editing ? 'Plano atualizado.' : 'Plano criado.');
      onSaved();
      onClose();
    } catch (e2) {
      notify(errMsg(e2), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar plano' : 'Novo plano'}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <TextField label="Nome" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} error={errors.name} />
        <TextField label="Descrição (opcional)" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <TextField label="Valor (R$)" inputMode="decimal" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} error={errors.price} placeholder="170,00" />
        <SelectField label="Cobrança" value={f.interval} onChange={(e) => setF({ ...f, interval: e.target.value as Interval })}>
          {Object.entries(INTERVAL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </SelectField>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={busy}>{editing ? 'Salvar alterações' : 'Criar plano'}</Button>
        </div>
      </form>
    </Modal>
  );
}
