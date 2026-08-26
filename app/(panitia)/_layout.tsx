// app/(panitia)/_layout.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

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
                  <Ionicons name={item.iconActive} size={22} color="#FFFFFF" />
                  <Text style={styles.activeLabel}>{item.label}</Text>
                </View>
              ) : (
                <View style={styles.inactiveBox}>
                  <Ionicons name={item.iconInactive} size={22} color="#8E9BAE" />
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

function PanitiaGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <View style={styles.guardLoader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }
  if (!user || (user.role !== "PANITIA" && user.role !== "SISWA" && user.role !== "ADMIN_KESISWAAN")) {
    router.replace("/login");
    return null;
  }
  return <>{children}</>;
}

export default function PanitiaLayout() {
  return (
    <PanitiaGuard>
      <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <PanitiaTabBar {...props} />}>
        <Tabs.Screen name="dashboard" options={{ title: "Home" }} />
        <Tabs.Screen name="events/index" options={{ title: "Events" }} />
        <Tabs.Screen name="announcements" options={{ title: "Info" }} />
        <Tabs.Screen name="history" options={{ title: "History" }} />
      </Tabs>
    </PanitiaGuard>
  );
}

const styles = StyleSheet.create({
  guardLoader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F7FA",
  },
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
    elevation: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  tabBarContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
  },
  activePill: {
    backgroundColor: "#B81414",
    borderRadius: 14,
    paddingVertical: 7,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 70,
  },
  activeLabel: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  inactiveBox: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  inactiveLabel: {
    color: "#8E9BAE",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
});
