import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Colors } from '../../theme/colors';
import { api } from '../services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

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

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MASTER' || user?.role === 'PROFESSOR';

  // Se não for admin, redireciona de volta
  useEffect(() => {
    if (!isAdmin) {
      Alert.alert('Erro', 'Acesso negado');
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
      const today = new Date().toISOString().split('T')[0];
      const todaysAttendances = attRes.data.filter((a: any) => a.date.startsWith(today));
      
      setAttendances(todaysAttendances);
    } catch (error) {
      console.error('Error fetching checkin data:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados da turma');
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
      Alert.alert('Bloqueado', 'Este aluno está com pendências e não pode fazer check-in.');
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
      Alert.alert('Erro', error.response?.data?.error || 'Erro ao registrar presença');
    } finally {
      setActionLoading(null);
    }
  };

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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Chamada</Text>
        <Text style={styles.subtitle}>{className}</Text>
      </View>

      <ScrollView 
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
      >
        <View style={styles.statsCard}>
          <Text style={styles.statsText}>
            <Text style={styles.statsHighlight}>{attendances.length}</Text> de {students.length} presentes hoje
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Alunos Matriculados</Text>

        {students.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nenhum aluno matriculado nesta turma.</Text>
          </View>
        ) : (
          students.map((student) => {
            const isPresent = attendances.some(a => a.studentId === student.id);

            return (
              <View key={student.id} style={[styles.studentCard, student.isBlocked && styles.studentCardBlocked]}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.studentBelt}>
                    {student.beltColor ? `Faixa ${student.beltColor}` : 'Sem faixa'} • {student.beltDegree || 0} graus
                  </Text>
                  {student.isBlocked && (
                    <Text style={styles.blockedText}>Pendência Financeira</Text>
                  )}
                </View>

                {isPresent ? (
                  <View style={styles.presentBadge}>
                    <Text style={styles.presentText}>Presente ✓</Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={[styles.checkinBtn, student.isBlocked && styles.checkinBtnDisabled]}
                    onPress={() => handleCheckin(student.id, student.isBlocked)}
                    disabled={actionLoading === student.id || student.isBlocked}
                  >
                    {actionLoading === student.id ? (
                      <ActivityIndicator color={Colors.black} size="small" />
                    ) : (
                      <Text style={styles.checkinBtnText}>Dar Presença</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
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
  scroll: { flex: 1, paddingHorizontal: 20 },
  
  statsCard: {
    backgroundColor: Colors.card2,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  statsText: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  statsHighlight: { color: Colors.gold, fontSize: 20, fontWeight: 'bold' },
  
  sectionTitle: { fontSize: 18, color: Colors.text, fontWeight: 'bold', marginBottom: 16 },
  
  studentCard: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentCardBlocked: {
    borderColor: 'rgba(232,75,75,0.4)',
    backgroundColor: 'rgba(232,75,75,0.05)',
  },
  studentInfo: { flex: 1, paddingRight: 12 },
  studentName: { fontSize: 16, color: Colors.text, fontWeight: 'bold' },
  studentBelt: { fontSize: 13, color: Colors.muted, marginTop: 4 },
  blockedText: { color: Colors.red, fontSize: 12, fontWeight: 'bold', marginTop: 4 },
  
  checkinBtn: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 110,
    alignItems: 'center',
  },
  checkinBtnDisabled: {
    backgroundColor: Colors.border,
    opacity: 0.5,
  },
  checkinBtnText: { color: Colors.black, fontWeight: 'bold', fontSize: 13 },
  
  presentBadge: {
    backgroundColor: 'rgba(75,232,122,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(75,232,122,0.3)',
    minWidth: 110,
    alignItems: 'center',
  },
  presentText: { color: Colors.green, fontWeight: 'bold', fontSize: 13 },

  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: { color: Colors.muted, fontSize: 15, textAlign: 'center' },
});
