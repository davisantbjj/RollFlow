import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text as RNText, TextProps, StyleSheet, Pressable, Animated, ActivityIndicator, TextInput, TextInputProps,
  ViewStyle, StyleProp, AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, TriangleAlert, Inbox } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Fonts, Type } from '../../theme/typography';
import { beltColor } from '../../theme/belts';

export type { LucideIcon };

// ---------------------------------------------------------------- Texto
// Mapeia fontWeight para a família Syne correspondente (fontes customizadas não usam fontWeight).
const WEIGHT_FAMILY: Record<string, string> = {
  bold: Fonts.bold, '700': Fonts.bold, '800': Fonts.bold, '900': Fonts.bold,
  '600': Fonts.semibold, '500': Fonts.medium,
};
export function Text({ style, ...props }: TextProps) {
  const flat: any = StyleSheet.flatten(style) || {};
  const { fontWeight, ...rest } = flat;
  const fontFamily = rest.fontFamily || WEIGHT_FAMILY[String(fontWeight)] || Fonts.regular;
  return <RNText {...props} style={[rest, { fontFamily }]} />;
}

export function Mono({ style, bold, ...props }: TextProps & { bold?: boolean }) {
  return <Text {...props} style={[{ fontFamily: bold ? Fonts.monoBold : Fonts.mono }, style]} />;
}

// ---------------------------------------------------------------- Movimento
function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => {});
  }, []);
  return reduce;
}

/** Pressable com leve escala (0.98) e fundo opcional de press. */
export function PressableScale({ children, style, pressedStyle, disabled, ...props }: {
  children: React.ReactNode; style?: StyleProp<ViewStyle>; pressedStyle?: StyleProp<ViewStyle>;
  disabled?: boolean; onPress?: () => void; accessibilityLabel?: string; accessibilityRole?: 'button' | 'link';
  accessibilityState?: any; hitSlop?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const reduce = useReduceMotion();
  const to = (v: number) => {
    if (!reduce) Animated.timing(scale, { toValue: v, duration: 120, useNativeDriver: true }).start();
  };
  return (
    <Pressable
      disabled={disabled}
      accessibilityRole="button"
      onPressIn={() => to(0.98)}
      onPressOut={() => to(1)}
      {...props}
    >
      {({ pressed }) => (
        <Animated.View style={[style, pressed && pressedStyle, { transform: [{ scale }] }]}>{children}</Animated.View>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------- Estrutura
export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: Colors.black }}>
      {children}
    </SafeAreaView>
  );
}

export function Header({ title, subtitle, back, right }: {
  title: string; subtitle?: string; back?: boolean; right?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <View style={styles.header}>
      {back && (
        <PressableScale
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={styles.backBtn}
          accessibilityLabel="Voltar"
        >
          <ChevronLeft size={20} color={Colors.gold} strokeWidth={2} />
          <Text style={styles.backText}>Voltar</Text>
        </PressableScale>
      )}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} accessibilityRole="header">{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </View>
  );
}

export function Card({ children, onPress, style, accent, accessibilityLabel }: {
  children: React.ReactNode; onPress?: () => void; style?: StyleProp<ViewStyle>; accent?: string; accessibilityLabel?: string;
}) {
  const box = [cardStyle, accent ? { borderColor: accent } : null, style];
  if (!onPress) return <View style={box}>{children}</View>;
  return (
    <PressableScale onPress={onPress} style={box} pressedStyle={{ backgroundColor: Colors.card2 }} accessibilityLabel={accessibilityLabel}>
      {children}
    </PressableScale>
  );
}

export function StatCard({ value, label, icon: Icon, color, small }: {
  value: string; label: string; icon?: LucideIcon; color?: string; small?: boolean;
}) {
  const tone = color || Colors.gold;
  return (
    <View style={styles.statCard} accessible accessibilityLabel={`${label}: ${value}`}>
      {Icon ? <Icon size={16} color={tone} strokeWidth={2} /> : null}
      <Text style={[styles.statNum, { color: tone }, small && { fontSize: 28 }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  );
}

/** Linha de lista: avatar com iniciais, título, subtítulo e chevron. */
export function ListRow({ title, subtitle, onPress, right, avatar, accent, accessibilityLabel, chevron = true }: {
  title: string; subtitle?: string; onPress?: () => void; right?: React.ReactNode; avatar?: string | React.ReactNode;
  accent?: string; accessibilityLabel?: string; chevron?: boolean;
}) {
  const initials = typeof avatar === 'string' ? avatar : title.substring(0, 2).toUpperCase();
  return (
    <Card onPress={onPress} accent={accent} style={styles.listRow} accessibilityLabel={accessibilityLabel || title}>
      {avatar && typeof avatar !== 'string' ? avatar : <Avatar initials={initials} />}
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.rowSub} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {right}
      {onPress && chevron ? <ChevronRight size={20} color={Colors.muted} strokeWidth={2} /> : null}
    </Card>
  );
}

export function Avatar({ initials, size = 44 }: { initials: string; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

/** Faixa colorida com graus (mesmo desenho do BeltCard). */
export function BeltStrip({ belt, degree = 0, width = 48 }: { belt?: string | null; degree?: number; width?: number }) {
  const color = beltColor(belt);
  const isBlack = belt === 'PRETA';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ width, height: 12, borderRadius: 4, backgroundColor: color, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: width / 4, backgroundColor: isBlack ? '#DC2626' : '#000' }} />
      </View>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={{ width: 6, height: 6, borderRadius: 1, backgroundColor: i <= degree ? Colors.gold : Colors.border }} />
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- Estados
export function Skeleton({ height = 72, style }: { height?: number; style?: StyleProp<ViewStyle> }) {
  const opacity = useRef(new Animated.Value(0.5)).current;
  const reduce = useReduceMotion();
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [opacity, reduce]);
  return <Animated.View style={[{ height, borderRadius: 20, backgroundColor: Colors.card2, opacity, marginBottom: 12 }, style]} />;
}

export function Loading() {
  return (
    <View style={styles.skeletonWrap} accessibilityLabel="Carregando" accessibilityRole="progressbar">
      <Skeleton height={96} />
      <Skeleton height={72} />
      <Skeleton height={72} />
      <Skeleton height={72} />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.stateCard}>
      <TriangleAlert size={36} color={Colors.red} strokeWidth={1.75} />
      <Text style={[styles.stateTitle, { marginTop: 12 }]}>Não foi possível carregar</Text>
      <Text style={styles.stateText}>{message}</Text>
      {onRetry && (
        <Button label="Tentar de novo" onPress={onRetry} variant="ghost" style={{ marginTop: 16, alignSelf: 'center' }} />
      )}
    </View>
  );
}

export function Empty({ title, hint, icon: Icon = Inbox }: { title: string; hint?: string; icon?: LucideIcon }) {
  return (
    <View style={styles.stateCard}>
      <Icon size={40} color={Colors.muted} strokeWidth={1.5} />
      <Text style={[styles.stateTitle, { marginTop: 12 }]}>{title}</Text>
      {hint ? <Text style={styles.stateText}>{hint}</Text> : null}
    </View>
  );
}

// ---------------------------------------------------------------- Ações e formulário
type Variant = 'gold' | 'ghost' | 'danger' | 'blue' | 'green';
export function Button({ label, onPress, variant = 'gold', loading, disabled, style, icon: Icon }: {
  label: string; onPress: () => void; variant?: Variant; loading?: boolean; disabled?: boolean; style?: ViewStyle; icon?: LucideIcon;
}) {
  const v = BTN[variant];
  const off = disabled || loading;
  return (
    <PressableScale
      onPress={onPress}
      disabled={off}
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      style={[styles.btn, v.box, off && { opacity: 0.5 }, style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <View style={styles.btnInner}>
          {Icon ? <Icon size={18} color={v.text} strokeWidth={2} /> : null}
          <Text style={[styles.btnText, { color: v.text }]}>{label}</Text>
        </View>
      )}
    </PressableScale>
  );
}

const BTN: Record<Variant, { box: ViewStyle; text: string }> = {
  gold: { box: { backgroundColor: Colors.gold }, text: Colors.black },
  blue: { box: { backgroundColor: Colors.blue }, text: '#fff' },
  green: { box: { backgroundColor: Colors.green }, text: Colors.black },
  ghost: { box: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.border }, text: Colors.text },
  danger: { box: { backgroundColor: 'rgba(232,75,75,0.12)', borderWidth: 1, borderColor: 'rgba(232,75,75,0.3)' }, text: Colors.red },
};

/** Botão só com ícone (alvo 44x44). */
export function IconButton({ icon: Icon, label, onPress, color = Colors.muted }: {
  icon: LucideIcon; label: string; onPress: () => void; color?: string;
}) {
  return (
    <PressableScale onPress={onPress} accessibilityLabel={label} style={styles.iconBtn}>
      <Icon size={20} color={color} strokeWidth={2} />
    </PressableScale>
  );
}

export function Field({ label, error, onFocus, onBlur, ...props }: TextInputProps & { label: string; error?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={Colors.muted}
        accessibilityLabel={label}
        {...props}
        onFocus={(e) => { setFocused(true); onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); onBlur?.(e); }}
        style={[styles.input, focused && { borderColor: Colors.gold }, error ? { borderColor: Colors.red } : null, props.style]}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function Chip({ label, active, onPress, color }: {
  label: string; active?: boolean; onPress?: () => void; color?: string;
}) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={!onPress}
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
      style={[styles.chip, active && { borderColor: color || Colors.gold, backgroundColor: 'rgba(232,184,75,0.12)' }]}
    >
      <Text style={[styles.chipText, active && { color: color || Colors.gold }]}>{label}</Text>
    </PressableScale>
  );
}

export function Badge({ label, color, icon: Icon }: { label: string; color: string; icon?: LucideIcon }) {
  return (
    <View style={[styles.badge, { borderColor: color + '4D', backgroundColor: color + '1F' }]}>
      {Icon ? <Icon size={12} color={color} strokeWidth={2} /> : null}
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export const cardStyle: ViewStyle = {
  backgroundColor: Colors.card,
  borderColor: Colors.border,
  borderWidth: 1,
  borderRadius: 20,
  padding: 20,
  marginBottom: 12,
};

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { marginBottom: 8, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, marginLeft: -4 },
  backText: { color: Colors.gold, fontSize: 16, fontWeight: 'bold' },
  title: { ...Type.screenTitle, color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.muted, marginTop: 4 },
  skeletonWrap: { paddingHorizontal: 20, paddingTop: 8 },
  stateCard: {
    backgroundColor: Colors.card, borderColor: Colors.border, borderWidth: 1, borderRadius: 20,
    padding: 32, alignItems: 'center', marginHorizontal: 20, marginTop: 8, marginBottom: 12,
  },
  stateTitle: { color: Colors.text, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  stateText: { color: Colors.muted, fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  btn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnText: { fontWeight: 'bold', fontSize: 14 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  label: { color: Colors.text, fontWeight: '600', fontSize: 13, marginBottom: 8 },
  input: {
    backgroundColor: Colors.card, borderColor: Colors.border, borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, minHeight: 48, color: Colors.text, fontSize: 16, fontFamily: Fonts.regular,
  },
  fieldError: { color: Colors.red, fontSize: 12, marginTop: 4 },
  chip: {
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card,
    borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, minHeight: 44, justifyContent: 'center',
  },
  chipText: { color: Colors.muted, fontWeight: '600', fontSize: 13 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  statCard: {
    flex: 1, backgroundColor: Colors.card, borderColor: Colors.border, borderWidth: 1,
    borderRadius: 20, paddingVertical: 16, paddingHorizontal: 12, alignItems: 'center', gap: 4,
  },
  statNum: { ...Type.kpi, lineHeight: 44 },
  statLbl: { ...Type.monoLabel, color: Colors.muted, textAlign: 'center', textTransform: 'uppercase' },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  rowTitle: { color: Colors.text, fontWeight: 'bold', fontSize: 16 },
  rowSub: { color: Colors.muted, fontSize: 12, marginTop: 4 },
  avatar: { backgroundColor: Colors.card2, borderWidth: 1, borderColor: Colors.gold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.gold, fontWeight: 'bold', fontSize: 14 },
});
