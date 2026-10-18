import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '../../theme/colors';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { api } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { login, isLoading, setLoading } = useAuthStore();

  const handleLogin = async () => {
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email: email.trim(), password });
      const { user, token } = response.data;
      login(user, token);
      router.replace('/');
    } catch (err: any) {
      const message = err.response?.data?.error || 'Erro ao conectar com o servidor';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Roll<Text style={styles.highlight}>Flow</Text></Text>
        <Text style={styles.subtitle}>Gestão de Excelência para o Tatame</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Digite seu e-mail"
            placeholderTextColor={Colors.muted}
            value={email}
            onChangeText={(text) => { setEmail(text); setError(''); }}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!isLoading}
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
            onChangeText={(text) => { setPassword(text); setError(''); }}
            editable={!isLoading}
            onSubmitEditing={handleLogin}
          />
        </View>

        <TouchableOpacity 
          style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]} 
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.black} size="small" />
          ) : (
            <Text style={styles.loginBtnText}>Entrar no App</Text>
          )}
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
  errorBox: {
    backgroundColor: 'rgba(232,75,75,0.12)',
    borderColor: 'rgba(232,75,75,0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  errorText: { color: Colors.red, fontSize: 14, textAlign: 'center' },
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
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: { color: Colors.black, fontSize: 16, fontWeight: 'bold' },
});
