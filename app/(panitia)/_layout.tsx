// app/(panitia)/_layout.tsx
import React from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator,
} from "react-native";
import { Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

const PANITIA_TABS = [
  { name: "dashboard", label: "Dashboard", icon: "home-outline" as const, iconActive: "home" as const },
  { name: "events", label: "Event", icon: "calendar-outline" as const, iconActive: "calendar" as const },
  { name: "announcements", label: "Pengumuman", icon: "megaphone-outline" as const, iconActive: "megaphone" as const },
  { name: "history", label: "Riwayat", icon: "time-outline" as const, iconActive: "time" as const },
];

function PanitiaTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === "ios" ? 16 : 10);
  return (
    <View style={[styles.tabBarContainer, { paddingBottom: bottomPadding }]}>
      {state.routes.map((route: any, index: number) => {
        const tab = PANITIA_TABS.find((t) => t.name === route.name);
        if (!tab) return null;
        const isActive = state.index === index;
        return (
          <TouchableOpacity
            key={route.name}
            style={styles.tabItem}
            onPress={() => { if (!isActive) navigation.navigate(route.name); }}
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

function PanitiaGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <View style={styles.guardLoader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }
  if (!user || user.role !== "PANITIA") {
    router.replace("/login");
    return null;
  }
  return <>{children}</>;
}

export default function PanitiaLayout() {
  return (
    <PanitiaGuard>
      <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <PanitiaTabBar {...props} />}>
        <Tabs.Screen name="dashboard" />
        <Tabs.Screen name="events" />
        <Tabs.Screen name="announcements" />
        <Tabs.Screen name="history" />
      </Tabs>
    </PanitiaGuard>
  );
}

const styles = StyleSheet.create({
  guardLoader: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F5F7FA" },
  tabBarContainer: {
    flexDirection: "row", backgroundColor: "#FFFFFF", paddingTop: 10, paddingHorizontal: 8,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 12,
  },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 50 },
  activePill: {
    flexDirection: "row", alignItems: "center", backgroundColor: Colors.primary,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, gap: 5,
  },
  activePillText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  inactiveTab: { alignItems: "center", gap: 3 },
  inactiveTabText: { color: "#78909C", fontSize: 11, fontWeight: "500" },
});
