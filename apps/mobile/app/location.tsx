import React, { useState } from "react";
import { Linking, Platform, View } from "react-native";
import { Text } from "react-native-paper";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { AccountGate, Action, Note, Page, s, useTask } from "../src/ui";
import { ServiceArt } from "../src/CeriaArt";
import { useSession } from "../src/session";
import { RadiusChoices } from "../src/browse";
import { c } from "../src/theme";
export default function LocationScreen() {
  return (
    <AccountGate registration={false}>
      <Content />
    </AccountGate>
  );
}
function Content() {
  const state = useSession();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const [radius, setRadius] = useState(
    String(state.data!.account.location?.radiusKm ?? 5),
  );
  const task = useTask();
  if (!state.data!.account.role) return <Redirect href="/role" />;
  return (
    <Page title="Lokasi & jangkauan" form back={!!edit}>
      <View
        style={{
          alignItems: "center",
          padding: 24,
          borderRadius: 32,
          backgroundColor: c.infoContainer,
        }}
      >
        <ServiceArt name="location_on" size={96} />
      </View>
      <Text
        variant="headlineSmall"
        style={{ fontWeight: "700", color: c.onSurface }}
      >
        Kerja dekatmu.
      </Text>
      <Text style={s.body}>
        {state.demo
          ? "Lokasi simulasi: Sukajadi, Pekanbaru. GPS perangkat tidak digunakan."
          : "Aktifkan lokasi untuk mencari dalam kota atau kabupatenmu. Titik publik dibuat perkiraan."}
      </Text>
      <Text style={s.section}>Jarak yang bisa dijangkau</Text>
      <RadiusChoices
        value={Number(radius)}
        onChange={(km) => setRadius(String(km))}
      />
      <Text style={s.small}>
        Hanya saat aplikasi digunakan. Tanpa pelacakan latar belakang.
      </Text>
      <Action
        busy={task.busy || state.locating}
        onPress={() =>
          void task.run(async () => {
            await state.refreshLocation(Number(radius));
            router.replace(
              edit || state.data!.account.setupDone ? "/(tabs)/home" : "/setup",
            );
          })
        }
      >
        {state.demo ? "Gunakan lokasi demo" : "Aktifkan lokasi"}
      </Action>
      {!!task.error && <Note error>{task.error}</Note>}
      {!!task.error && Platform.OS !== "web" && (
        <Action secondary onPress={() => void Linking.openSettings()}>
          Buka pengaturan
        </Action>
      )}
      <Action secondary onPress={() => router.push("/help")}>
        Bantuan & privasi
      </Action>
      {!edit && (
        <Action
          secondary
          onPress={() => void state.logout().then(() => router.replace("/"))}
        >
          Kembali ke masuk
        </Action>
      )}
    </Page>
  );
}
