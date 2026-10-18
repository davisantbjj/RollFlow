export const money = (v: number | null | undefined) =>
  (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const dateBR = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR') : '—';

export const INTERVALS: Record<string, string> = {
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  YEARLY: 'Anual',
};

export const BELTS = [
  'BRANCA', 'CINZA', 'AMARELA', 'LARANJA', 'VERDE',
  'AZUL', 'ROXA', 'MARROM', 'PRETA', 'CORAL', 'VERMELHA',
] as const;

export const beltName = (b?: string | null) =>
  b ? b.charAt(0) + b.slice(1).toLowerCase() : 'Branca';

export const timeAgo = (iso: string) => {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `há ${d} d`;
  return new Date(iso).toLocaleDateString('pt-BR');
};
