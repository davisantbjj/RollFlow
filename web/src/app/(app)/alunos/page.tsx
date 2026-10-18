'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { errMsg, useFetch } from '@/lib/useFetch';
import { dateBR } from '@/lib/format';
import type { UserLite } from '@/lib/types';
import { useFeedback } from '@/components/feedback';
import { UserFormModal } from '@/components/UserFormModal';
import { Async, Badge, BeltBadge, Button, DataTable, Empty, PageHeader, SearchBox, type Column } from '@/components/ui';

export default function AlunosPage() {
  const state = useFetch<UserLite[]>('/users?filterRole=ALUNO');
  const { notify, confirm } = useFeedback();
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    const all = state.data ?? [];
    return t ? all.filter((u) => u.name.toLowerCase().includes(t) || u.email.toLowerCase().includes(t)) : all;
  }, [state.data, q]);

  async function toggleBlock(u: UserLite) {
    const block = !u.isBlocked;
    const ok = await confirm({
      title: block ? `Bloquear ${u.name}?` : `Desbloquear ${u.name}?`,
      message: block
        ? 'O aluno continua entrando no app, mas só acessa o Financeiro até regularizar.'
        : 'O aluno volta a usar o app normalmente.',
      confirmLabel: block ? 'Bloquear' : 'Desbloquear',
      danger: block,
    });
    if (!ok) return;
    setBusyId(u.id);
    try {
      await api(`/users/${u.id}/block`, { method: 'PATCH', body: { isBlocked: block } });
      notify(block ? 'Aluno bloqueado.' : 'Aluno desbloqueado.');
      state.reload();
    } catch (e) {
      notify(errMsg(e), 'error');
    } finally {
      setBusyId(null);
    }
  }

  const columns: Column<UserLite>[] = [
    { key: 'name', label: 'Nome', sortValue: (u) => u.name, render: (u) => <Link href={`/alunos/${u.id}`} className="font-medium hover:text-gold">{u.name}</Link> },
    { key: 'email', label: 'E-mail', sortValue: (u) => u.email, render: (u) => <span className="text-dim">{u.email}</span> },
    { key: 'belt', label: 'Faixa', sortValue: (u) => u.beltColor ?? '', render: (u) => <BeltBadge color={u.beltColor} degree={u.beltDegree} /> },
    { key: 'since', label: 'Desde', sortValue: (u) => u.createdAt ?? '', render: (u) => dateBR(u.createdAt) },
    { key: 'status', label: 'Situação', sortValue: (u) => (u.isBlocked ? 1 : 0), render: (u) => (u.isBlocked ? <Badge tone="danger">Bloqueado</Badge> : <Badge tone="ok">Ativo</Badge>) },
    {
      key: 'act', label: '', align: 'right', render: (u) => (
        <div className="flex justify-end gap-2">
          <Link href={`/alunos/${u.id}`}><Button small variant="ghost">Detalhes</Button></Link>
          <Button small variant={u.isBlocked ? 'outline' : 'danger'} loading={busyId === u.id} onClick={() => toggleBlock(u)}>
            {u.isBlocked ? 'Desbloquear' : 'Bloquear'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Alunos"
        subtitle="Quem treina na sua academia."
        actions={<><SearchBox value={q} onChange={setQ} placeholder="Buscar por nome ou e-mail" /><Button onClick={() => setCreating(true)}>Novo aluno</Button></>}
      />
      <Async state={state}>
        {() => (
          <DataTable
            rows={rows}
            columns={columns}
            initialSort={{ key: 'name', dir: 'asc' }}
            empty={
              <Empty
                title={q ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
                hint={q ? 'Tente outro nome ou e-mail.' : 'Cadastre o primeiro aluno para começar.'}
                action={!q ? <Button onClick={() => setCreating(true)}>Novo aluno</Button> : undefined}
              />
            }
          />
        )}
      </Async>
      <UserFormModal open={creating} role="ALUNO" onClose={() => setCreating(false)} onCreated={state.reload} />
    </>
  );
}
