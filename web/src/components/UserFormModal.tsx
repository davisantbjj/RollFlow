'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';
import { errMsg } from '@/lib/useFetch';
import { useFeedback } from './feedback';
import { Button, Modal, TextField } from './ui';

/** Cria um usuário (ALUNO ou PROFESSOR) na academia atual. */
export function UserFormModal({ open, role, onClose, onCreated }: { open: boolean; role: 'ALUNO' | 'PROFESSOR'; onClose: () => void; onCreated: () => void }) {
  const { notify } = useFeedback();
  const empty = { name: '', email: '', password: '', phone: '' };
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const label = role === 'ALUNO' ? 'aluno' : 'professor';

  useEffect(() => { if (open) { setF(empty); setErrors({}); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (f.name.trim().length < 2) err.name = 'Informe o nome (mínimo 2 letras).';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) err.email = 'Informe um e-mail válido.';
    if (f.password.length < 6) err.password = 'A senha precisa ter pelo menos 6 caracteres.';
    setErrors(err);
    if (Object.keys(err).length) return;
    setBusy(true);
    try {
      await api('/users', { method: 'POST', body: { name: f.name.trim(), email: f.email.trim(), password: f.password, role, ...(f.phone && { phone: f.phone.trim() }) } });
      notify(`Cadastro de ${label} criado.`);
      onCreated();
      onClose();
    } catch (e2) {
      const status = (e2 as { status?: number }).status;
      if (status === 409) setErrors({ email: 'Este e-mail já está cadastrado.' });
      else notify(errMsg(e2), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Novo ${label}`}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <TextField label="Nome" value={f.name} onChange={set('name')} error={errors.name} />
        <TextField label="E-mail" type="email" value={f.email} onChange={set('email')} error={errors.email} />
        <TextField label="Senha inicial" type="password" autoComplete="new-password" value={f.password} onChange={set('password')} error={errors.password} hint="Mínimo de 6 caracteres." />
        <TextField label="Telefone (opcional)" value={f.phone} onChange={set('phone')} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={busy}>Criar {label}</Button>
        </div>
      </form>
    </Modal>
  );
}
