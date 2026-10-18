import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { TriangleAlert } from 'lucide-react-native';
import { Text, Field, Button } from '../components/ui';
import { Fonts } from '../../theme/typography';
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
        <Text style={styles.title} accessibilityRole="header">Roll<Text style={styles.highlight}>Flow</Text></Text>
        <Text style={styles.subtitle}>Gestão de excelência para o tatame</Text>

        {error ? (
          <View style={styles.errorBox} accessibilityRole="alert">
            <TriangleAlert size={16} color={Colors.red} strokeWidth={2} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Field
          label="E-mail"
          placeholder="voce@academia.com"
          value={email}
          onChangeText={(text) => { setEmail(text); setError(''); }}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isLoading}
        />
        <Field
          label="Senha"
          placeholder="Digite sua senha"
          secureTextEntry
          value={password}
          onChangeText={(text) => { setPassword(text); setError(''); }}
          editable={!isLoading}
          onSubmitEditing={handleLogin}
        />
        <Button label="Entrar" onPress={handleLogin} loading={isLoading} style={{ marginTop: 8 }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black, justifyContent: 'center' },
  formContainer: { paddingHorizontal: 24, paddingBottom: 40, width: '100%', maxWidth: 440, alignSelf: 'center' },
  title: { fontFamily: Fonts.display, fontSize: 72, letterSpacing: 2, color: Colors.text, textAlign: 'center' },
  highlight: { color: Colors.gold },
  subtitle: { color: Colors.muted, fontSize: 14, textAlign: 'center', marginBottom: 40 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(232,75,75,0.12)', borderColor: 'rgba(232,75,75,0.3)', borderWidth: 1,
    borderRadius: 12, padding: 12, marginBottom: 20,
  },
  errorText: { color: Colors.red, fontSize: 14, flex: 1 },
});
