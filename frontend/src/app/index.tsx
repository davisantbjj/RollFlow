import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../theme/colors';
import BeltCard from '../components/BeltCard';
import { Screen, Loading, ErrorState, Empty } from '../components/ui';
import { useAuthStore, isManagement } from '../../store/authStore';
import { api } from '../services/api';
import { apiError } from '../utils/notify';
import { money, beltName } from '../utils/format';

interface Dashboard {
  activeStudents: number;
  classesCount: number;
  attendanceThisMonth: number;
  monthRevenue: number;
  overdueCount: number;
  overdueTotal: number;
  pendingCount: number;
}

interface AttendanceStats {
  thisMonth: number;
  totalClasses: number;
}

interface Dependent {
  id: string;
  name: string;
  beltColor?: string | null;
  beltDegree?: number | null;
}

export default function Home() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const role = user?.role;
  const isManager = isManagement(role);
  const isProfessor = role === 'PROFESSOR';
  const isGuardian = role === 'RESPONSAVEL';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({ thisMonth: 0, totalClasses: 0 });

  const fetchData = useCallback(async () => {
    setError('');
    try {
      if (isGuardian) {
        const res = await api.get('/users/me/dependents');
        setDependents(res.data || []);
      } else {
        const classRes = await api.get('/classes');
        setClasses(classRes.data || []);
        if (isManager) {
          const dash = await api.get('/dashboard');
          setDashboard(dash.data);
        } else if (!isProfessor) {
          try {
            const attendRes = await api.get('/attendance/history');
            setAttendanceStats(attendRes.data?.stats || { thisMonth: 0, totalClasses: 0 });
          } catch {
            // sem presenças ainda: mantém zeros
          }
        }
      }
    } catch (err) {
      setError(apiError(err, 'Não foi possível carregar o painel.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isGuardian, isManager, isProfessor]);

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
      <Screen>
        <Loading />
      </Screen>
    );
  }

  const firstName = user?.name?.split(' ')[0] || 'Campeão';
  const lastName = user?.name?.split(' ').slice(1).join(' ') || '';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const refresh = <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />;

  const header = (label: string) => (
    <View style={styles.header}>
      <Text style={styles.greeting}>{label}</Text>
      <Text style={styles.name}>
        {firstName} <Text style={styles.nameHighlight}>{lastName}</Text>
      </Text>
    </View>
  );

  const classRow = (cls: any, withAction: boolean) => (
    <TouchableOpacity
      key={cls.id}
      style={styles.nextClass}
      disabled={!withAction}
      onPress={() => router.push({ pathname: '/checkin' as any, params: { classId: cls.id, className: cls.name } })}
      activeOpacity={0.7}
    >
      <View style={styles.classTime}>
        <Text style={styles.hour}>{cls.startTime || '—'}</Text>
      </View>
      <View style={styles.classInfo}>
        <Text style={styles.className}>{cls.name}</Text>
        <Text style={styles.classMeta}>
          {withAction ? `${cls._count?.students || 0} alunos · ` : ''}
          {cls.dayOfWeek || 'Horário flexível'}
        </Text>
      </View>
      {withAction && (
        <View style={styles.checkinBtn}>
          <Text style={styles.checkinText}>Chamada</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // ---------- Responsável ----------
  if (isGuardian) {
    return (
      <Screen>
        <ScrollView style={{ flex: 1 }} refreshControl={refresh}>
          {header(`${greeting}`)}
          <Text style={styles.sectionTitle}>Meus dependentes</Text>
          {error ? (
            <ErrorState message={error} onRetry={fetchData} />
          ) : dependents.length === 0 ? (
            <Empty
              icon="👨‍👧"
              title="Nenhum dependente vinculado"
              hint="Peça à academia para vincular seu filho(a) ao seu cadastro."
            />
          ) : (
            dependents.map((d) => (
              <TouchableOpacity
                key={d.id}
                style={styles.nextClass}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={`Ver progressão de ${d.name}`}
                onPress={() => router.push({ pathname: '/progression' as any, params: { studentId: d.id, studentName: d.name } })}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{d.name.substring(0, 2).toUpperCase()}</Text>
                </View>
                <View style={styles.classInfo}>
                  <Text style={styles.className}>{d.name}</Text>
                  <Text style={styles.classMeta}>
                    Faixa {beltName(d.beltColor)} · {d.beltDegree || 0}º grau
                  </Text>
                </View>
                <Text style={styles.chevron}>Ver evolução ›</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </Screen>
    );
  }

  // ---------- Gestão ----------
  if (isManager) {
    return (
      <Screen>
        <ScrollView style={{ flex: 1 }} refreshControl={refresh}>
          {header('Painel administrativo')}

          {error ? (
            <ErrorState message={error} onRetry={fetchData} />
          ) : (
            <>
              <View style={styles.statsRow}>
                <Stat value={String(dashboard?.activeStudents ?? 0)} label="Alunos ativos" />
                <Stat
                  value={String(dashboard?.overdueCount ?? 0)}
                  label="Inadimplentes"
                  color={(dashboard?.overdueCount ?? 0) > 0 ? Colors.red : undefined}
                />
              </View>
              <View style={styles.statsRow}>
                <Stat value={String(dashboard?.classesCount ?? classes.length)} label="Turmas" />
                <Stat value={money(dashboard?.monthRevenue)} label="Receita do mês" small />
              </View>
              <View style={styles.statsRow}>
                <Stat value={String(dashboard?.attendanceThisMonth ?? 0)} label="Presenças no mês" />
                <Stat value={String(dashboard?.pendingCount ?? 0)} label="Cobranças pendentes" />
              </View>
              {(dashboard?.overdueCount ?? 0) > 0 && (
                <TouchableOpacity
                  style={styles.alertCard}
                  onPress={() => router.push('/finance' as any)}
                  accessibilityRole="button"
                >
                  <Text style={styles.alertTitle}>
                    {dashboard!.overdueCount} {dashboard!.overdueCount === 1 ? 'mensalidade atrasada' : 'mensalidades atrasadas'}
                  </Text>
                  <Text style={styles.alertSub}>Total: {money(dashboard!.overdueTotal)} · toque para ver</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          <Text style={styles.sectionTitle}>Turmas</Text>
          {classes.length === 0 ? (
            <Empty title="Nenhuma turma cadastrada ainda" hint='Crie turmas na aba "Turmas"' />
          ) : (
            classes.slice(0, 5).map((cls) => classRow(cls, true))
          )}
        </ScrollView>
      </Screen>
    );
  }

  // ---------- Professor ----------
  if (isProfessor) {
    return (
      <Screen>
        <ScrollView style={{ flex: 1 }} refreshControl={refresh}>
          {header('Painel do professor')}
          <Text style={styles.sectionTitle}>Turmas</Text>
          {error ? (
            <ErrorState message={error} onRetry={fetchData} />
          ) : classes.length === 0 ? (
            <Empty title="Nenhuma turma cadastrada ainda" />
          ) : (
            classes.map((cls) => classRow(cls, true))
          )}
        </ScrollView>
      </Screen>
    );
  }

  // ---------- Aluno ----------
  return (
    <Screen>
      <ScrollView style={{ flex: 1 }} refreshControl={refresh}>
        {header(`${greeting}, campeão`)}

        <TouchableOpacity onPress={() => router.push('/progression' as any)} activeOpacity={0.8}>
          <BeltCard />
        </TouchableOpacity>

        <View style={styles.statsRow}>
          <Stat value={String(attendanceStats.thisMonth)} label="Aulas no mês" />
          <Stat value={String(attendanceStats.totalClasses)} label="Aulas registradas" />
        </View>

        <Text style={styles.sectionTitle}>Minhas turmas</Text>
        {error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : classes.length === 0 ? (
          <Empty title="Você ainda não está em nenhuma turma" hint="Peça para seu professor te adicionar." />
        ) : (
          classes.map((cls) => classRow(cls, false))
        )}
      </ScrollView>
    </Screen>
  );
}

function Stat({ value, label, color, small }: { value: string; label: string; color?: string; small?: boolean }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statNum, small && { fontSize: 24, lineHeight: 40 }, color ? { color } : null]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 },
  greeting: { fontSize: 13, color: Colors.muted, fontWeight: 'bold' },
  name: { fontSize: 36, color: Colors.text, fontWeight: 'bold', marginTop: 4 },
  nameHighlight: { color: Colors.gold },
  statsRow: { flexDirection: 'row', gap: 12, marginHorizontal: 20, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: Colors.card, borderColor: Colors.border, borderWidth: 1,
    borderRadius: 20, paddingVertical: 18, paddingHorizontal: 12, alignItems: 'center',
  },
  statNum: { fontSize: 32, color: Colors.gold, fontWeight: 'bold' },
  statLbl: { fontSize: 12, color: Colors.muted, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  alertCard: {
    marginHorizontal: 20, marginBottom: 12, backgroundColor: 'rgba(232,75,75,0.1)',
    borderColor: 'rgba(232,75,75,0.3)', borderWidth: 1, borderRadius: 20, padding: 18,
  },
  alertTitle: { color: Colors.red, fontWeight: 'bold', fontSize: 16 },
  alertSub: { color: Colors.muted, marginTop: 4, fontSize: 13 },
  sectionTitle: { fontSize: 22, color: Colors.text, paddingHorizontal: 24, marginTop: 8, marginBottom: 14, fontWeight: 'bold' },
  nextClass: {
    marginHorizontal: 20, marginBottom: 12, backgroundColor: Colors.card2, borderColor: Colors.border,
    borderWidth: 1, borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  classTime: { backgroundColor: Colors.gold, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', minWidth: 60 },
  hour: { fontSize: 18, color: '#000', fontWeight: 'bold' },
  classInfo: { flex: 1 },
  className: { fontSize: 15, fontWeight: 'bold', color: Colors.text },
  classMeta: { fontSize: 12, color: Colors.muted, marginTop: 4 },
  checkinBtn: { backgroundColor: Colors.blue, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  checkinText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.card, borderWidth: 2, borderColor: Colors.gold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.gold, fontWeight: 'bold' },
  chevron: { color: Colors.gold, fontWeight: 'bold', fontSize: 13 },
});
