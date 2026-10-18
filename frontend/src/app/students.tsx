import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../theme/colors';
import { Screen, Header, Loading, ErrorState, Empty, Button, Field, Badge, cardStyle } from '../components/ui';
import { useAuthStore, isManagement } from '../../store/authStore';
import { api } from '../services/api';
import { notify, apiError } from '../utils/notify';
import { beltName } from '../utils/format';

interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  beltColor?: string | null;
  beltDegree?: number | null;
  isBlocked: boolean;
}

const EMPTY = { name: '', email: '', password: '', phone: '' };

export default function Students() {
  const { user } = useAuthStore();
  const router = useRouter();
  const manager = isManagement(user?.role);

  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Partial<typeof EMPTY>>({});
  const [saving, setSaving] = useState(false);
  const searchRef = useRef(search);
  searchRef.current = search;

  const load = useCallback(async (term: string) => {
    setError('');
    try {
      const res = await api.get('/users', { params: { filterRole: 'ALUNO', search: term.trim() || undefined } });
      // ignora resposta antiga se o termo já mudou
      if (term === searchRef.current) setStudents(res.data || []);
    } catch (err) {
      setError(apiError(err, 'Não foi possível carregar os alunos.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // busca com atraso para não chamar a API a cada tecla
  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  const create = async () => {
    const next: Partial<typeof EMPTY> = {};
    if (form.name.trim().length < 2) next.name = 'Informe o nome completo.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Informe um e-mail válido.';
    if (form.password.length < 6) next.password = 'A senha precisa ter pelo menos 6 caracteres.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await api.post('/users', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: 'ALUNO',
        phone: form.phone.trim() || undefined,
      });
      notify.success('Aluno cadastrado.');
      setForm(EMPTY);
      setShowCreate(false);
      load(search);
    } catch (err) {
      notify.error(apiError(err, 'Não foi possível cadastrar o aluno.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Header
        title="Alunos"
        right={manager ? <Button label={showCreate ? 'Fechar' : '+ Novo'} onPress={() => setShowCreate(!showCreate)} variant={showCreate ? 'ghost' : 'gold'} /> : undefined}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(search); }} tintColor={Colors.gold} />
        }
      >
        {showCreate && (
          <View style={[cardStyle, { borderColor: Colors.gold }]}>
            <Text style={styles.formTitle}>Novo aluno</Text>
            <Field label="Nome completo" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} error={errors.name} />
            <Field label="E-mail" value={form.email} onChangeText={(t) => setForm({ ...form, email: t })} error={errors.email} autoCapitalize="none" keyboardType="email-address" />
            <Field label="Senha inicial" value={form.password} onChangeText={(t) => setForm({ ...form, password: t })} error={errors.password} secureTextEntry placeholder="Mínimo 6 caracteres" />
            <Field label="Telefone (opcional)" value={form.phone} onChangeText={(t) => setForm({ ...form, phone: t })} keyboardType="phone-pad" />
            <Button label="Cadastrar aluno" onPress={create} loading={saving} />
          </View>
        )}

        <TextInput
          style={styles.search}
          placeholder="Buscar por nome ou e-mail"
          placeholderTextColor={Colors.muted}
          accessibilityLabel="Buscar aluno"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          returnKeyType="search"
        />

        {loading ? (
          <View style={{ paddingTop: 40 }}><Loading /></View>
        ) : error ? (
          <ErrorState message={error} onRetry={() => load(search)} />
        ) : students.length === 0 ? (
          <Empty
            icon="👥"
            title={search ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
            hint={search ? 'Tente outro nome ou e-mail.' : manager ? 'Use "+ Novo" para cadastrar o primeiro.' : undefined}
          />
        ) : (
          students.map((s) => (
            <TouchableOpacity
              key={s.id}
              activeOpacity={0.75}
              style={[cardStyle, styles.row, s.isBlocked && { borderColor: 'rgba(232,75,75,0.4)' }]}
              accessibilityRole="button"
              accessibilityLabel={`Abrir ${s.name}`}
              onPress={() => router.push({ pathname: '/student/[id]' as any, params: { id: s.id } })}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{s.name.substring(0, 2).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>{s.name}</Text>
                <Text style={styles.meta}>
                  Faixa {beltName(s.beltColor)} · {s.beltDegree || 0}º grau
                </Text>
              </View>
              {s.isBlocked && <Badge label="Bloqueado" color={Colors.red} />}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  formTitle: { color: Colors.gold, fontSize: 18, fontWeight: 'bold', marginBottom: 14 },
  search: {
    backgroundColor: Colors.card, borderColor: Colors.border, borderWidth: 1, borderRadius: 14,
    padding: 14, color: Colors.text, fontSize: 15, marginBottom: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.card2,
    borderWidth: 1, borderColor: Colors.gold, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: Colors.gold, fontWeight: 'bold' },
  name: { color: Colors.text, fontWeight: 'bold', fontSize: 16 },
  meta: { color: Colors.muted, fontSize: 13, marginTop: 3 },
});
