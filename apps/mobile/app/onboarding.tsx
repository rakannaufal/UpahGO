import React, { useState } from "react";
import { Image, View, useWindowDimensions } from "react-native";
import { Text } from "react-native-paper";
import {
  TextButton as Button,
  AccountGate,
  Action,
  Note,
  Page,
  Reveal,
  useTask,
  s,
} from "../src/ui";
import { Redirect, router } from "expo-router";
import { useSession } from "../src/session";
import { OnboardingArt } from "../src/OnboardingArt";
import { c } from "../src/theme";
const slides = [
  {
    title: "Cari kerja.\nCari tenaga.",
    body: "Pilih akun yang sesuai di areamu.",
  },
  { title: "Temukan\ndi peta", body: "Lihat akun yang sedang aktif." },
  {
    title: "Sepakati. Kerjakan.\nBayar tunai.",
    body: "Kontak dibuka setelah disetujui.",
  },
];
export default function Intro() {
  return (
    <AccountGate registration={false}>
      <Content />
    </AccountGate>
  );
}
export function Content({ preview = false }: { preview?: boolean }) {
  const state = useSession();
  const task = useTask();
  const [step, setStep] = useState(0);
  const { height, fontScale } = useWindowDimensions();
  if (!preview && state.data!.account.introSeen)
    return (
      <Redirect href={state.data!.account.role ? "/(tabs)/home" : "/role"} />
    );
  const finish = () =>
    void task.run(async () => {
      if (preview) {
        router.back();
        return;
      }
      await state.api.call("onboarding", { step: "intro" });
      await state.refresh();
      router.replace("/role");
    });
  return (
    <Page
      title="Upahgo"
      form
      toolbar={
        <Button onPress={finish} disabled={task.busy}>
          {preview ? "Tutup" : "Lewati"}
        </Button>
      }
    >
      <View style={{ alignItems: "center", gap: 16, paddingVertical: 8 }}>
        <Image
          source={require("../../../assets/brand/exports/upahgo-badge.png")}
          style={{ width: 48, height: 48 }}
          accessibilityLabel="Logo Upahgo"
        />
        {height > 650 && fontScale < 1.5 && <OnboardingArt step={step} />}
      </View>
      <Reveal key={step}>
        <Text
          accessibilityRole="header"
          variant="headlineMedium"
          style={{ textAlign: "center", fontWeight: "700" }}
        >
          {slides[step]!.title}
        </Text>
        <Text
          style={[s.body, { textAlign: "center", color: c.onSurfaceVariant }]}
        >
          {slides[step]!.body}
        </Text>
      </Reveal>
      <View
        accessibilityLabel={`Langkah ${step + 1} dari 3`}
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: 8,
          paddingVertical: 16,
        }}
      >
        {slides.map((_, i) => (
          <View
            key={i}
            style={{
              height: 8,
              width: i === step ? 24 : 8,
              borderRadius: 4,
              backgroundColor: i === step ? c.primary : c.outlineVariant,
            }}
          />
        ))}
      </View>
      <Action
        busy={task.busy}
        onPress={step < 2 ? () => setStep(step + 1) : finish}
      >
        {step < 2 ? "Lanjut" : preview ? "Selesai" : "Pilih peran"}
      </Action>
      {step > 0 && (
        <Button onPress={() => setStep(step - 1)}>Sebelumnya</Button>
      )}
      {!!task.error && <Note error>{task.error}</Note>}
    </Page>
  );
}
