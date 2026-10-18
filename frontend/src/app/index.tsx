import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Colors } from '../../theme/colors';
import BeltCard from '../components/BeltCard';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';
import { api } from '../services/api';

interface DashboardStats {
  totalStudents: number;
  overdueCount: number;
  todayClasses: any[];
}

interface AttendanceStats {
  thisMonth: number;
  totalClasses: number;
}

export default function Dashboard() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({ thisMonth: 0, totalClasses: 0 });
  const [adminStats, setAdminStats] = useState<DashboardStats>({ totalStudents: 0, overdueCount: 0, todayClasses: [] });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!token) {
      router.replace('/login');
    }
  }, [token]);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MASTER' || user?.role === 'PROFESSOR';

  const fetchData = useCallback(async () => {
    try {
      // Fetch classes
      const classRes = await api.get('/classes');
      setClasses(classRes.data || []);

      if (isAdmin) {
        // Admin: fetch users to count students and overdue
        const usersRes = await api.get('/users?filterRole=ALUNO');
        const students = usersRes.data || [];
        const blocked = students.filter((s: any) => s.isBlocked);
        setAdminStats({
          totalStudents: students.length,
          overdueCount: blocked.length,
          todayClasses: classRes.data || [],
        });
      } else {
        // Student: fetch attendance history
        try {
          const attendRes = await api.get('/attendance/history');
          setAttendanceStats(attendRes.data?.stats || { thisMonth: 0, totalClasses: 0 });
        } catch {
          // Might fail if no attendance records yet
        }
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (token) fetchData();
  }, [token, fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (!token) return null;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gold} />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Get first name for greeting
  const firstName = user?.name?.split(' ')[0] || 'Campeão';
  const lastName = user?.name?.split(' ').slice(1).join(' ') || '';

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  if (isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
        >
          <View style={styles.header}>
            <Text style={styles.greeting}>Painel Administrativo</Text>
            <Text style={styles.name}>{firstName} <Text style={styles.nameHighlight}>{lastName}</Text></Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{adminStats.totalStudents}</Text>
              <Text style={styles.statLbl}>Alunos Ativos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNum, adminStats.overdueCount > 0 ? { color: Colors.red } : {}]}>{adminStats.overdueCount}</Text>
              <Text style={styles.statLbl}>Inadimplentes</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{classes.length}</Text>
              <Text style={styles.statLbl}>Turmas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>—</Text>
              <Text style={styles.statLbl}>Receita Mensal</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Turmas</Text>

          {classes.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Nenhuma turma cadastrada ainda</Text>
              <Text style={styles.emptySubtext}>Crie turmas na aba "Turmas"</Text>
            </View>
          ) : (
            classes.slice(0, 5).map((cls: any) => (
              <TouchableOpacity
                key={cls.id}
                style={styles.nextClass}
                onPress={() => router.push({ pathname: '/checkin' as any, params: { classId: cls.id, className: cls.name } })}
                activeOpacity={0.7}
              >
                <View style={styles.classTime}>
                  <Text style={styles.hour}>{cls.startTime || '—'}</Text>
                </View>
                <View style={styles.classInfo}>
                  <Text style={styles.className}>{cls.name}</Text>
                  <Text style={styles.classMeta}>{cls._count?.students || 0} alunos · {cls.dayOfWeek || 'Horário flexível'}</Text>
                </View>
                <TouchableOpacity
                  style={styles.checkinBtn}
                  onPress={() => router.push({ pathname: '/checkin' as any, params: { classId: cls.id, className: cls.name } })}
                >
                  <Text style={styles.checkinText}>Chamada</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Aluno view
  const frequency = attendanceStats.totalClasses > 0
    ? Math.round((attendanceStats.thisMonth / Math.max(attendanceStats.totalClasses, 1)) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting}, campeão 👊</Text>
          <Text style={styles.name}>{firstName} <Text style={styles.nameHighlight}>{lastName}</Text></Text>
        </View>

        <TouchableOpacity onPress={() => router.push('/progression' as any)} activeOpacity={0.8}>
          <BeltCard />
        </TouchableOpacity>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{attendanceStats.thisMonth}</Text>
            <Text style={styles.statLbl}>Aulas no Mês</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{frequency}%</Text>
            <Text style={styles.statLbl}>Frequência</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Minhas Turmas</Text>

        {classes.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Você ainda não está em nenhuma turma</Text>
            <Text style={styles.emptySubtext}>Peça para seu professor te adicionar</Text>
          </View>
        ) : (
          classes.map((cls: any) => (
            <View key={cls.id} style={styles.nextClass}>
              <View style={styles.classTime}>
                <Text style={styles.hour}>{cls.startTime || '—'}</Text>
              </View>
              <View style={styles.classInfo}>
                <Text style={styles.className}>{cls.name}</Text>
                <Text style={styles.classMeta}>{cls.dayOfWeek || 'Horário flexível'}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  scroll: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.muted,
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 13,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 36,
    color: Colors.text,
    fontWeight: 'bold',
    marginTop: 4,
  },
  nameHighlight: {
    color: Colors.gold,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 34,
    color: Colors.gold,
    fontWeight: 'bold',
  },
  statLbl: {
    fontSize: 10,
    color: Colors.muted,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 22,
    color: Colors.text,
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 14,
    fontWeight: 'bold',
  },
  nextClass: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: Colors.card2,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  classTime: {
    backgroundColor: Colors.gold,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  hour: {
    fontSize: 18,
    color: '#000',
    fontWeight: 'bold',
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.text,
  },
  classMeta: {
    fontSize: 12,
    color: Colors.muted,
    marginTop: 4,
  },
  checkinBtn: {
    backgroundColor: Colors.blue,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  checkinText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  emptyCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.muted,
    fontSize: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    color: Colors.border,
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
});
