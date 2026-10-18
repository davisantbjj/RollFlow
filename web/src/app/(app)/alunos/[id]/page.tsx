'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { errMsg, useFetch } from '@/lib/useFetch';
import { BELTS, INTERVAL_LABEL, beltName, dateBR, money } from '@/lib/format';
import type { Evaluation, Plan, Progression, UserDetail } from '@/lib/types';
import { useFeedback } from '@/components/feedback';
import { Async, Badge, BeltBadge, Button, Card, Empty, ErrorState, Loading, Modal, PageHeader, ProgressBar, SelectField, TextArea } from '@/components/ui';

export default function AlunoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const student = useFetch<UserDetail>(`/users/${id}`);
  const progression = useFetch<Progression>(`/progression/student/${id}`);
  const evaluations = useFetch<Evaluation[]>(`/evaluation/student/${id}`);
  const { notify, confirm } = useFeedback();
  const [modal, setModal] = useState<'eval' | 'promote' | 'plan' | null>(null);
  const [busy, setBusy] = useState(false);

  function reloadAll() {
    student.reload();
    progression.reload();
    evaluations.reload();
  }

  async function toggleBlock(u: UserDetail) {
    const block = !u.isBlocked;
    const ok = await confirm({
      title: block ? `Bloquear ${u.name}?` : `Desbloquear ${u.name}?`,
      message: block ? 'O aluno só acessa o Financeiro no app até regularizar.' : 'O aluno volta a usar o app normalmente.',
      confirmLabel: block ? 'Bloquear' : 'Desbloquear',
      danger: block,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await api(`/users/${u.id}/block`, { method: 'PATCH', body: { isBlocked: block } });
      notify(block ? 'Aluno bloqueado.' : 'Aluno desbloqueado.');
      student.reload();
    } catch (e) {
      notify(errMsg(e), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Async state={student}>
      {(u) => (
        <>
          <p className="mb-2 text-sm"><Link href="/alunos" className="text-dim hover:text-gold">Voltar para Alunos</Link></p>
          <PageHeader
            title={u.name}
            subtitle={u.email}
            actions={
              <>
                <Button variant="outline" onClick={() => setModal('eval')}>Avaliar</Button>
                <Button onClick={() => setModal('promote')}>Promover</Button>
                <Button variant={u.isBlocked ? 'outline' : 'danger'} loading={busy} onClick={() => toggleBlock(u)}>
                  {u.isBlocked ? 'Desbloquear' : 'Bloquear'}
                </Button>
              </>
            }
          />

          <div className="grid gap-4 lg:grid-cols-3">
            <Card title="Dados">
              <dl className="space-y-3 text-sm">
                <Row k="Situação" v={u.isBlocked ? <Badge tone="danger">Bloqueado</Badge> : <Badge tone="ok">Ativo</Badge>} />
                <Row k="Faixa" v={<BeltBadge color={u.beltColor} degree={u.beltDegree} />} />
                <Row k="Telefone" v={u.phone || '—'} />
                <Row k="Academia" v={u.academy?.name ?? '—'} />
                <Row k="Aluno desde" v={dateBR(u.createdAt)} />
              </dl>
              {!!u.dependents?.length && (
                <p className="mt-4 text-xs text-dim">Responsável por: {u.dependents.map((d) => d.name).join(', ')}</p>
              )}
            </Card>

            <Card title="Plano" actions={<Button small variant="ghost" onClick={() => setModal('plan')}>{u.subscription ? 'Trocar plano' : 'Atribuir plano'}</Button>}>
              {u.subscription ? (
                <dl className="space-y-3 text-sm">
                  <Row k="Plano" v={u.subscription.plan.name} />
                  <Row k="Valor" v={`${money(u.subscription.plan.price)} · ${INTERVAL_LABEL[u.subscription.plan.interval] ?? ''}`} />
                  <Row k="Status" v={<Badge tone={u.subscription.status === 'ACTIVE' ? 'ok' : 'danger'}>{u.subscription.status === 'ACTIVE' ? 'Em dia' : 'Atrasado'}</Badge>} />
                  <Row k="Próximo vencimento" v={dateBR(u.subscription.dueDate)} />
                </dl>
              ) : (
                <p className="text-sm text-dim">Este aluno ainda não tem plano. Atribua um para gerar a primeira cobrança.</p>
              )}
            </Card>

            <Card title="Evolução">
              {progression.data ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <BeltBadge color={progression.data.currentBelt} degree={progression.data.currentDegree} />
                    {progression.data.isReady && <Badge tone="gold">Pronto para promover</Badge>}
                  </div>
                  <ProgressBar label="Geral" value={progression.data.progress.total} />
                  <ProgressBar label={`Presenças (${progression.data.stats.attendances}/${progression.data.rule.minAttendanceCount})`} value={progression.data.progress.attendance} />
                  <ProgressBar label={`Tempo (${progression.data.stats.elapsedMonths}/${progression.data.rule.minMonths} meses)`} value={progression.data.progress.time} />
                  {progression.data.rule.requiresEvaluation && (
                    <ProgressBar label={`Avaliação (${progression.data.stats.avgScore}/${progression.data.rule.minEvaluationScore})`} value={progression.data.progress.evaluation} />
                  )}
                </div>
              ) : progression.error ? (
                <ErrorState message={progression.error} onRetry={progression.reload} />
              ) : <Loading />}
            </Card>
          </div>

          <div className="mt-4">
            <Card title="Avaliações">
              {evaluations.data ? (
                evaluations.data.length ? (
                  <ul className="divide-y divide-line">
                    {evaluations.data.map((ev) => (
                      <li key={ev.id} className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm">
                        <div>
                          <p className="font-medium">{dateBR(ev.createdAt)} <span className="text-dim">· {ev.evaluator?.name ?? 'Professor'}</span></p>
                          {ev.notes && <p className="mt-1 text-dim">{ev.notes}</p>}
                        </div>
                        <div className="flex gap-2 text-xs">
                          <Badge tone="info">Técnica {ev.technique}</Badge>
                          <Badge tone="info">Disciplina {ev.discipline}</Badge>
                          <Badge tone="info">Evolução {ev.evolution}</Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : <Empty title="Nenhuma avaliação ainda" hint="Use o botão Avaliar para registrar a primeira." />
              ) : evaluations.error ? <ErrorState message={evaluations.error} onRetry={evaluations.reload} /> : <Loading />}
            </Card>
          </div>

          <EvalModal open={modal === 'eval'} studentId={u.id} onClose={() => setModal(null)} onDone={reloadAll} />
          <PromoteModal open={modal === 'promote'} student={u} onClose={() => setModal(null)} onDone={reloadAll} />
          <PlanModal open={modal === 'plan'} studentId={u.id} onClose={() => setModal(null)} onDone={reloadAll} />
        </>
      )}
    </Async>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-dim">{k}</dt>
      <dd className="text-right">{v}</dd>
    </div>
  );
}

function EvalModal({ open, studentId, onClose, onDone }: { open: boolean; studentId: string; onClose: () => void; onDone: () => void }) {
  const { notify } = useFeedback();
  const [v, setV] = useState({ technique: '3', discipline: '3', evolution: '3', notes: '' });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) setV({ technique: '3', discipline: '3', evolution: '3', notes: '' }); }, [open]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/evaluation', { method: 'POST', body: { studentId, technique: +v.technique, discipline: +v.discipline, evolution: +v.evolution, ...(v.notes.trim() && { notes: v.notes.trim() }) } });
      notify('Avaliação registrada.');
      onDone();
      onClose();
    } catch (e2) {
      notify(errMsg(e2), 'error');
    } finally {
      setBusy(false);
    }
  }
  const opts = [1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>);
  return (
    <Modal open={open} onClose={onClose} title="Avaliar aluno">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <SelectField label="Técnica" value={v.technique} onChange={(e) => setV({ ...v, technique: e.target.value })}>{opts}</SelectField>
          <SelectField label="Disciplina" value={v.discipline} onChange={(e) => setV({ ...v, discipline: e.target.value })}>{opts}</SelectField>
          <SelectField label="Evolução" value={v.evolution} onChange={(e) => setV({ ...v, evolution: e.target.value })}>{opts}</SelectField>
        </div>
        <TextArea label="Observações (opcional)" value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={busy}>Salvar avaliação</Button>
        </div>
      </form>
    </Modal>
  );
}

function PromoteModal({ open, student, onClose, onDone }: { open: boolean; student: UserDetail; onClose: () => void; onDone: () => void }) {
  const { notify, confirm } = useFeedback();
  const [belt, setBelt] = useState('BRANCA');
  const [degree, setDegree] = useState('0');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) { setBelt(student.beltColor ?? 'BRANCA'); setDegree(String((student.beltDegree ?? 0) + 1 > 4 ? 0 : (student.beltDegree ?? 0) + 1)); }
  }, [open, student]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const ok = await confirm({ title: 'Confirmar promoção', message: `${student.name} passa para faixa ${beltName(belt)}, ${degree}º grau.`, confirmLabel: 'Promover' });
    if (!ok) return;
    setBusy(true);
    try {
      await api('/progression/promote', { method: 'POST', body: { studentId: student.id, toBelt: belt, toDegree: +degree } });
      notify('Aluno promovido.');
      onDone();
      onClose();
    } catch (e2) {
      notify(errMsg(e2), 'error');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal open={open} onClose={onClose} title="Promover aluno">
      <form onSubmit={submit} className="space-y-4">
        <SelectField label="Faixa" value={belt} onChange={(e) => setBelt(e.target.value)}>
          {BELTS.map((b) => <option key={b} value={b}>{beltName(b)}</option>)}
        </SelectField>
        <SelectField label="Grau" value={degree} onChange={(e) => setDegree(e.target.value)}>
          {[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}º grau</option>)}
        </SelectField>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={busy}>Promover</Button>
        </div>
      </form>
    </Modal>
  );
}

function PlanModal({ open, studentId, onClose, onDone }: { open: boolean; studentId: string; onClose: () => void; onDone: () => void }) {
  const { notify } = useFeedback();
  const plans = useFetch<Plan[]>(open ? '/plans' : null);
  const [planId, setPlanId] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) setPlanId(''); }, [open]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!planId) return notify('Escolha um plano.', 'error');
    setBusy(true);
    try {
      await api('/payments/subscribe', { method: 'POST', body: { planId, userId: studentId } });
      notify('Plano atribuído. A primeira cobrança foi criada.');
      onDone();
      onClose();
    } catch (e2) {
      notify(errMsg(e2), 'error');
    } finally {
      setBusy(false);
    }
  }
  const active = (plans.data ?? []).filter((p) => p.isActive !== false);
  return (
    <Modal open={open} onClose={onClose} title="Atribuir plano">
      {plans.error ? <ErrorState message={plans.error} onRetry={plans.reload} /> : !plans.data ? <Loading /> : !active.length ? (
        <Empty title="Nenhum plano cadastrado" hint="Crie planos na tela Financeiro." />
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <SelectField label="Plano" value={planId} onChange={(e) => setPlanId(e.target.value)}>
            <option value="">Selecione…</option>
            {active.map((p) => <option key={p.id} value={p.id}>{p.name} — {money(p.price)} ({INTERVAL_LABEL[p.interval]})</option>)}
          </SelectField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={busy}>Atribuir plano</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
