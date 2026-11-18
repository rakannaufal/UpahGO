import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { RoleArt, ServiceArt } from "./CeriaArt";
import { Icon } from "./ui";
import { c } from "./theme";

// Illustrations explain the flow; no real identity, map or completed transaction is implied.
export function OnboardingArt({ step }: { step: number }) {
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      style={{
        height: 280,
        width: "100%",
        maxWidth: 400,
        alignSelf: "center",
        borderRadius: 32,
        backgroundColor:
          step === 1
            ? c.infoContainer
            : step === 2
              ? c.warmContainer
              : c.primaryContainer,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      {step === 0 ? (
        <>
          <RoleArt role="employer" style={{ width: "100%", height: 220 }} />
          <View style={{ position: "absolute", bottom: 16, right: 20 }}>
            <ServiceArt name="work" size={56} />
          </View>
        </>
      ) : step === 1 ? (
        <>
          <ServiceArt name="location_on" size={120} />
          <Text style={{ color: c.info, marginTop: 12, fontSize: 14 }}>
            Temukan akun di area perkiraan
          </Text>
        </>
      ) : (
        <View style={{ gap: 16, width: "100%" }}>
          {[
            { icon: "person_add", label: "Minta izin kontak" },
            { icon: "description", label: "Sepakati tugas dan upah" },
            { icon: "payments", label: "Bayar tunai di tempat" },
          ].map((item) => (
            <View
              key={item.icon}
              style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
            >
              <Icon name={item.icon} />
              <Text
                style={{
                  flex: 1,
                  fontSize: 16,
                  lineHeight: 24,
                  fontWeight: "600",
                  color: c.onSurface,
                }}
              >
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
