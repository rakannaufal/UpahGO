import React, { useEffect, useState } from "react";
import "../src/web-style";
import { AccessibilityInfo } from "react-native";
import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider } from "../src/session";
import { theme } from "../src/theme";
import { Icon } from "../src/ui";
import { DiscoveryProvider } from "../src/discovery-state";
export default function Root() {
  const [reduce, setReduce] = useState(true);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduce,
    );
    return () => sub.remove();
  }, []);
  return (
    <SafeAreaProvider>
      <PaperProvider
        settings={{
          icon: ({ name }) => (
            <Icon
              name={
                (
                  {
                    "chevron-left": "arrow_back",
                    "chevron-right": "chevron_right",
                    "menu-down": "expand_more",
                  } as Record<string, string>
                )[name] ?? name
              }
            />
          ),
        }}
        theme={{ ...theme, animation: { scale: reduce ? 0 : 1 } }}
      >
        <SessionProvider>
          <DiscoveryProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, animation: "none" }} />
          </DiscoveryProvider>
        </SessionProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
