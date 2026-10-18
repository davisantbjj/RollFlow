import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ClipboardCheck, Clock, Star } from 'lucide-react-native';
import { Fonts, Type } from '../../theme/typography';
import { Colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import { api } from '../services/api';
import { useLocalSearchParams } from 'expo-router';
import { Text, Screen, Header, Loading, Empty, ErrorState } from '../components/ui';
import { apiError } from '../utils/notify';
import BeltCard from '../components/BeltCard';

export default function Progression() {
  const { user } = useAuthStore();
  const params = useLocalSearchParams<{ studentId?: string; studentName?: string }>();
  const studentId = (params.studentId as string) || user?.id;
  const isOther = !!params.studentId && params.studentId !== user?.id;
  const [progression, setProgression] = useState<any>(null);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!studentId) return;
    setError('');
    setLoading(true);
    try {
      const [progRes, evalRes] = await Promise.all([
        api.get(`/progression/student/${studentId}`),
        api.get(`/evaluation/student/${studentId}`),
      ]);
      setProgression(progRes.data);
      setEvaluations(evalRes.data || []);
    } catch (err) {
      setError(apiError(err, 'Não foi possível carregar a evolução.'));
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <Screen>
        <Header title="Evolução" back />
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Evolução" subtitle={isOther && params.studentName ? (params.studentName as string) : undefined} back />

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 32 }}>
        {error ? <ErrorState message={error} onRetry={fetchData} /> : null}
        {!error && <BeltCard studentId={studentId} />}

        {progression && progression.stats && progression.rule && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Métricas de progresso</Text>
            <Metric icon={ClipboardCheck} title="Assiduidade" value={`${progression.stats.attendances} / ${progression.rule.minAttendanceCount} aulas`} pct={progression.progress.attendance} />
            <Metric icon={Clock} title="Tempo de faixa" value={`${progression.stats.elapsedMonths} / ${progression.rule.minMonths} meses`} pct={progression.progress.time} />
            <Metric icon={Star} title="Avaliação técnica" value={`${progression.stats.avgScore} / ${progression.rule.minEvaluationScore} (média)`} pct={progression.progress.evaluation} />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Avaliações recentes</Text>
          {evaluations.length === 0 ? (
            <Empty icon={Star} title="Nenhuma avaliação registrada ainda" />
          ) : (
            evaluations.map(ev => {
              const date = new Date(ev.createdAt).toLocaleDateString('pt-BR');
              return (
                <View key={ev.id} style={styles.evalCard}>
                  <View style={styles.evalHeader}>
                    <Text style={styles.evalAuthor}>Por {ev.evaluator?.name || 'Professor'}</Text>
                    <Text style={styles.evalDate}>{date}</Text>
                  </View>
                  <Score label="Técnica" value={ev.technique} />
                  <Score label="Disciplina" value={ev.discipline} />
                  <Score label="Evolução" value={ev.evolution} />
                  {ev.notes ? <Text style={styles.evalNotes}>"{ev.notes}"</Text> : null}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function Metric({ icon: Icon, title, value, pct }: { icon: any; title: string; value: string; pct: number }) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View style={styles.metricTitleRow}>
          <Icon size={16} color={Colors.gold} strokeWidth={2} />
          <Text style={styles.metricTitle}>{title}</Text>
        </View>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, pct || 0))}%` }]} />
      </View>
    </View>
  );
}

/** Nota de 0 a 5 em estrelas, com o número em mono. */
function Score({ label, value }: { label: string; value: number }) {
  const n = Math.round(Number(value) || 0);
  return (
    <View style={styles.scoreRow} accessible accessibilityLabel={`${label}: ${value} de 5`}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={14} color={i <= n ? Colors.gold : Colors.border} fill={i <= n ? Colors.gold : 'transparent'} strokeWidth={2} />
        ))}
      </View>
      <Text style={styles.scoreNum}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { ...Type.section, color: Colors.text, marginBottom: 12 },
  metricCard: { backgroundColor: Colors.card, borderColor: Colors.border, borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 12 },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8 },
  metricTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metricTitle: { color: Colors.text, fontSize: 14, fontWeight: 'bold' },
  metricValue: { color: Colors.muted, fontFamily: Fonts.mono, fontSize: 12 },
  progressBar: { height: 6, backgroundColor: Colors.border, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.gold, borderRadius: 999 },
  evalCard: { backgroundColor: Colors.card, borderColor: Colors.border, borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 12 },
  evalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  evalAuthor: { color: Colors.text, fontWeight: 'bold', fontSize: 14 },
  evalDate: { color: Colors.muted, fontFamily: Fonts.mono, fontSize: 12 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  scoreLabel: { color: Colors.muted, fontSize: 12, width: 80 },
  scoreNum: { color: Colors.gold, fontFamily: Fonts.monoBold, fontSize: 12 },
  evalNotes: { color: Colors.text, fontStyle: 'italic', fontSize: 14, marginTop: 8 },
});
