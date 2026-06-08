import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import BeltCard from '../components/BeltCard';
import { useAuthStore } from '../../store/authStore';

export default function Dashboard() {
  const { user } = useAuthStore();
  
  // Para testar a UI do Admin, caso queira forçar coloque isAdmin = true;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MASTER';

  if (isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.greeting}>Painel Administrativo</Text>
            <Text style={styles.name}>Mestre <Text style={styles.nameHighlight}>André</Text></Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>142</Text>
              <Text style={styles.statLbl}>Alunos Ativos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNum, { color: Colors.red }]}>8</Text>
              <Text style={styles.statLbl}>Inadimplentes</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Turmas de Hoje</Text>
          
          <View style={styles.nextClass}>
            <View style={styles.classTime}>
              <Text style={styles.hour}>19:30</Text>
            </View>
            <View style={styles.classInfo}>
              <Text style={styles.className}>Jiu-Jitsu Avançado</Text>
              <Text style={styles.classMeta}>32 alunos inscritos</Text>
            </View>
            <TouchableOpacity style={styles.checkinBtn}>
              <Text style={styles.checkinText}>Chamada</Text>
            </TouchableOpacity>
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
          <Text style={styles.greeting}>Bom dia, campeão 👊</Text>
          <Text style={styles.name}>Marcos <Text style={styles.nameHighlight}>Silva</Text></Text>
        </View>
        
        <BeltCard />
        
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>12</Text>
            <Text style={styles.statLbl}>Aulas no Mês</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>78%</Text>
            <Text style={styles.statLbl}>Frequência</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Próxima Aula</Text>
        
        <View style={styles.nextClass}>
          <View style={styles.classTime}>
            <Text style={styles.hour}>19:30</Text>
          </View>
          <View style={styles.classInfo}>
            <Text style={styles.className}>Jiu-Jitsu Avançado</Text>
            <Text style={styles.classMeta}>Professor André · Tatame 1</Text>
          </View>
        </View>
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
    marginBottom: 20,
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
    marginBottom: 14,
    fontWeight: 'bold',
  },
  nextClass: {
    marginHorizontal: 20,
    marginBottom: 20,
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
  },
  hour: {
    fontSize: 24,
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
  }
});
