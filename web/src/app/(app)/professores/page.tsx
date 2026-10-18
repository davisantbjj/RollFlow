'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useFetch } from '@/lib/useFetch';
import { dateBR } from '@/lib/format';
import type { ClassItem, UserLite } from '@/lib/types';
import { UserFormModal } from '@/components/UserFormModal';
import { Async, Badge, BeltBadge, Button, DataTable, Empty, PageHeader, SearchBox, type Column } from '@/components/ui';

export default function ProfessoresPage() {
  const { user } = useAuth();
  const state = useFetch<UserLite[]>('/users?filterRole=PROFESSOR&includeAdmins=true');
  const classes = useFetch<ClassItem[]>('/classes');
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    const all = state.data ?? [];
    return t ? all.filter((u) => u.name.toLowerCase().includes(t) || u.email.toLowerCase().includes(t)) : all;
  }, [state.data, q]);

  const classesOf = (id: string) => (classes.data ?? []).filter((c) => c.teachers?.some((t) => t.id === id));

  const columns: Column<UserLite>[] = [
    {
      key: 'name', label: 'Nome', sortValue: (u) => u.name,
      render: (u) => (
        <span className="font-medium">
          {u.name} {u.id === user?.id && <span className="text-xs text-dim">(você)</span>}
        </span>
      ),
    },
    { key: 'email', label: 'E-mail', sortValue: (u) => u.email, render: (u) => <span className="text-dim">{u.email}</span> },
    { key: 'role', label: 'Função', sortValue: (u) => u.role, render: (u) => (u.role === 'ADMIN' ? <Badge tone="gold">Dono / sócio</Badge> : <Badge>Professor</Badge>) },
    { key: 'belt', label: 'Faixa', sortValue: (u) => u.beltColor ?? '', render: (u) => <BeltBadge color={u.beltColor} degree={u.beltDegree} /> },
    {
      key: 'classes', label: 'Turmas', sortValue: (u) => classesOf(u.id).length,
      render: (u) => {
        const c = classesOf(u.id);
        return c.length ? <span className="text-sm">{c.map((x) => x.name).join(', ')}</span> : <span className="text-dim">Nenhuma</span>;
      },
    },
    { key: 'since', label: 'Desde', sortValue: (u) => u.createdAt ?? '', render: (u) => dateBR(u.createdAt) },
  ];

  return (
    <>
      <PageHeader
        title="Professores"
        subtitle="Professores e donos que dão aula. Vincule-os às turmas na tela de Turmas."
        actions={<><SearchBox value={q} onChange={setQ} placeholder="Buscar por nome ou e-mail" /><Button onClick={() => setCreating(true)}>Novo professor</Button></>}
      />
      <Async state={state}>
        {() => (
          <DataTable
            rows={rows}
            columns={columns}
            initialSort={{ key: 'name', dir: 'asc' }}
            empty={
              <Empty
                title={q ? 'Nenhum professor encontrado' : 'Nenhum professor cadastrado'}
                hint={q ? 'Tente outro nome ou e-mail.' : 'Cadastre o primeiro professor da academia.'}
                action={!q ? <Button onClick={() => setCreating(true)}>Novo professor</Button> : undefined}
              />
            }
          />
        )}
      </Async>
      <UserFormModal open={creating} role="PROFESSOR" onClose={() => setCreating(false)} onCreated={state.reload} />
    </>
  );
}
