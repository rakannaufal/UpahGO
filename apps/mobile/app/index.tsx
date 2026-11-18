import React from "react";
import { Image, View } from "react-native";
import { Text } from "react-native-paper";
import { Redirect, router } from "expo-router";
import { useSession } from "../src/session";
import { signInGoogle } from "../src/auth";
import { entryRoute } from "../../../shared/contracts";
import { RoleArt, ServiceArt } from "../src/CeriaArt";
import { c } from "../src/theme";
import {
  Page,
  Action,
  Note,
  LoadState,
  s,
  useTask,
  TextButton as Button,
} from "../src/ui";
export default function Welcome() {
  const state = useSession();
  const task = useTask();
  if (!state.ready)
    return (
      <Page title="Upahgo">
        <Text>Memuat…</Text>
      </Page>
    );
  if (state.session || state.demo) {
    if (!state.data)
      return (
        <Page title="Memuat akun">
          <LoadState
            loading={!state.error}
            error={state.error}
            reload={() => void state.refresh()}
          />
          <Action secondary onPress={() => void state.logout()}>
            Kembali ke masuk
          </Action>
        </Page>
      );
    return <Redirect href={entryRoute(state.data)} />;
  }
  return (
    <Page title="Upahgo" hideTitle form>
      <View
        style={{
          paddingTop: 16,
          paddingBottom: 16,
          gap: 24,
        }}
      >
        <Image
          source={require("../../../assets/brand/exports/upahgo-lockup-light.png")}
          style={{ width: 160, height: 48 }}
          resizeMode="contain"
          accessibilityLabel="Logo Upahgo"
        />
        <View
          style={{
            backgroundColor: c.primaryContainer,
            borderRadius: 36,
            height: 280,
            padding: 24,
            justifyContent: "center",
          }}
        >
          <RoleArt role="worker" style={{ width: "100%", height: "100%" }} />
          <View style={{ position: "absolute", top: 16, left: 16 }}>
            <ServiceArt name="home" size={56} />
          </View>
          <View style={{ position: "absolute", bottom: 20, left: 24 }}>
            <ServiceArt name="cleaning_services" size={48} />
          </View>
          <View style={{ position: "absolute", bottom: 20, right: 24 }}>
            <ServiceArt name="mop" size={48} />
          </View>
        </View>
        <Text
          variant="headlineMedium"
          style={{ fontWeight: "700", marginTop: 8 }}
        >
          Cari tenaga.{"\n"}Temukan kerja.
        </Text>
        <Text style={s.subtitle}>
          Bertemu lewat peta. Sepakati tugas dan upah sebelum mulai bekerja.
        </Text>
      </View>
      <Action
        secondary
        icon={
          <Image
            source={require("../../../assets/ceria/google-g.png")}
            style={{ width: 20, height: 20 }}
          />
        }
        busy={task.busy}
        onPress={() => void task.run(signInGoogle)}
      >
        Masuk dengan Google
      </Action>
      <Button
        onPress={() => {
          state.startDemo();
          router.replace("/");
        }}
      >
        Coba demo
      </Button>
      <Text style={[s.small, { textAlign: "center" }]}>
        Demo memakai data sintetis.
      </Text>
      <Button onPress={() => router.push("/help")}>Privasi dan bantuan</Button>
      {!!task.error && <Note error>{task.error}</Note>}
    </Page>
  );
}
