const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const money = (v: number | null | undefined) => brl.format(v ?? 0);
export const num = (v: number | null | undefined) => (v ?? 0).toLocaleString('pt-BR');

export function dateBR(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
}

export function monthLabel(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  return d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
}

export const ROLE_LABEL: Record<string, string> = {
  MASTER: 'Administrador RollFlow',
  ADMIN: 'Dono da academia',
  PROFESSOR: 'Professor',
  ALUNO: 'Aluno',
  RESPONSAVEL: 'Responsável',
};

export const INTERVAL_LABEL: Record<string, string> = {
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  YEARLY: 'Anual',
};

export const BELTS = ['BRANCA', 'CINZA', 'AMARELA', 'LARANJA', 'VERDE', 'AZUL', 'ROXA', 'MARROM', 'PRETA', 'CORAL', 'VERMELHA'] as const;

export const BELT_COLOR: Record<string, string> = {
  BRANCA: '#f3f4f6', CINZA: '#9ca3af', AMARELA: '#facc15', LARANJA: '#fb923c', VERDE: '#22c55e',
  AZUL: '#3b82f6', ROXA: '#8b5cf6', MARROM: '#92400e', PRETA: '#0a0a0a', CORAL: '#f87171', VERMELHA: '#dc2626',
};

export const beltName = (b?: string | null) => (b ? b.charAt(0) + b.slice(1).toLowerCase() : '—');

export const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
