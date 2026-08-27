// app/(admin)/_layout.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';
import { RoleGuard } from '../../components/RoleGuard';

const ADMIN_TABS = [
  { name: 'dashboard', label: 'Home', icon: 'home-outline' as const, iconActive: 'home' as const },
  { name: 'siswa', label: 'Siswa', icon: 'people-outline' as const, iconActive: 'people' as const },
  { name: 'panitia', label: 'Panitia', icon: 'person-add-outline' as const, iconActive: 'person-add' as const },
  { name: 'akademik', label: 'Akademik', icon: 'school-outline' as const, iconActive: 'school' as const },
];

function AdminTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 10);

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: bottomPadding }]}>
      {state.routes.map((route: any, index: number) => {
        const tab = ADMIN_TABS.find((t) => t.name === route.name);
        if (!tab) return null;
        const isActive = state.index === index;
        const onPress = () => {
          if (!isActive) navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity
            key={route.name}
            style={styles.tabItem}
            onPress={onPress}
            activeOpacity={0.75}
          >
            {isActive ? (
              <View style={styles.activePill}>
                <Ionicons name={tab.iconActive} size={18} color="#fff" />
                <Text style={styles.activePillText}>{tab.label}</Text>
              </View>
            ) : (
              <View style={styles.inactiveTab}>
                <Ionicons name={tab.icon} size={22} color="#78909C" />
                <Text style={styles.inactiveTabText}>{tab.label}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function AdminLayout() {
  return (
    <RoleGuard allowedRoles={['ADMIN_KESISWAAN']}>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <AdminTabBar {...props} />}
      >
        <Tabs.Screen name="dashboard" />
        <Tabs.Screen name="siswa" />
        <Tabs.Screen name="panitia" />
        <Tabs.Screen name="akademik" />
      </Tabs>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 6,
  },
  activePillText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  inactiveTab: {
    alignItems: 'center',
    gap: 2,
  },
  inactiveTabText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#78909C',
  },
});
