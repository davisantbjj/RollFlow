import React, { useEffect } from 'react';
import { View, ColorValue } from 'react-native';
import { useFonts } from 'expo-font';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Syne_400Regular, Syne_500Medium, Syne_600SemiBold, Syne_700Bold } from '@expo-google-fonts/syne';
import { JetBrainsMono_400Regular, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { House, CalendarDays, Users, Newspaper, Wallet, CircleUser } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Fonts } from '../../theme/typography';
import { Tabs, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { Colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import Feedback from '../components/Feedback';
import { Text, Loading } from '../components/ui';

const icon = (Icon: LucideIcon) => ({ color }: { focused: boolean; color: ColorValue; size: number }) => (
  <Icon size={22} color={color as string} strokeWidth={2} />
);

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const navState = useRootNavigationState();
  const { token, user, hydrated: storeHydrated } = useAuthStore();
  const [fontsLoaded, fontError] = useFonts({
    BebasNeue_400Regular, Syne_400Regular, Syne_500Medium, Syne_600SemiBold, Syne_700Bold,
    JetBrainsMono_400Regular, JetBrainsMono_700Bold,
  });
  const hydrated = storeHydrated && (fontsLoaded || !!fontError);

  const segment = (segments as string[])[0];
  const inLogin = segment === 'login';
  const role = user?.role;
  const blocked = !!user?.isBlocked;
  const blockedAllowed = segment === 'finance' || segment === 'profile';
  const master = role === 'MASTER';
  const masterAllowed = !segment || segment === 'index' || segment === 'profile';

  // Guarda de rota: sem token -> login; com token na tela de login -> início;
  // bloqueado (inadimplente) -> só Financeiro e Perfil
  useEffect(() => {
    if (!hydrated || !navState?.key) return;
    if (!token && !inLogin) router.replace('/login');
    else if (token && inLogin) router.replace(blocked ? '/finance' : '/');
    else if (token && master && !masterAllowed) router.replace('/');
    else if (token && blocked && !blockedAllowed) router.replace('/finance');
  }, [hydrated, navState?.key, token, inLogin, blocked, blockedAllowed, master, masterAllowed, router]);

  const isManager = role === 'ADMIN';
  const showHome = !blocked;
  const showFeed = !master && !blocked;
  const showClasses = !master && role !== 'RESPONSAVEL' && !blocked;
  const showStudents = (isManager || role === 'PROFESSOR') && !blocked;
  const showFinance = !master && (role !== 'PROFESSOR' || blocked);

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
            tabBarLabelStyle: { fontSize: 11, fontFamily: Fonts.semibold, letterSpacing: 0.3 },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{ title: 'Início', tabBarIcon: icon(House), href: showHome ? undefined : null }}
          />
          <Tabs.Screen
            name="classes"
            options={{ title: 'Turmas', tabBarIcon: icon(CalendarDays), href: showClasses ? undefined : null }}
          />
          <Tabs.Screen
            name="students"
            options={{ title: 'Alunos', tabBarIcon: icon(Users), href: showStudents ? undefined : null }}
          />
          <Tabs.Screen
            name="feed"
            options={{ title: 'Feed', tabBarIcon: icon(Newspaper), href: showFeed ? undefined : null }}
          />
          <Tabs.Screen
            name="finance"
            options={{ title: 'Financeiro', tabBarIcon: icon(Wallet), href: showFinance ? undefined : null }}
          />
          <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: icon(CircleUser) }} />

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
