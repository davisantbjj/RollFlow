import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, TextInputProps, ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../theme/colors';

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
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
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

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={Colors.gold} />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.stateCard}>
      <Text style={styles.stateTitle}>Não foi possível carregar</Text>
      <Text style={styles.stateText}>{message}</Text>
      {onRetry && (
        <Button label="Tentar de novo" onPress={onRetry} variant="ghost" style={{ marginTop: 16, alignSelf: 'center' }} />
      )}
    </View>
  );
}

export function Empty({ title, hint, icon }: { title: string; hint?: string; icon?: string }) {
  return (
    <View style={styles.stateCard}>
      {icon ? <Text style={{ fontSize: 40, marginBottom: 12 }}>{icon}</Text> : null}
      <Text style={styles.stateTitle}>{title}</Text>
      {hint ? <Text style={styles.stateText}>{hint}</Text> : null}
    </View>
  );
}

type Variant = 'gold' | 'ghost' | 'danger' | 'blue' | 'green';
export function Button({ label, onPress, variant = 'gold', loading, disabled, style }: {
  label: string; onPress: () => void; variant?: Variant; loading?: boolean; disabled?: boolean; style?: ViewStyle;
}) {
  const v = BTN[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.btn, v.box, (disabled || loading) && { opacity: 0.55 }, style]}
    >
      {loading ? <ActivityIndicator size="small" color={v.text} /> : <Text style={[styles.btnText, { color: v.text }]}>{label}</Text>}
    </TouchableOpacity>
  );
}

const BTN: Record<Variant, { box: ViewStyle; text: string }> = {
  gold: { box: { backgroundColor: Colors.gold }, text: Colors.black },
  blue: { box: { backgroundColor: Colors.blue }, text: '#fff' },
  green: { box: { backgroundColor: Colors.green }, text: Colors.black },
  ghost: { box: { backgroundColor: Colors.card2, borderWidth: 1, borderColor: Colors.border }, text: Colors.text },
  danger: { box: { backgroundColor: 'rgba(232,75,75,0.12)', borderWidth: 1, borderColor: 'rgba(232,75,75,0.35)' }, text: Colors.red },
};

export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={Colors.muted}
        accessibilityLabel={label}
        {...props}
        style={[styles.input, error ? { borderColor: Colors.red } : null, props.style]}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function Chip({ label, active, onPress, color }: {
  label: string; active?: boolean; onPress?: () => void; color?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={[styles.chip, active && { borderColor: color || Colors.gold, backgroundColor: 'rgba(232,184,75,0.12)' }]}
    >
      <Text style={[styles.chipText, active && { color: color || Colors.gold }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export const cardStyle: ViewStyle = {
  backgroundColor: Colors.card,
  borderColor: Colors.border,
  borderWidth: 1,
  borderRadius: 20,
  padding: 18,
  marginBottom: 12,
};

const styles = StyleSheet.create({
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { marginBottom: 12, alignSelf: 'flex-start', paddingVertical: 4 },
  backText: { color: Colors.gold, fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 30, color: Colors.text, fontWeight: 'bold' },
  subtitle: { fontSize: 14, color: Colors.muted, marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  stateCard: {
    backgroundColor: Colors.card, borderColor: Colors.border, borderWidth: 1, borderRadius: 20,
    padding: 30, alignItems: 'center', marginHorizontal: 20, marginTop: 8, marginBottom: 12,
  },
  stateTitle: { color: Colors.text, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  stateText: { color: Colors.muted, fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  btn: { paddingVertical: 13, paddingHorizontal: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  btnText: { fontWeight: 'bold', fontSize: 14 },
  label: { color: Colors.text, fontWeight: 'bold', fontSize: 13, marginBottom: 6 },
  input: {
    backgroundColor: Colors.card2, borderColor: Colors.border, borderWidth: 1, borderRadius: 12,
    padding: 14, color: Colors.text, fontSize: 15,
  },
  fieldError: { color: Colors.red, fontSize: 12, marginTop: 4 },
  chip: {
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card2,
    borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8, minHeight: 36, justifyContent: 'center',
  },
  chipText: { color: Colors.muted, fontWeight: '600', fontSize: 13 },
  badge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
});
