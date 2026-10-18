'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { NotAllowedError, useAuth } from '@/lib/auth';
import { Button, TextField } from '@/components/ui';
import { Logo } from '@/components/Logo';

export default function LoginPage() {
  const { ready, user, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace(user.role === 'MASTER' ? '/master' : '/painel');
  }, [ready, user, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Informe um e-mail válido.';
    if (!password) next.password = 'Informe a senha.';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setFormError(
        err instanceof NotAllowedError ? err.message : err instanceof Error ? err.message : 'Não foi possível entrar.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-ink p-12 lg:flex">
        <Logo size="lg" />
        <div>
          {/* faixa preta: a identidade do painel */}
          <div className="mb-8 flex h-14 max-w-md overflow-hidden rounded-md border border-white/10 bg-black">
            <div className="flex-1" />
            <div className="flex w-28 items-center justify-center gap-2 bg-danger/90">
              {[0, 1, 2, 3].map((i) => <span key={i} className="h-full w-2 bg-white" />)}
            </div>
            <div className="w-6 bg-black" />
          </div>
          <h1 className="max-w-md font-display text-6xl uppercase leading-none tracking-wide">Sua academia inteira em uma tela.</h1>
          <p className="mt-4 max-w-md text-dim">Alunos, turmas, professores e mensalidades no mesmo lugar, com a mesma base do app.</p>
        </div>
        <p className="text-sm text-dim">Painel do dono da academia</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <form onSubmit={onSubmit} noValidate className="w-full max-w-sm space-y-5">
          <div className="lg:hidden"><Logo size="lg" /></div>
          <div>
            <h2 className="font-display text-4xl uppercase tracking-wide">Entrar no painel</h2>
            <p className="mt-1 text-sm text-dim">Use o e-mail e a senha do app RollFlow.</p>
          </div>
          <TextField label="E-mail" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} placeholder="voce@academia.com" />
          <TextField label="Senha" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
          {formError && (
            <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{formError}</p>
          )}
          <Button type="submit" loading={busy} className="w-full">Entrar</Button>
        </form>
      </section>
    </main>
  );
}
