import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../theme/colors';
import { Plus, X, Search, Lock, Users } from 'lucide-react-native';
import { Fonts } from '../../theme/typography';
import { Text, ListRow, BeltStrip, Screen, Header, Loading, ErrorState, Empty, Button, Field, Badge, Chip, cardStyle } from '../components/ui';
import { useAuthStore, isManagement } from '../../store/authStore';
import { api } from '../services/api';
import { notify, apiError } from '../utils/notify';
import { beltName, roleLabel } from '../utils/format';

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
type NewRole = 'ALUNO' | 'PROFESSOR' | 'RESPONSAVEL' | 'ADMIN';

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
  const [newRole, setNewRole] = useState<NewRole>('ALUNO');
  const roleOptions: NewRole[] = user?.role === 'ADMIN' ? ['ALUNO', 'PROFESSOR', 'RESPONSAVEL', 'ADMIN'] : ['ALUNO', 'PROFESSOR', 'RESPONSAVEL'];
  const who = roleLabel(newRole).toLowerCase();
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
        role: newRole,
        phone: form.phone.trim() || undefined,
      });
      notify.success(`${roleLabel(newRole)} cadastrado.`);
      setNewRole('ALUNO');
      setForm(EMPTY);
      setShowCreate(false);
      load(search);
    } catch (err) {
      notify.error(apiError(err, `Não foi possível cadastrar (${who}).`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Header
        title="Alunos"
        right={manager ? <Button label={showCreate ? 'Fechar' : 'Novo'} icon={showCreate ? X : Plus} onPress={() => setShowCreate(!showCreate)} variant={showCreate ? 'ghost' : 'gold'} /> : undefined}
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
            <Text style={styles.formTitle}>Novo cadastro</Text>
            <Text style={styles.roleLabel}>Tipo de usuário</Text>
            <View style={styles.roleRow}>
              {roleOptions.map((r) => (
                <Chip key={r} label={r === 'ADMIN' ? 'Dono/sócio' : roleLabel(r)} active={newRole === r} onPress={() => setNewRole(r)} />
              ))}
            </View>
            <Field label="Nome completo" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} error={errors.name} />
            <Field label="E-mail" value={form.email} onChangeText={(t) => setForm({ ...form, email: t })} error={errors.email} autoCapitalize="none" keyboardType="email-address" />
            <Field label="Senha inicial" value={form.password} onChangeText={(t) => setForm({ ...form, password: t })} error={errors.password} secureTextEntry placeholder="Mínimo 6 caracteres" />
            <Field label="Telefone (opcional)" value={form.phone} onChangeText={(t) => setForm({ ...form, phone: t })} keyboardType="phone-pad" />
            <Button label={`Cadastrar ${who}`} onPress={create} loading={saving} />
          </View>
        )}

        <View style={styles.searchWrap}>
        <Search size={20} color={Colors.muted} strokeWidth={2} />
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
        </View>

        {loading ? (
          <View style={{ paddingTop: 40 }}><Loading /></View>
        ) : error ? (
          <ErrorState message={error} onRetry={() => load(search)} />
        ) : students.length === 0 ? (
          <Empty
            icon={Users}
            title={search ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
            hint={search ? 'Tente outro nome ou e-mail.' : manager ? 'Use "Novo" para cadastrar o primeiro.' : undefined}
          />
        ) : (
          students.map((s) => (
            <ListRow
              key={s.id}
              title={s.name}
              subtitle={`Faixa ${beltName(s.beltColor)} · ${s.beltDegree || 0}º grau`}
              accent={s.isBlocked ? 'rgba(232,75,75,0.4)' : undefined}
              accessibilityLabel={`Abrir ${s.name}`}
              right={s.isBlocked ? <Badge label="Bloqueado" color={Colors.red} icon={Lock} /> : <BeltStrip belt={s.beltColor} degree={s.beltDegree || 0} width={32} />}
              onPress={() => router.push({ pathname: '/student/[id]' as any, params: { id: s.id } })}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  formTitle: { color: Colors.gold, fontFamily: Fonts.display, fontSize: 24, letterSpacing: 1, marginBottom: 16 },
  roleLabel: { color: Colors.muted, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.card, borderColor: Colors.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, minHeight: 48 },
  search: { flex: 1, color: Colors.text, fontSize: 16, fontFamily: Fonts.regular, paddingVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.card2,
    borderWidth: 1, borderColor: Colors.gold, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: Colors.gold, fontWeight: 'bold' },
  name: { color: Colors.text, fontWeight: 'bold', fontSize: 16 },
  meta: { color: Colors.muted, fontSize: 13, marginTop: 3 },
});
