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
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
    paddingHorizontal: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 5,
  },
  activePillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  inactiveTab: {
    alignItems: 'center',
    gap: 3,
  },
  inactiveTabText: {
    color: '#78909C',
    fontSize: 11,
    fontWeight: '500',
  },
});
