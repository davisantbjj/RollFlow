import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../../theme/colors';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
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
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => <TabIcon label="🏠" color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          title: 'Turmas',
          tabBarIcon: ({ color }) => <TabIcon label="🥋" color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color }) => <TabIcon label="📰" color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: 'Financeiro',
          tabBarIcon: ({ color }) => <TabIcon label="💰" color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <TabIcon label="👤" color={color as string} />,
        }}
      />
      {/* Hide screens that shouldn't be tabs */}
      <Tabs.Screen name="login" options={{ href: null }} />
      <Tabs.Screen name="checkin" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}

function TabIcon({ label }: { label: string; color: string }) {
  return (
    <>{label}</>
  );
}
