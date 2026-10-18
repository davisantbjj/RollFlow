import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import { api } from '../services/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ErrorState } from '../components/ui';
import { apiError } from '../utils/notify';
import BeltCard from '../components/BeltCard';

export default function Progression() {
  const { user } = useAuthStore();
  const params = useLocalSearchParams<{ studentId?: string; studentName?: string }>();
  const studentId = (params.studentId as string) || user?.id;
  const isOther = !!params.studentId && params.studentId !== user?.id;
  const router = useRouter();
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Evolução</Text>
        {isOther && params.studentName ? <Text style={styles.subtitle}>{params.studentName}</Text> : null}
      </View>

      <ScrollView style={styles.scroll}>
        {error ? <ErrorState message={error} onRetry={fetchData} /> : null}
        {!error && <BeltCard studentId={studentId} />}

        {progression && progression.stats && progression.rule && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Métricas de Progresso</Text>
            
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricTitle}>🥋 Assiduidade</Text>
                <Text style={styles.metricValue}>{progression.stats.attendances} / {progression.rule.minAttendanceCount} aulas</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progression.progress.attendance}%` }]} />
              </View>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricTitle}>⏱️ Tempo de Faixa</Text>
                <Text style={styles.metricValue}>{progression.stats.elapsedMonths} / {progression.rule.minMonths} meses</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progression.progress.time}%` }]} />
              </View>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricTitle}>⭐ Avaliação Técnica</Text>
                <Text style={styles.metricValue}>{progression.stats.avgScore} / {progression.rule.minEvaluationScore} (Média)</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progression.progress.evaluation}%` }]} />
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Avaliações Recentes</Text>
          {evaluations.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Nenhuma avaliação registrada ainda.</Text>
            </View>
          ) : (
            evaluations.map(ev => {
              const date = new Date(ev.createdAt).toLocaleDateString('pt-BR');
              return (
                <View key={ev.id} style={styles.evalCard}>
                  <View style={styles.evalHeader}>
                    <Text style={styles.evalAuthor}>Por {ev.evaluator?.name || 'Professor'}</Text>
                    <Text style={styles.evalDate}>{date}</Text>
                  </View>
                  <View style={styles.evalScores}>
                    <Text style={styles.evalScore}>Técnica: <Text style={styles.goldText}>{ev.technique}</Text></Text>
                    <Text style={styles.evalScore}>Disciplina: <Text style={styles.goldText}>{ev.discipline}</Text></Text>
                    <Text style={styles.evalScore}>Evolução: <Text style={styles.goldText}>{ev.evolution}</Text></Text>
                  </View>
                  {ev.notes ? <Text style={styles.evalNotes}>"{ev.notes}"</Text> : null}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 24, paddingTop: 40, paddingBottom: 16 },
  backBtn: { marginBottom: 16 },
  backBtnText: { color: Colors.gold, fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 32, color: Colors.text, fontWeight: 'bold' },
  subtitle: { fontSize: 16, color: Colors.muted, marginTop: 4 },
  scroll: { flex: 1 },
  
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    color: Colors.text,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricTitle: { color: Colors.text, fontSize: 15, fontWeight: 'bold' },
  metricValue: { color: Colors.muted, fontSize: 14 },
  progressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 99,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: 99,
  },

  emptyCard: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: { color: Colors.muted, fontSize: 14 },

  evalCard: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  evalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  evalAuthor: { color: Colors.text, fontWeight: 'bold', fontSize: 15 },
  evalDate: { color: Colors.muted, fontSize: 13 },
  evalScores: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  evalScore: { color: Colors.muted, fontSize: 13 },
  goldText: { color: Colors.gold, fontWeight: 'bold' },
  evalNotes: { color: Colors.text, fontStyle: 'italic', fontSize: 14, marginTop: 4 },
});
