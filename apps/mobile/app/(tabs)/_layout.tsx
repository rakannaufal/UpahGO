import React from "react";
import { Platform, Pressable, View, useWindowDimensions } from "react-native";
import { Text } from "react-native-paper";
import { Tabs, Redirect, useIsFocused } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSession } from "../../src/session";
import { Icon, Note, Page, Action } from "../../src/ui";
import { c } from "../../src/theme";
import { entryRoute } from "../../../../shared/contracts";
const entries = [
  { name: "home", label: "Beranda", icon: "home" },
  { name: "discover", label: "Temukan", icon: "location_on" },
  { name: "activity", label: "Aktivitas", icon: "list_alt" },
  { name: "notices", label: "Notifikasi", icon: "notifications" },
  { name: "account", label: "Akun", icon: "person" },
];
export const unstable_settings = { initialRouteName: "home" };
export default function Main() {
  const state = useSession();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  if (!state.demo && !state.session) return <Redirect href="/" />;
  if (state.error && !state.data)
    return (
      <Page title="Data belum tersedia">
        <Note error>{state.error}</Note>
        <Action onPress={() => void state.refresh()}>Coba lagi</Action>
      </Page>
    );
  if (!state.data)
    return (
      <Page title="Upahgo">
        <Text>Memuat akun…</Text>
      </Page>
    );
  const next = entryRoute(state.data);
  if (next !== "/(tabs)/home") return <Redirect href={next} />;
  if (state.data.account.status !== "active")
    return (
      <Page title="Akun">
        <Note>Permintaan penghapusan tercatat. Akun dibatasi.</Note>
        <Action onPress={() => void state.logout()}>Keluar akun</Action>
      </Page>
    );
  const rail = width >= 840;
  return (
    <View
      aria-hidden={!focused}
      style={{
        flex: 1,
        flexDirection: rail ? "row" : "column",
        display: Platform.OS === "web" && !focused ? "none" : "flex",
      }}
    >
      <Tabs
        key={`${state.data.account.id}:${state.data.account.role}`}
        screenOptions={{
          headerShown: false,
          tabBarPosition: rail ? "left" : "bottom",
        }}
        tabBar={({ state: nav, emitter, navigateToTab }) => (
          <View
            accessibilityRole="tablist"
            accessibilityLabel="Navigasi utama"
            style={{
              flexDirection: rail ? "column" : "row",
              width: rail ? 112 : undefined,
              paddingTop: rail ? insets.top + 24 : 8,
              paddingBottom: Math.max(insets.bottom, 8),
              paddingHorizontal: 4,
              gap: 0,
              backgroundColor: c.surface,
              borderTopWidth: rail ? 0 : 1,
              borderRightWidth: rail ? 1 : 0,
              borderColor: c.outlineVariant,
            }}
          >
            {entries.map((item) => {
              const index = nav.routes.findIndex((r) => r.name === item.name);
              const route = nav.routes[index];
              const active = nav.index === index;
              return (
                <Pressable
                  key={item.name}
                  accessibilityRole="tab"
                  accessibilityLabel={item.label}
                  accessibilityState={{ selected: active }}
                  aria-selected={active}
                  onPress={() => {
                    if (route) {
                      const event = emitter.emit({
                        type: "tabPress",
                        target: route.key,
                        canPreventDefault: true,
                      });
                      if (!active && !event.defaultPrevented)
                        navigateToTab(route.key);
                    }
                  }}
                  style={({ pressed }) => ({
                    minHeight: 72,
                    minWidth: 0,
                    flex: rail ? undefined : 1,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    borderRadius: 18,
                    backgroundColor: pressed ? c.surfaceVariant : c.surface,
                  })}
                >
                  <View
                    style={{
                      width: 52,
                      minHeight: 32,
                      borderRadius: 18,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name={item.icon} filled={active} />
                  </View>
                  <Text
                    style={{
                      fontSize: 12,
                      color: active ? c.primary : c.onSurfaceVariant,
                      fontWeight: active ? "700" : "400",
                    }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      >
        <Tabs.Screen name="home" options={{ title: "Beranda" }} />
        <Tabs.Screen name="discover" options={{ title: "Temukan" }} />
        <Tabs.Screen name="activity" options={{ title: "Aktivitas" }} />
        <Tabs.Screen name="notices" options={{ title: "Notifikasi" }} />
        <Tabs.Screen name="account" options={{ title: "Akun", lazy: false }} />
      </Tabs>
    </View>
  );
}
