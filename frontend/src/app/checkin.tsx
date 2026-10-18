import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Users, Lock, CircleCheck, Check } from 'lucide-react-native';
import { Text, Screen, Header, Loading, Empty, Button, Badge } from '../components/ui';
import { Type } from '../../theme/typography';
import { beltName } from '../utils/format';
import { Colors } from '../../theme/colors';
import { api } from '../services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { notify, apiError } from '../utils/notify';

interface Student {
  id: string;
  name: string;
  beltColor: string;
  beltDegree: number;
  isBlocked: boolean;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  present: boolean;
}

export default function Checkin() {
  const { classId, className } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'PROFESSOR';

  // Se não for admin, redireciona de volta
  useEffect(() => {
    if (!isAdmin) {
      notify.error('Acesso negado');
      router.back();
    }
  }, [isAdmin, router]);

  const fetchData = useCallback(async () => {
    if (!classId) return;

    try {
      // Fetch enrolled students
      const stuRes = await api.get(`/classes/${classId}/students`);
      setStudents(stuRes.data || []);

      // Fetch today's attendance for this class
      const attRes = await api.get(`/attendance/class/${classId}`);
      
      // Filter for today only
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const todaysAttendances = attRes.data.filter((a: any) => {
        const ad = new Date(a.date);
        return `${ad.getFullYear()}-${pad(ad.getMonth() + 1)}-${pad(ad.getDate())}` === today;
      });
      
      setAttendances(todaysAttendances);
    } catch (error) {
      console.error('Error fetching checkin data:', error);
      notify.error('Não foi possível carregar os dados da turma');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleCheckin = async (studentId: string, isBlocked: boolean) => {
    if (isBlocked) {
      notify.error('Este aluno está com pendências e não pode fazer check-in.');
      return;
    }

    setActionLoading(studentId);
    try {
      await api.post('/attendance', {
        classId,
        studentId,
      });
      // Refresh just the attendances to be faster, or re-fetch all
      await fetchData();
    } catch (error: any) {
      notify.error(apiError(error, 'Erro ao registrar presença'));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Screen>
        <Header title="Chamada" subtitle={className as string} back />
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Chamada" subtitle={className as string} back />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
      >
        <View style={styles.statsCard}>
          <Text style={styles.statsHighlight}>{attendances.length}/{students.length}</Text>
          <Text style={styles.statsText}>presentes hoje</Text>
        </View>

        <Text style={styles.sectionTitle}>Alunos matriculados</Text>

        {students.length === 0 ? (
          <Empty icon={Users} title="Nenhum aluno matriculado nesta turma" />
        ) : (
          students.map((student) => {
            const isPresent = attendances.some(a => a.studentId === student.id);

            return (
              <View key={student.id} style={[styles.studentCard, student.isBlocked && styles.studentCardBlocked]}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.studentBelt}>
                    {student.beltColor ? `Faixa ${beltName(student.beltColor)}` : 'Sem faixa'} · {student.beltDegree || 0} graus
                  </Text>
                  {student.isBlocked && (
                    <View style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                      <Badge label="Pendência financeira" color={Colors.red} icon={Lock} />
                    </View>
                  )}
                </View>

                {isPresent ? (
                  <Badge label="Presente" color={Colors.green} icon={CircleCheck} />
                ) : (
                  <Button
                    label="Dar presença"
                    icon={Check}
                    onPress={() => handleCheckin(student.id, student.isBlocked)}
                    loading={actionLoading === student.id}
                    disabled={student.isBlocked}
                    style={{ minWidth: 148 }}
                  />
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, paddingHorizontal: 20 },
  statsCard: {
    backgroundColor: Colors.card, borderColor: Colors.border, borderWidth: 1, borderRadius: 20,
    padding: 16, marginBottom: 24, alignItems: 'center', gap: 4,
  },
  statsText: { ...Type.monoLabel, color: Colors.muted, textTransform: 'uppercase' },
  statsHighlight: { ...Type.kpi, color: Colors.gold },
  sectionTitle: { ...Type.section, color: Colors.text, marginBottom: 12 },
  studentCard: {
    backgroundColor: Colors.card, borderColor: Colors.border, borderWidth: 1, borderRadius: 20,
    padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  },
  studentCardBlocked: { borderColor: 'rgba(232,75,75,0.4)', backgroundColor: 'rgba(232,75,75,0.05)' },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 16, color: Colors.text, fontWeight: 'bold' },
  studentBelt: { fontSize: 12, color: Colors.muted, marginTop: 4 },
});
