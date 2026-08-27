// app/(panitia)/_layout.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../constants/theme";
import { RoleGuard } from "../../components/RoleGuard";

const PANITIA_TABS = [
  {
    name: "dashboard",
    label: "Home",
    iconActive: "home" as const,
    iconInactive: "home-outline" as const,
  },
  {
    name: "events/index",
    label: "Events",
    iconActive: "calendar" as const,
    iconInactive: "calendar-outline" as const,
  },
  {
    name: "announcements",
    label: "Info",
    iconActive: "notifications" as const,
    iconInactive: "notifications-outline" as const,
  },
  {
    name: "history",
    label: "History",
    iconActive: "time" as const,
    iconInactive: "time-outline" as const,
  },
];

function PanitiaTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === "ios" ? 16 : 10);

  return (
    <View style={[styles.tabBarWrapper, { paddingBottom: bottomPadding }]}>
      <View style={styles.tabBarContent}>
        {PANITIA_TABS.map((item) => {
          const routeIndex = state.routes.findIndex((r: any) => r.name === item.name);
          const isFocused = state.index === routeIndex;

          const onPress = () => {
            if (routeIndex !== -1) {
              const route = state.routes[routeIndex];
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }
          };

          return (
            <TouchableOpacity
              key={item.name}
              style={[
                styles.tabItem,
                isFocused ? styles.tabItemActive : styles.tabItemInactive,
              ]}
              onPress={onPress}
              activeOpacity={0.7}
            >
              {isFocused ? (
                <View style={styles.activePill}>
                  <Ionicons name={item.iconActive} size={18} color="#FFFFFF" />
                  <Text style={styles.activePillText}>{item.label}</Text>
                </View>
              ) : (
                <View style={styles.inactiveIconWrapper}>
                  <Ionicons name={item.iconInactive} size={22} color="#78909C" />
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

export default function PanitiaLayout() {
  return (
    <RoleGuard allowedRoles={["PANITIA", "SISWA", "ADMIN_KESISWAAN"]}>
      <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <PanitiaTabBar {...props} />}>
        <Tabs.Screen name="dashboard" options={{ title: "Home" }} />
        <Tabs.Screen name="events/index" options={{ title: "Events" }} />
        <Tabs.Screen name="announcements" options={{ title: "Info" }} />
        <Tabs.Screen name="history" options={{ title: "History" }} />
      </Tabs>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  tabBarContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  tabItemActive: {
    flex: 1.4,
  },
  tabItemInactive: {
    flex: 1,
  },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 6,
  },
  activePillText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  inactiveIconWrapper: {
    alignItems: "center",
    gap: 2,
  },
  inactiveLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#78909C",
  },
});
