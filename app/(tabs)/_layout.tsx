// app/(tabs)/_layout.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';

/**
 * Custom Bottom Navigation Bar:
 * - 5 tabs: Home, Events, Info, History, Profil
 * - Active state: Solid red rounded button pill with white icon & white text inside
 * - Inactive state: Slate grey icon & text
 * - Floating/rounded top white container with subtle shadow
 */
function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 10);

  const TAB_ITEMS = [
    {
      name: 'home',
      label: 'Home',
      iconActive: 'home',
      iconInactive: 'home-outline',
    },
    {
      name: 'events',
      label: 'Events',
      iconActive: 'calendar',
      iconInactive: 'calendar-outline',
    },
    {
      name: 'info',
      label: 'Info',
      iconActive: 'notifications',
      iconInactive: 'notifications-outline',
    },
    {
      name: 'history',
      label: 'History',
      iconActive: 'time',
      iconInactive: 'time-outline',
    },
    {
      name: 'profile',
      label: 'Profil',
      iconActive: 'person',
      iconInactive: 'person-outline',
    },
  ];

  return (
    <View style={[styles.tabBarWrapper, { paddingBottom: bottomPadding }]}>
      <View style={styles.tabBarContent}>
        {TAB_ITEMS.map((item) => {
          const routeIndex = state.routes.findIndex((r: any) => r.name === item.name);
          const isFocused = state.index === routeIndex;

          const onPress = () => {
            if (routeIndex !== -1) {
              const route = state.routes[routeIndex];
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            } else {
              navigation.navigate(item.name);
            }
          };

          return (
            <TouchableOpacity
              key={item.name}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              activeOpacity={0.85}
              style={styles.tabButton}
            >
              {isFocused ? (
                <View style={styles.activePill}>
                  <Ionicons name={item.iconActive as any} size={18} color="#FFFFFF" />
                  <Text style={styles.activeLabel}>{item.label}</Text>
                </View>
              ) : (
                <View style={styles.inactiveBox}>
                  <Ionicons name={item.iconInactive as any} size={20} color="#8E9BAE" />
                  <Text style={styles.inactiveLabel}>{item.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="events" options={{ title: 'Events' }} />
      <Tabs.Screen name="info" options={{ title: 'Info' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  tabBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  activePill: {
    backgroundColor: '#B81414',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
  },
  activeLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  inactiveBox: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveLabel: {
    color: '#8E9BAE',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});
