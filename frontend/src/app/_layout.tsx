import React, { useEffect } from 'react';
import { View, Text, ColorValue } from 'react-native';
import { Tabs, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { Colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import Feedback from '../components/Feedback';
import { Loading } from '../components/ui';

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>{icon}</Text>;
}

const icon = (emoji: string) => ({ focused }: { focused: boolean; color: ColorValue }) => (
  <TabIcon icon={emoji} focused={focused} />
);

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const navState = useRootNavigationState();
  const { token, user, hydrated } = useAuthStore();

  const inLogin = (segments as string[])[0] === 'login';
  const role = user?.role;

  // Guarda de rota: sem token -> login; com token na tela de login -> início
  useEffect(() => {
    if (!hydrated || !navState?.key) return;
    if (!token && !inLogin) router.replace('/login');
    else if (token && inLogin) router.replace('/');
  }, [hydrated, navState?.key, token, inLogin, router]);

  const isManager = role === 'MASTER' || role === 'ADMIN';
  const showClasses = role !== 'RESPONSAVEL';
  const showStudents = isManager || role === 'PROFESSOR';
  const showFinance = role !== 'PROFESSOR';

  return (
    <View style={{ flex: 1, backgroundColor: Colors.black }}>
      {!hydrated ? (
        <Loading />
      ) : (
        <Tabs
          // Recria todas as telas quando o usuário muda: nada do usuário anterior fica na memória
          key={user?.id ?? 'anon'}
          screenOptions={{
            headerShown: false,
            sceneStyle: { backgroundColor: Colors.black },
            tabBarStyle: {
              backgroundColor: Colors.dark,
              borderTopColor: Colors.border,
              borderTopWidth: 1,
              height: 65,
              paddingBottom: 8,
              paddingTop: 8,
            },
            tabBarActiveTintColor: Colors.gold,
            tabBarInactiveTintColor: Colors.muted,
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
          }}
        >
          <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: icon('🏠') }} />
          <Tabs.Screen
            name="classes"
            options={{ title: 'Turmas', tabBarIcon: icon('🥋'), href: showClasses ? undefined : null }}
          />
          <Tabs.Screen
            name="students"
            options={{ title: 'Alunos', tabBarIcon: icon('👥'), href: showStudents ? undefined : null }}
          />
          <Tabs.Screen name="feed" options={{ title: 'Feed', tabBarIcon: icon('📰') }} />
          <Tabs.Screen
            name="finance"
            options={{ title: 'Financeiro', tabBarIcon: icon('💰'), href: showFinance ? undefined : null }}
          />
          <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: icon('👤') }} />

          {/* Telas escondidas da barra */}
          <Tabs.Screen name="login" options={{ href: null, tabBarStyle: { display: 'none' } }} />
          <Tabs.Screen name="checkin" options={{ href: null }} />
          <Tabs.Screen name="progression" options={{ href: null }} />
          <Tabs.Screen name="student/[id]" options={{ href: null }} />
        </Tabs>
      )}
      <Feedback />
    </View>
  );
}
