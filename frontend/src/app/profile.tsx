import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import { api } from '../services/api';
import { useRouter } from 'expo-router';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  beltColor: string | null;
  beltDegree: number | null;
  academy?: { id: string; name: string };
  createdAt: string;
}

export default function Profile() {
  const { logout, user } = useAuthStore();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/profile');
        setProfile(res.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair do aplicativo?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Sair', 
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/login');
        }
      }
    ]);
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

  const roleMap: Record<string, string> = {
    MASTER: 'Dono da Franquia',
    ADMIN: 'Administrador',
    PROFESSOR: 'Professor',
    ALUNO: 'Aluno',
    RESPONSAVEL: 'Responsável',
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meu Perfil</Text>
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>
              {profile?.name?.substring(0, 2).toUpperCase() || 'RF'}
            </Text>
          </View>
          <Text style={styles.name}>{profile?.name}</Text>
          <Text style={styles.roleText}>{profile?.role ? roleMap[profile.role] : ''}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>E-mail</Text>
              <Text style={styles.infoValue}>{profile?.email}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Telefone</Text>
              <Text style={styles.infoValue}>{profile?.phone || 'Não informado'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Academia</Text>
              <Text style={styles.infoValue}>{profile?.academy?.name || 'Não associado'}</Text>
            </View>
          </View>
        </View>

        {profile?.role === 'ALUNO' && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Graduação</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Faixa</Text>
                <Text style={styles.infoValue}>{profile?.beltColor || 'Branca'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Graus</Text>
                <Text style={styles.infoValue}>{profile?.beltDegree || 0} graus</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Sair da Conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 24, paddingTop: 40, paddingBottom: 16 },
  title: { fontSize: 32, color: Colors.text, fontWeight: 'bold' },
  scroll: { flex: 1, paddingHorizontal: 20 },
  
  avatarSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.card2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gold,
    marginBottom: 16,
  },
  avatarInitials: {
    fontSize: 32,
    color: Colors.gold,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  name: {
    fontSize: 24,
    color: Colors.text,
    fontWeight: 'bold',
  },
  roleText: {
    fontSize: 14,
    color: Colors.muted,
    marginTop: 4,
    fontWeight: '600',
  },

  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  infoCard: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  infoLabel: {
    color: Colors.muted,
    fontSize: 14,
  },
  infoValue: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },

  actionSection: {
    marginTop: 16,
    marginBottom: 40,
  },
  logoutBtn: {
    backgroundColor: 'rgba(232,75,75,0.1)',
    borderColor: 'rgba(232,75,75,0.3)',
    borderWidth: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: Colors.red,
    fontWeight: 'bold',
    fontSize: 15,
  },
});
