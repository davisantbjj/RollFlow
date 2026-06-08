import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const login = useAuthStore(state => state.login);

  const handleLogin = () => {
    if (email === 'admin@rollflow.com') {
      login({ id: '1', role: 'ADMIN', academyId: '1', name: 'Mestre André' }, 'mock-token');
      router.replace('/');
    } else {
      login({ id: '2', role: 'ALUNO', academyId: '1', name: 'Marcos Silva' }, 'mock-token');
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Roll<Text style={styles.highlight}>Flow</Text></Text>
        <Text style={styles.subtitle}>Gestão de Excelência para o Tatame</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Digite seu e-mail (ex: admin@rollflow.com)"
            placeholderTextColor={Colors.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Senha</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Digite sua senha"
            placeholderTextColor={Colors.muted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Text style={styles.loginBtnText}>Entrar no App</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black, justifyContent: 'center' },
  formContainer: { paddingHorizontal: 24, paddingBottom: 40 },
  title: { fontSize: 48, color: Colors.text, fontWeight: 'bold', textAlign: 'center' },
  highlight: { color: Colors.gold },
  subtitle: { color: Colors.muted, textAlign: 'center', marginBottom: 40, marginTop: 4 },
  inputGroup: { marginBottom: 20 },
  label: { color: Colors.text, marginBottom: 8, fontWeight: 'bold' },
  input: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    color: Colors.text,
    fontSize: 16,
  },
  loginBtn: {
    backgroundColor: Colors.gold,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  loginBtnText: { color: Colors.black, fontSize: 16, fontWeight: 'bold' }
});
