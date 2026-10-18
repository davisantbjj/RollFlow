// Mapa único de faixas (cor + nome) compartilhado pelos componentes
export const BELT_COLORS: Record<string, string> = {
  BRANCA: '#FFFFFF', CINZA: '#A0A0A0', AMARELA: '#FFD700', LARANJA: '#FF8C00', VERDE: '#1E9E4A',
  AZUL: '#1A5EFF', ROXA: '#7C2DB8', MARROM: '#8B4513', PRETA: '#111111', CORAL: '#EF4444', VERMELHA: '#DC2626',
};
export const BELT_NAMES: Record<string, string> = {
  BRANCA: 'Branca', CINZA: 'Cinza', AMARELA: 'Amarela', LARANJA: 'Laranja', VERDE: 'Verde',
  AZUL: 'Azul', ROXA: 'Roxa', MARROM: 'Marrom', PRETA: 'Preta', CORAL: 'Coral', VERMELHA: 'Vermelha',
};
export const beltColor = (b?: string | null) => BELT_COLORS[b || 'BRANCA'] || '#FFFFFF';
