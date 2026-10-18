import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, Alert } from 'react-native';
import { Colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import { api } from '../services/api';
import { useRouter } from 'expo-router';

interface ClassItem {
  id: string;
  name: string;
  description?: string;
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
  maxStudents?: number;
  _count?: { students: number; teachers: number };
}

export default function Classes() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newClass, setNewClass] = useState({ name: '', description: '', dayOfWeek: '', startTime: '', endTime: '' });
  const [creating, setCreating] = useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MASTER' || user?.role === 'PROFESSOR';

  const fetchClasses = useCallback(async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchClasses();
  };

  const handleCreate = async () => {
    if (!newClass.name.trim()) {
      Alert.alert('Erro', 'Nome da turma é obrigatório');
      return;
    }

    setCreating(true);
    try {
      await api.post('/classes', {
        name: newClass.name.trim(),
        description: newClass.description.trim() || undefined,
        academyId: user?.academyId,
        dayOfWeek: newClass.dayOfWeek.trim() || undefined,
        startTime: newClass.startTime.trim() || undefined,
        endTime: newClass.endTime.trim() || undefined,
      });
      setNewClass({ name: '', description: '', dayOfWeek: '', startTime: '', endTime: '' });
      setShowCreate(false);
      fetchClasses();
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.error || 'Erro ao criar turma');
    } finally {
      setCreating(false);
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
        <Text style={styles.title}>Turmas</Text>
        {isAdmin && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowCreate(!showCreate)}
            activeOpacity={0.7}
          >
            <Text style={styles.addBtnText}>{showCreate ? '✕' : '+ Nova'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
      >
        {/* Create Form */}
        {showCreate && (
          <View style={styles.createForm}>
            <Text style={styles.formTitle}>Nova Turma</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome da turma *"
              placeholderTextColor={Colors.muted}
              value={newClass.name}
              onChangeText={(t) => setNewClass({ ...newClass, name: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Descrição"
              placeholderTextColor={Colors.muted}
              value={newClass.description}
              onChangeText={(t) => setNewClass({ ...newClass, description: t })}
            />
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Dia (ex: Segunda)"
                placeholderTextColor={Colors.muted}
                value={newClass.dayOfWeek}
                onChangeText={(t) => setNewClass({ ...newClass, dayOfWeek: t })}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Horário (ex: 19:30)"
                placeholderTextColor={Colors.muted}
                value={newClass.startTime}
                onChangeText={(t) => setNewClass({ ...newClass, startTime: t })}
              />
            </View>
            <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={creating}>
              {creating ? (
                <ActivityIndicator color={Colors.black} size="small" />
              ) : (
                <Text style={styles.createBtnText}>Criar Turma</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Class List */}
        {classes.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🥋</Text>
            <Text style={styles.emptyText}>Nenhuma turma cadastrada</Text>
            {isAdmin && <Text style={styles.emptySubtext}>Toque em "+ Nova" para criar a primeira turma</Text>}
          </View>
        ) : (
          classes.map((cls) => (
            <TouchableOpacity
              key={cls.id}
              style={styles.classCard}
              onPress={() => {
                if (isAdmin) {
                  router.push({ pathname: '/checkin' as any, params: { classId: cls.id, className: cls.name } });
                }
              }}
              activeOpacity={isAdmin ? 0.7 : 1}
            >
              <View style={styles.classCardHeader}>
                <View style={styles.classTimeBox}>
                  <Text style={styles.classTimeText}>{cls.startTime || '—'}</Text>
                </View>
                <View style={styles.classCardInfo}>
                  <Text style={styles.classCardName}>{cls.name}</Text>
                  {cls.description ? <Text style={styles.classCardDesc}>{cls.description}</Text> : null}
                </View>
              </View>

              <View style={styles.classCardFooter}>
                <View style={styles.metaBadge}>
                  <Text style={styles.metaBadgeText}>👥 {cls._count?.students || 0} alunos</Text>
                </View>
                {cls.dayOfWeek && (
                  <View style={styles.metaBadge}>
                    <Text style={styles.metaBadgeText}>📅 {cls.dayOfWeek}</Text>
                  </View>
                )}
                {cls.endTime && (
                  <View style={styles.metaBadge}>
                    <Text style={styles.metaBadgeText}>⏰ {cls.startTime}–{cls.endTime}</Text>
                  </View>
                )}
              </View>

              {isAdmin && (
                <View style={styles.classCardActions}>
                  <TouchableOpacity
                    style={styles.chamadaBtn}
                    onPress={() => router.push({ pathname: '/checkin' as any, params: { classId: cls.id, className: cls.name } })}
                  >
                    <Text style={styles.chamadaBtnText}>📋 Fazer Chamada</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  scroll: { flex: 1, paddingHorizontal: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 40,
  },
  title: { fontSize: 32, color: Colors.text, fontWeight: 'bold' },
  addBtn: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addBtnText: { color: Colors.black, fontWeight: 'bold', fontSize: 14 },

  // Create Form
  createForm: {
    backgroundColor: Colors.card,
    borderColor: Colors.gold,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  formTitle: { fontSize: 18, color: Colors.gold, fontWeight: 'bold', marginBottom: 16 },
  input: {
    backgroundColor: Colors.card2,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    color: Colors.text,
    fontSize: 15,
    marginBottom: 12,
  },
  inputRow: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  createBtn: {
    backgroundColor: Colors.gold,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  createBtnText: { color: Colors.black, fontWeight: 'bold', fontSize: 16 },

  // Class Cards
  classCard: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
  },
  classCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  classTimeBox: {
    backgroundColor: Colors.gold,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 55,
  },
  classTimeText: { fontSize: 16, color: '#000', fontWeight: 'bold' },
  classCardInfo: { flex: 1 },
  classCardName: { fontSize: 18, color: Colors.text, fontWeight: 'bold' },
  classCardDesc: { fontSize: 13, color: Colors.muted, marginTop: 4 },
  classCardFooter: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaBadge: {
    backgroundColor: Colors.card2,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  metaBadgeText: { color: Colors.muted, fontSize: 12, fontWeight: '600' },
  classCardActions: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 14,
    paddingTop: 14,
  },
  chamadaBtn: {
    backgroundColor: Colors.blue,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  chamadaBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  // Empty State
  emptyCard: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: Colors.muted, fontSize: 18, textAlign: 'center', fontWeight: '600' },
  emptySubtext: { color: Colors.border, fontSize: 14, marginTop: 8, textAlign: 'center' },
});
