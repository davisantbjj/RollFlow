'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';
import { errMsg, useFetch } from '@/lib/useFetch';
import { DAYS, dateBR } from '@/lib/format';
import type { AttendanceRow, ClassDetail, ClassItem, UserLite } from '@/lib/types';
import { useFeedback } from '@/components/feedback';
import { Async, Badge, BeltBadge, Button, DataTable, Empty, ErrorState, Loading, Modal, PageHeader, SelectField, TextField, type Column } from '@/components/ui';

export default function TurmasPage() {
  const state = useFetch<ClassItem[]>('/classes');
  const { notify, confirm } = useFeedback();
  const [editing, setEditing] = useState<ClassItem | 'new' | null>(null);
  const [managing, setManaging] = useState<string | null>(null);

  async function remove(c: ClassItem) {
    const ok = await confirm({
      title: `Excluir a turma ${c.name}?`,
      message: 'As matrículas, os professores vinculados e as presenças dessa turma também serão removidos. Esta ação não pode ser desfeita.',
      confirmLabel: 'Excluir turma',
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/classes/${c.id}`, { method: 'DELETE' });
      notify('Turma excluída.');
      state.reload();
    } catch (e) {
      notify(errMsg(e), 'error');
    }
  }

  const columns: Column<ClassItem>[] = [
    { key: 'name', label: 'Turma', sortValue: (c) => c.name, render: (c) => <span className="font-medium">{c.name}</span> },
    { key: 'day', label: 'Dia', sortValue: (c) => DAYS.indexOf(c.dayOfWeek ?? ''), render: (c) => c.dayOfWeek || '—' },
    { key: 'time', label: 'Horário', sortValue: (c) => c.startTime ?? '', render: (c) => (c.startTime ? `${c.startTime}${c.endTime ? ` – ${c.endTime}` : ''}` : '—') },
    { key: 'max', label: 'Vagas', align: 'right', sortValue: (c) => c.maxStudents ?? 0, render: (c) => c.maxStudents ?? '—' },
    {
      key: 'teachers', label: 'Professores',
      render: (c) => c.teachers?.length ? <span className="text-sm">{c.teachers.map((t) => t.name).join(', ')}</span> : <Badge tone="danger">Sem professor</Badge>,
    },
    {
      key: 'act', label: '', align: 'right', render: (c) => (
        <div className="flex justify-end gap-2">
          <Button small onClick={() => setManaging(c.id)}>Gerenciar</Button>
          <Button small variant="ghost" onClick={() => setEditing(c)}>Editar</Button>
          <Button small variant="danger" onClick={() => remove(c)}>Excluir</Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Turmas" subtitle="Horários, professores, matrículas e presenças." actions={<Button onClick={() => setEditing('new')}>Nova turma</Button>} />
      <Async state={state}>
        {(rows) => (
          <DataTable rows={rows} columns={columns} initialSort={{ key: 'day', dir: 'asc' }}
            empty={<Empty title="Nenhuma turma cadastrada" hint="Crie a primeira turma para matricular alunos e fazer chamada." action={<Button onClick={() => setEditing('new')}>Nova turma</Button>} />} />
        )}
      </Async>
      <ClassFormModal target={editing} onClose={() => setEditing(null)} onSaved={state.reload} />
      <ManageModal classId={managing} onClose={() => setManaging(null)} onChanged={state.reload} />
    </>
  );
}

function ClassFormModal({ target, onClose, onSaved }: { target: ClassItem | 'new' | null; onClose: () => void; onSaved: () => void }) {
  const { notify } = useFeedback();
  const open = target !== null;
  const editing = target && target !== 'new' ? target : null;
  const [f, setF] = useState({ name: '', description: '', dayOfWeek: '', startTime: '', endTime: '', maxStudents: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setF({
      name: editing?.name ?? '',
      description: editing?.description ?? '',
      dayOfWeek: editing?.dayOfWeek ?? '',
      startTime: editing?.startTime ?? '',
      endTime: editing?.endTime ?? '',
      maxStudents: editing?.maxStudents ? String(editing.maxStudents) : '',
    });
  }, [open, editing]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (f.name.trim().length < 2) err.name = 'Informe o nome da turma (mínimo 2 letras).';
    const max = f.maxStudents ? Number(f.maxStudents) : undefined;
    if (max !== undefined && (!Number.isInteger(max) || max <= 0)) err.maxStudents = 'Use um número inteiro maior que zero.';
    setErrors(err);
    if (Object.keys(err).length) return;
    const body = {
      name: f.name.trim(),
      ...(f.description.trim() && { description: f.description.trim() }),
      ...(f.dayOfWeek && { dayOfWeek: f.dayOfWeek }),
      ...(f.startTime && { startTime: f.startTime }),
      ...(f.endTime && { endTime: f.endTime }),
      ...(max && { maxStudents: max }),
    };
    setBusy(true);
    try {
      if (editing) await api(`/classes/${editing.id}`, { method: 'PUT', body });
      else await api('/classes', { method: 'POST', body });
      notify(editing ? 'Turma atualizada.' : 'Turma criada.');
      onSaved();
      onClose();
    } catch (e2) {
      notify(errMsg(e2), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar turma' : 'Nova turma'}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <TextField label="Nome" value={f.name} onChange={set('name')} error={errors.name} />
        <TextField label="Descrição (opcional)" value={f.description} onChange={set('description')} />
        <SelectField label="Dia da semana" value={f.dayOfWeek} onChange={set('dayOfWeek')}>
          <option value="">Não definido</option>
          {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
        </SelectField>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Início" type="time" value={f.startTime} onChange={set('startTime')} />
          <TextField label="Fim" type="time" value={f.endTime} onChange={set('endTime')} />
        </div>
        <TextField label="Máximo de alunos (opcional)" type="number" min={1} value={f.maxStudents} onChange={set('maxStudents')} error={errors.maxStudents} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={busy}>{editing ? 'Salvar alterações' : 'Criar turma'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function ManageModal({ classId, onClose, onChanged }: { classId: string | null; onClose: () => void; onChanged: () => void }) {
  const open = classId !== null;
  const detail = useFetch<ClassDetail>(open ? `/classes/${classId}` : null);
  const teachers = useFetch<UserLite[]>(open ? '/users?filterRole=PROFESSOR&includeAdmins=true' : null);
  const alunos = useFetch<UserLite[]>(open ? '/users?filterRole=ALUNO' : null);
  const attendance = useFetch<AttendanceRow[]>(open ? `/attendance/class/${classId}` : null);
  const { notify, confirm } = useFeedback();
  const [teacherId, setTeacherId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) { setTeacherId(''); setStudentId(''); } }, [open, classId]);

  const d = detail.data;
  const freeTeachers = (teachers.data ?? []).filter((t) => !d?.teachers?.some((x) => x.id === t.id));
  const freeStudents = (alunos.data ?? []).filter((s) => !d?.students?.some((x) => x.id === s.id));

  const byDate = useMemo(() => {
    const m = new Map<string, AttendanceRow[]>();
    for (const a of attendance.data ?? []) {
      if (a.present === false) continue;
      const key = new Date(a.date).toISOString().slice(0, 10);
      m.set(key, [...(m.get(key) ?? []), a]);
    }
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 15);
  }, [attendance.data]);

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    try {
      await fn();
      notify(ok);
      detail.reload();
      onChanged();
    } catch (e) {
      notify(errMsg(e), 'error');
    } finally {
      setBusy(false);
    }
  }

  async function removeStudent(id: string, name: string) {
    if (!(await confirm({ title: `Remover ${name} da turma?`, message: 'A matrícula será cancelada. O histórico de presenças fica guardado.', confirmLabel: 'Remover', danger: true }))) return;
    run(() => api(`/classes/${classId}/enroll/${id}`, { method: 'DELETE' }), 'Matrícula removida.');
  }
  async function removeTeacher(id: string, name: string) {
    if (!(await confirm({ title: `Desvincular ${name}?`, message: 'O professor deixa de ser responsável por esta turma.', confirmLabel: 'Desvincular', danger: true }))) return;
    run(() => api(`/classes/${classId}/teachers/${id}`, { method: 'DELETE' }), 'Professor desvinculado.');
  }

  return (
    <Modal open={open} onClose={onClose} wide title={d ? `Turma ${d.name}` : 'Turma'} footer={<Button variant="ghost" onClick={onClose}>Fechar</Button>}>
      {detail.error && !d ? <ErrorState message={detail.error} onRetry={detail.reload} /> : !d ? <Loading /> : (
        <div className="space-y-6">
          <section>
            <h3 className="mb-2 text-sm font-semibold">Professores</h3>
            {d.teachers?.length ? (
              <ul className="mb-3 flex flex-wrap gap-2">
                {d.teachers.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 rounded-full border border-line bg-panel py-1 pl-3 pr-1 text-sm">
                    {t.name}
                    <button type="button" aria-label={`Desvincular ${t.name}`} onClick={() => removeTeacher(t.id, t.name)} className="rounded-full px-2 py-0.5 text-dim hover:bg-danger/20 hover:text-danger">×</button>
                  </li>
                ))}
              </ul>
            ) : <p className="mb-3 text-sm text-dim">Nenhum professor vinculado.</p>}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <SelectField label="Vincular professor" value={teacherId} onChange={(e) => setTeacherId(e.target.value)} hint="O dono da academia também aparece aqui, caso dê aula.">
                  <option value="">Selecione…</option>
                  {freeTeachers.map((t) => <option key={t.id} value={t.id}>{t.name}{t.role === 'ADMIN' ? ' (dono)' : ''}</option>)}
                </SelectField>
              </div>
              <Button disabled={!teacherId} loading={busy} onClick={() => run(() => api(`/classes/${classId}/teachers`, { method: 'POST', body: { teacherId } }), 'Professor vinculado.').then(() => setTeacherId(''))}>Vincular</Button>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold">Alunos matriculados ({d.students?.length ?? 0})</h3>
            {d.students?.length ? (
              <ul className="mb-3 divide-y divide-line rounded-xl border border-line">
                {d.students.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <span className="flex items-center gap-3">{s.name} {s.isBlocked && <Badge tone="danger">Bloqueado</Badge>}</span>
                    <span className="flex items-center gap-3">
                      <BeltBadge color={s.beltColor} degree={s.beltDegree} />
                      <Button small variant="ghost" onClick={() => removeStudent(s.id, s.name)}>Remover</Button>
                    </span>
                  </li>
                ))}
              </ul>
            ) : <p className="mb-3 text-sm text-dim">Nenhum aluno matriculado.</p>}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <SelectField label="Matricular aluno" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                  <option value="">Selecione…</option>
                  {freeStudents.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </SelectField>
              </div>
              <Button disabled={!studentId} loading={busy} onClick={() => run(() => api(`/classes/${classId}/enroll`, { method: 'POST', body: { studentId } }), 'Aluno matriculado.').then(() => setStudentId(''))}>Matricular</Button>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold">Presenças recentes</h3>
            {attendance.error ? <ErrorState message={attendance.error} onRetry={attendance.reload} /> : !attendance.data ? <Loading /> : byDate.length ? (
              <ul className="space-y-2">
                {byDate.map(([day, list]) => (
                  <li key={day} className="rounded-xl border border-line px-3 py-2 text-sm">
                    <p className="font-medium">{dateBR(day + 'T12:00:00')} <span className="text-dim">· {list.length} {list.length === 1 ? 'presença' : 'presenças'}</span></p>
                    <p className="mt-1 text-dim">{list.map((a) => a.student?.name).filter(Boolean).join(', ')}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-dim">Nenhuma presença registrada nesta turma.</p>}
          </section>
        </div>
      )}
    </Modal>
  );
}
