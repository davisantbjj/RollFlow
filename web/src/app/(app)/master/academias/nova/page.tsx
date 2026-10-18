'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { errMsg } from '@/lib/useFetch';
import { useFeedback } from '@/components/feedback';
import { Button, Card, PageHeader, TextField } from '@/components/ui';

export default function NovaAcademiaPage() {
  const router = useRouter();
  const { notify } = useFeedback();
  const [f, setF] = useState({ name: '', cnpj: '', phone: '', address: '', ownerName: '', ownerEmail: '', ownerPassword: '', ownerPhone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (f.name.trim().length < 2) err.name = 'Informe o nome da academia (mínimo 2 letras).';
    if (f.ownerName.trim().length < 2) err.ownerName = 'Informe o nome do dono.';
    if (!/^\S+@\S+\.\S+$/.test(f.ownerEmail)) err.ownerEmail = 'Informe um e-mail válido.';
    if (f.ownerPassword.length < 6) err.ownerPassword = 'A senha precisa ter pelo menos 6 caracteres.';
    setErrors(err);
    if (Object.keys(err).length) return;

    setBusy(true);
    try {
      const body = {
        name: f.name.trim(),
        ...(f.cnpj && { cnpj: f.cnpj.trim() }),
        ...(f.phone && { phone: f.phone.trim() }),
        ...(f.address && { address: f.address.trim() }),
        owner: {
          name: f.ownerName.trim(),
          email: f.ownerEmail.trim(),
          password: f.ownerPassword,
          ...(f.ownerPhone && { phone: f.ownerPhone.trim() }),
        },
      };
      const res = await api<{ academy: { id: string } }>('/master/academies', { method: 'POST', body });
      notify('Academia criada.');
      router.push(`/master/academias/${res.academy.id}`);
    } catch (e2) {
      const m = errMsg(e2);
      if (/e-?mail/i.test(m) || (e2 as { status?: number }).status === 409) setErrors({ ownerEmail: 'Este e-mail já está cadastrado.' });
      else notify(m, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Nova academia" subtitle="Cadastre a academia e a conta do dono." />
      <form onSubmit={submit} noValidate className="grid max-w-4xl gap-6 lg:grid-cols-2">
        <Card title="Academia">
          <div className="space-y-4">
            <TextField label="Nome" value={f.name} onChange={set('name')} error={errors.name} />
            <TextField label="CNPJ (opcional)" value={f.cnpj} onChange={set('cnpj')} />
            <TextField label="Telefone (opcional)" value={f.phone} onChange={set('phone')} />
            <TextField label="Endereço (opcional)" value={f.address} onChange={set('address')} />
          </div>
        </Card>
        <Card title="Dono da academia">
          <div className="space-y-4">
            <TextField label="Nome" value={f.ownerName} onChange={set('ownerName')} error={errors.ownerName} />
            <TextField label="E-mail" type="email" value={f.ownerEmail} onChange={set('ownerEmail')} error={errors.ownerEmail} />
            <TextField label="Senha inicial" type="password" autoComplete="new-password" value={f.ownerPassword} onChange={set('ownerPassword')} error={errors.ownerPassword} hint="Mínimo de 6 caracteres. O dono pode trocar depois." />
            <TextField label="Telefone (opcional)" value={f.ownerPhone} onChange={set('ownerPhone')} />
          </div>
        </Card>
        <div className="flex gap-2 lg:col-span-2">
          <Button type="submit" loading={busy}>Criar academia</Button>
          <Link href="/master"><Button type="button" variant="ghost">Cancelar</Button></Link>
        </div>
      </form>
    </>
  );
}
