import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { ProfileIdentity } from "./ActivityMedia";
import { c } from "./theme";
import type { Person } from "../../../shared/contracts";

export function ProfilePin({ people }: { people: Person[] }) {
  const p = people[0]!;
  return (
    <View style={{ width: 56, height: 66, alignItems: "center" }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          borderWidth: 3,
          borderColor: c.primary,
          backgroundColor: c.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {people.length > 1 ? (
          <Text style={{ color: c.primary, fontSize: 18, fontWeight: "700" }}>
            {people.length}
          </Text>
        ) : (
          <ProfileIdentity
            id={p.id}
            role={p.role}
            photoReady={p.photoReady}
            size={44}
          />
        )}
      </View>
      <View
        style={{
          marginTop: -2,
          width: 0,
          height: 0,
          borderLeftWidth: 7,
          borderRightWidth: 7,
          borderTopWidth: 10,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderTopColor: c.primary,
        }}
      />
    </View>
  );
}
