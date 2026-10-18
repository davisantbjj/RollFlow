import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../../theme/colors';
import BeltCard from '../../components/BeltCard';
import { Screen, Header, Loading, ErrorState, Button, Field, Chip, Badge, cardStyle } from '../../components/ui';
import { useAuthStore, isManagement } from '../../../store/authStore';
import { api } from '../../services/api';
import { notify, confirmAction, apiError } from '../../utils/notify';
import { BELTS, beltName, INTERVALS, money, dateBR } from '../../utils/format';

interface StudentDetail {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  beltColor?: string | null;
  beltDegree?: number | null;
  isBlocked: boolean;
  createdAt?: string;
  academy?: { id: string; name: string };
  subscription?: {
    status: string;
    dueDate: string;
    plan: { name: string; price: number; interval: string };
  } | null;
}

const SCORES = [1, 2, 3, 4, 5];
const DEGREES = [0, 1, 2, 3, 4];

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const manager = isManagement(user?.role);

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [beltKey, setBeltKey] = useState(0); // força o BeltCard a recarregar
  const [blocking, setBlocking] = useState(false);

  // avaliação
  const [showEval, setShowEval] = useState(false);
  const [scores, setScores] = useState({ technique: 3, discipline: 3, evolution: 3 });
  const [notes, setNotes] = useState('');
  const [evaluating, setEvaluating] = useState(false);

  // promoção
  const [showPromote, setShowPromote] = useState(false);
  const [toBelt, setToBelt] = useState('BRANCA');
  const [toDegree, setToDegree] = useState(0);
  const [promoting, setPromoting] = useState(false);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.get(`/users/${id}`);
      setStudent(res.data);
      setToBelt(res.data.beltColor || 'BRANCA');
      setToDegree(res.data.beltDegree || 0);
    } catch (err) {
      setError(apiError(err, 'Não foi possível carregar o aluno.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleBlock = async () => {
    if (!student) return;
    const block = !student.isBlocked;
    const ok = await confirmAction({
      title: block ? 'Bloquear aluno' : 'Desbloquear aluno',
      message: block
        ? `${student.name} não poderá fazer check-in até ser desbloqueado.`
        : `${student.name} voltará a poder fazer check-in.`,
      confirmText: block ? 'Bloquear' : 'Desbloquear',
      destructive: block,
    });
    if (!ok) return;
    setBlocking(true);
    try {
      await api.patch(`/users/${student.id}/block`, { isBlocked: block });
      setStudent({ ...student, isBlocked: block });
      notify.success(block ? 'Aluno bloqueado.' : 'Aluno desbloqueado.');
    } catch (err) {
      notify.error(apiError(err, 'Não foi possível alterar o bloqueio.'));
    } finally {
      setBlocking(false);
    }
  };

  const evaluate = async () => {
    setEvaluating(true);
    try {
      await api.post('/evaluation', { studentId: id, ...scores, notes: notes.trim() || undefined });
      notify.success('Avaliação registrada.');
      setShowEval(false);
      setNotes('');
      setScores({ technique: 3, discipline: 3, evolution: 3 });
      setBeltKey((k) => k + 1);
    } catch (err) {
      notify.error(apiError(err, 'Não foi possível registrar a avaliação.'));
    } finally {
      setEvaluating(false);
    }
  };

  const promote = async () => {
    const ok = await confirmAction({
      title: 'Promover aluno',
      message: `${student?.name} passará para faixa ${beltName(toBelt)}, ${toDegree}º grau.`,
      confirmText: 'Promover',
    });
    if (!ok) return;
    setPromoting(true);
    try {
      await api.post('/progression/promote', { studentId: id, toBelt, toDegree });
      notify.success('Graduação atualizada.');
      setShowPromote(false);
      await load();
      setBeltKey((k) => k + 1);
    } catch (err) {
      notify.error(apiError(err, 'Não foi possível promover o aluno.'));
    } finally {
      setPromoting(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <Header title="Aluno" back />
        <Loading />
      </Screen>
    );
  }

  if (error || !student) {
    return (
      <Screen>
        <Header title="Aluno" back />
        <ErrorState message={error || 'Aluno não encontrado.'} onRetry={load} />
      </Screen>
    );
  }

  const sub = student.subscription;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Header
          title={student.name}
          subtitle={student.isBlocked ? 'Acesso bloqueado' : undefined}
          back
        />

        <BeltCard key={beltKey} studentId={student.id} />

        <View style={styles.body}>
          <View style={styles.actionsRow}>
            <Button label="Ver evolução" variant="ghost" onPress={() => router.push({ pathname: '/progression' as any, params: { studentId: student.id, studentName: student.name } })} />
            <Button label="Avaliar" variant="blue" onPress={() => { setShowEval(!showEval); setShowPromote(false); }} />
            <Button label="Promover" onPress={() => { setShowPromote(!showPromote); setShowEval(false); }} />
          </View>

          {showEval && (
            <View style={[cardStyle, { borderColor: Colors.blue }]}>
              <Text style={styles.formTitle}>Nova avaliação</Text>
              <ScoreRow label="Técnica" value={scores.technique} onChange={(v) => setScores({ ...scores, technique: v })} />
              <ScoreRow label="Disciplina" value={scores.discipline} onChange={(v) => setScores({ ...scores, discipline: v })} />
              <ScoreRow label="Evolução" value={scores.evolution} onChange={(v) => setScores({ ...scores, evolution: v })} />
              <Field label="Observações (opcional)" value={notes} onChangeText={setNotes} multiline style={{ minHeight: 70, textAlignVertical: 'top' }} />
              <Button label="Salvar avaliação" onPress={evaluate} loading={evaluating} />
            </View>
          )}

          {showPromote && (
            <View style={[cardStyle, { borderColor: Colors.gold }]}>
              <Text style={styles.formTitle}>Promover faixa ou grau</Text>
              <Text style={styles.chipLabel}>Faixa</Text>
              <View style={styles.chips}>
                {BELTS.map((b) => (
                  <Chip key={b} label={beltName(b)} active={toBelt === b} onPress={() => setToBelt(b)} />
                ))}
              </View>
              <Text style={[styles.chipLabel, { marginTop: 14 }]}>Grau</Text>
              <View style={styles.chips}>
                {DEGREES.map((d) => (
                  <Chip key={d} label={`${d}º`} active={toDegree === d} onPress={() => setToDegree(d)} />
                ))}
              </View>
              <Button label="Confirmar promoção" onPress={promote} loading={promoting} style={{ marginTop: 18 }} />
            </View>
          )}

          <Text style={styles.section}>Dados</Text>
          <View style={styles.infoCard}>
            <Info label="E-mail" value={student.email} />
            <Info label="Telefone" value={student.phone || 'Não informado'} />
            <Info label="Academia" value={student.academy?.name || '—'} />
            <Info label="Desde" value={dateBR(student.createdAt)} last />
          </View>

          <Text style={styles.section}>Plano</Text>
          {sub ? (
            <View style={cardStyle}>
              <View style={styles.rowBetween}>
                <Text style={styles.planName}>{sub.plan.name}</Text>
                <Badge
                  label={sub.status === 'ACTIVE' ? 'Em dia' : sub.status === 'OVERDUE' ? 'Em atraso' : sub.status}
                  color={sub.status === 'ACTIVE' ? Colors.green : Colors.red}
                />
              </View>
              <Text style={styles.muted}>
                {money(sub.plan.price)} · {(INTERVALS[sub.plan.interval] || sub.plan.interval).toLowerCase()} · vence em {dateBR(sub.dueDate)}
              </Text>
            </View>
          ) : (
            <View style={cardStyle}>
              <Text style={styles.muted}>Este aluno ainda não tem um plano contratado.</Text>
            </View>
          )}

          {manager && (
            <Button
              label={student.isBlocked ? 'Desbloquear aluno' : 'Bloquear aluno'}
              variant={student.isBlocked ? 'green' : 'danger'}
              loading={blocking}
              onPress={toggleBlock}
              style={{ marginTop: 8 }}
            />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function ScoreRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.chipLabel}>{label}</Text>
      <View style={styles.chips}>
        {SCORES.map((n) => (
          <Chip key={n} label={String(n)} active={value === n} onPress={() => onChange(n)} />
        ))}
      </View>
    </View>
  );
}

function Info({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoDivider]}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  formTitle: { color: Colors.gold, fontSize: 18, fontWeight: 'bold', marginBottom: 14 },
  chipLabel: { color: Colors.text, fontWeight: 'bold', fontSize: 13, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  section: { color: Colors.text, fontSize: 20, fontWeight: 'bold', marginTop: 12, marginBottom: 12 },
  infoCard: { backgroundColor: Colors.card, borderColor: Colors.border, borderWidth: 1, borderRadius: 16, marginBottom: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, padding: 16 },
  infoDivider: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoValue: { color: Colors.text, fontWeight: '600', fontSize: 14, flexShrink: 1 },
  muted: { color: Colors.muted, fontSize: 14, lineHeight: 20 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 6 },
  planName: { color: Colors.text, fontSize: 17, fontWeight: 'bold', flex: 1 },
});
