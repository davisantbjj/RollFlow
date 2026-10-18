import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { Type, Fonts } from '../../theme/typography';
import { Colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import { api } from '../services/api';
import { Text, Screen, Header, Loading, Avatar, BeltStrip, Button, ErrorState } from '../components/ui';
import { confirmAction, apiError } from '../utils/notify';
import { roleLabel } from '../utils/format';

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/profile');
        setProfile(res.data);
      } catch (err) {
        setError(apiError(err, 'Não foi possível carregar seu perfil.'));
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    const ok = await confirmAction({
      title: 'Sair da conta',
      message: 'Tem certeza que deseja sair do aplicativo?',
      confirmText: 'Sair',
      destructive: true,
    });
    if (ok) logout();
  };

  if (loading) {
    return (
      <Screen>
        <Header title="Perfil" />
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Perfil" />

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 32 }}>
        {error ? <ErrorState message={error} /> : null}
        <View style={styles.avatarSection}>
          <Avatar initials={profile?.name?.substring(0, 2).toUpperCase() || 'RF'} size={96} />
          <Text style={styles.name}>{profile?.name}</Text>
          <Text style={styles.roleText}>{roleLabel(profile?.role)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Informações pessoais</Text>
        <View style={styles.infoCard}>
          <Info label="E-mail" value={profile?.email} />
          <Info label="Telefone" value={profile?.phone || 'Não informado'} mono />
          <Info label="Academia" value={profile?.academy?.name || 'Não associado'} last />
        </View>

        {profile?.role === 'ALUNO' && (
          <>
            <Text style={styles.sectionTitle}>Graduação</Text>
            <View style={styles.infoCard}>
              <View style={[styles.infoRow, styles.divider]}>
                <Text style={styles.infoLabel}>Faixa</Text>
                <BeltStrip belt={profile?.beltColor} degree={profile?.beltDegree || 0} />
              </View>
              <Info label="Graus" value={`${profile?.beltDegree || 0}º grau`} mono last />
            </View>
          </>
        )}

        <Button label="Sair da conta" icon={LogOut} variant="danger" onPress={handleLogout} style={{ marginTop: 24 }} />
      </ScrollView>
    </Screen>
  );
}

function Info({ label, value, last, mono }: { label: string; value?: string; last?: boolean; mono?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.divider]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, mono && { fontFamily: Fonts.mono, fontSize: 13 }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, paddingHorizontal: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 24, gap: 8 },
  name: { fontSize: 22, color: Colors.text, fontWeight: 'bold', marginTop: 8 },
  roleText: { ...Type.monoLabel, color: Colors.gold, textTransform: 'uppercase' },
  sectionTitle: { ...Type.section, color: Colors.text, marginBottom: 12 },
  infoCard: { backgroundColor: Colors.card, borderColor: Colors.border, borderWidth: 1, borderRadius: 20, overflow: 'hidden', marginBottom: 24 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: 16, minHeight: 56 },
  divider: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLabel: { color: Colors.muted, fontSize: 14 },
  infoValue: { color: Colors.text, fontSize: 14, fontWeight: '600', flexShrink: 1 },
});
