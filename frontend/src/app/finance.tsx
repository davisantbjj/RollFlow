import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';

export default function Finance() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MASTER';

  if (isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.title}>Financeiro <Text style={styles.highlight}>Admin</Text></Text>
          </View>
          
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>2 Mensalidades Atrasadas</Text>
            <Text style={styles.alertSub}>Total: R$ 340,00</Text>
          </View>

          <Text style={styles.sectionTitle}>Planos Ativos</Text>
          <View style={styles.planCard}>
            <Text style={styles.planName}>Plano Ouro (Anual)</Text>
            <Text style={styles.planPrice}>R$ 170,00 / mês</Text>
            <Text style={styles.planMeta}>45 alunos inscritos</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Aluno view
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Minha <Text style={styles.highlight}>Assinatura</Text></Text>
        </View>

        <View style={styles.planCard}>
          <View style={styles.statusBadgeActive}>
            <Text style={styles.statusTextActive}>Ativa</Text>
          </View>
          <Text style={styles.planName}>Plano Ouro (Anual)</Text>
          <Text style={styles.planPrice}>R$ 170,00 / mês</Text>
          <Text style={styles.planMeta}>Vencimento: 10/07/2026</Text>
          <TouchableOpacity style={styles.payBtn}>
            <Text style={styles.payBtnText}>Pagar Fatura (PIX)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  scroll: { flex: 1 },
  header: { padding: 24, paddingTop: 40 },
  title: { fontSize: 32, color: Colors.text, fontWeight: 'bold' },
  highlight: { color: Colors.gold },
  alertCard: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(232,75,75,0.12)',
    borderColor: 'rgba(232,75,75,0.3)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },
  alertTitle: { color: Colors.red, fontWeight: 'bold', fontSize: 16 },
  alertSub: { color: Colors.text, opacity: 0.8, marginTop: 4 },
  sectionTitle: { fontSize: 20, color: Colors.text, fontWeight: 'bold', marginHorizontal: 24, marginBottom: 16 },
  planCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
  },
  planName: { fontSize: 18, color: Colors.text, fontWeight: 'bold' },
  planPrice: { fontSize: 16, color: Colors.gold, marginTop: 4, fontWeight: 'bold' },
  planMeta: { fontSize: 13, color: Colors.muted, marginTop: 8 },
  statusBadgeActive: {
    position: 'absolute', top: 20, right: 20,
    backgroundColor: 'rgba(75,232,122,0.2)',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(75,232,122,0.3)',
  },
  statusTextActive: { color: Colors.green, fontWeight: 'bold', fontSize: 12 },
  payBtn: {
    backgroundColor: Colors.blue,
    padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 16,
  },
  payBtnText: { color: '#fff', fontWeight: 'bold' },
});
