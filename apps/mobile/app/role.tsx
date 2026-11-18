import React, { useState } from "react";
import { Text, TouchableRipple } from "react-native-paper";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { AccountGate, Action, Icon, Note, Page, s, useTask } from "../src/ui";
import { useSession } from "../src/session";
import type { Role } from "../../../shared/contracts";
import { View, useWindowDimensions } from "react-native";
import { RoleArt, ServiceArt } from "../src/CeriaArt";
import { c } from "../src/theme";
export default function RoleScreen() {
  return (
    <AccountGate registration={false}>
      <Content />
    </AccountGate>
  );
}
function Content() {
  const state = useSession();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const current = state.data!.account.role;
  const [role, setRole] = useState(current ?? "");
  const task = useTask();
  const { fontScale } = useWindowDimensions();
  if (!state.data!.account.introSeen) return <Redirect href="/onboarding" />;
  return (
    <Page title={edit ? "Peran akun" : "Pilih peran"} back={!!edit} form>
      <Text variant="headlineMedium">Kamu ingin apa?</Text>
      <Text style={s.subtitle}>Pilih kebutuhanmu saat ini.</Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Peran akun"
        style={{
          flexDirection: fontScale >= 1.5 ? "column" : "row",
          gap: 12,
          marginVertical: 16,
        }}
      >
        {(
          [
            {
              value: "worker",
              title: "Cari kerja",
              label: "Cari kerja · Buruh",
              body: "Tawarkan bantuan dan layanan harian.",
              color: c.infoContainer,
              icon: "work",
            },
            {
              value: "employer",
              title: "Cari tenaga",
              label: "Cari tenaga · Penyedia kerja",
              body: "Temukan orang untuk membantu pekerjaanmu.",
              color: c.warmContainer,
              icon: "home",
            },
          ] as const
        ).map((item) => (
          <TouchableRipple
            key={item.value}
            accessibilityRole="radio"
            accessibilityLabel={item.label}
            accessibilityState={{ checked: role === item.value }}
            aria-checked={role === item.value}
            onPress={() => setRole(item.value)}
            style={{
              flex: 1,
              borderRadius: 28,
              backgroundColor: item.color,
              borderWidth: 1,
              borderColor: role === item.value ? c.primary : item.color,
              overflow: "hidden",
            }}
          >
            <View pointerEvents="none" style={{ padding: 16, gap: 12 }}>
              <RoleArt
                role={item.value}
                style={{ height: 190, width: "100%" }}
              />
              <View
                style={{
                  alignItems: "flex-end",
                  marginTop: -48,
                  marginBottom: 8,
                }}
              >
                <ServiceArt name={item.icon} size={48} />
              </View>
              <Text variant="titleLarge">{item.title}</Text>
              <Text style={[s.body, { fontSize: 14, lineHeight: 22 }]}>
                {item.body}
              </Text>
              {role === item.value && (
                <View
                  style={{
                    position: "absolute",
                    right: 14,
                    top: 14,
                    backgroundColor: c.primary,
                    borderRadius: 14,
                    padding: 4,
                  }}
                >
                  <Icon name="check" color={c.onPrimary} />
                </View>
              )}
            </View>
          </TouchableRipple>
        ))}
      </View>
      <Text style={s.small}>
        Peran bisa diubah melalui Akun. Riwayat pekerjaan tetap tersimpan.
      </Text>
      {edit && role !== current && (
        <Note>Penanda peta dimatikan. Riwayat pekerjaan tetap tersimpan.</Note>
      )}
      {!!task.error && <Note error>{task.error}</Note>}
      <Action
        busy={task.busy}
        disabled={!role}
        onPress={() =>
          void task.run(async () => {
            await state.api.call("set_role", { role: role as Role });
            await state.refresh();
            router.replace(edit ? "/(tabs)/home" : "/location");
          })
        }
      >
        {edit ? "Simpan peran" : "Lanjut"}
      </Action>
      {edit && (
        <Text>Periksa layanan atau kebutuhanmu setelah berganti peran.</Text>
      )}
    </Page>
  );
}
