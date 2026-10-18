// Famílias carregadas em _layout.tsx (expo-font). Escala: 32 título · 22 seção · 16 corpo · 14 secundário · 12 legenda · 11 rótulo mono
export const Fonts = {
  display: 'BebasNeue_400Regular',
  regular: 'Syne_400Regular',
  medium: 'Syne_500Medium',
  semibold: 'Syne_600SemiBold',
  bold: 'Syne_700Bold',
  mono: 'JetBrainsMono_400Regular',
  monoBold: 'JetBrainsMono_700Bold',
} as const;

export const Type = {
  screenTitle: { fontFamily: Fonts.display, fontSize: 36, letterSpacing: 1 },
  section: { fontFamily: Fonts.display, fontSize: 24, letterSpacing: 1 },
  kpi: { fontFamily: Fonts.display, fontSize: 36, letterSpacing: 1 },
  body: { fontFamily: Fonts.regular, fontSize: 16 },
  secondary: { fontFamily: Fonts.regular, fontSize: 14 },
  caption: { fontFamily: Fonts.regular, fontSize: 12 },
  monoLabel: { fontFamily: Fonts.mono, fontSize: 11, letterSpacing: 0.8 },
} as const;
