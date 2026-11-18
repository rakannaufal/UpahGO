import React, { useState } from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { router } from "expo-router";
import { useSession } from "../../src/session";
import {
  Icon,
  MenuRow,
  Note,
  Page,
  Panel,
  Sheet,
  useTask,
  s,
} from "../../src/ui";
import { c } from "../../src/theme";
import { ProfileIdentity } from "../../src/ActivityMedia";
import { Star } from "../../src/Rating";
export default function Account() {
  const state = useSession();
  const data = state.data!;
  const p = data.profile;
  const task = useTask();
  const [ratingOpen, setRatingOpen] = useState(false);
  return (
    <Page title="Akun" hideTitle tonal form>
      <View style={{ gap: 4 }}>
        <Text accessibilityRole="header" variant="headlineSmall">
          Akunmu
        </Text>
        <Text style={s.small}>Atur profil, lokasi, dan privasimu.</Text>
      </View>
      <View style={[s.card, { padding: 20, gap: 16 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <ProfileIdentity
            id={p?.id}
            role={data.account.role ?? "worker"}
            photoReady={p?.photoStatus === "approved"}
            size={64}
          />
          <View style={{ flex: 1, gap: 4 }}>
            <Text
              variant="titleLarge"
              style={{ fontWeight: "700", color: c.onSurface }}
            >
              {p?.name ?? "Lengkapi profilmu"}
            </Text>
            <Text style={[s.small, { color: c.primary }]}>
              {data.account.role === "worker" ? "Buruh" : "Penyedia kerja"}
            </Text>
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 8,
            paddingTop: 14,
            borderTopWidth: 1,
            borderColor: c.outlineVariant,
          }}
        >
          <Icon name="location_on" />
          <Text style={[s.small, { flex: 1 }]}>
            {data.city
              ? `${data.city.label} · ${data.account.location?.radiusKm ?? 5} km`
              : "Lokasi belum diaktifkan"}
          </Text>
        </View>
      </View>
      <Text style={s.section}>Profil dan lokasi</Text>
      <Panel compact>
        <MenuRow
          label={p ? "Edit profil" : "Lengkapi profil"}
          icon="edit"
          onPress={() => router.push("/setup")}
        />
        <MenuRow
          label={
            data.account.role === "worker"
              ? "Foto profil (opsional)"
              : "Foto tempat (opsional)"
          }
          icon="person"
          onPress={() => router.push("/profile-photo")}
        />
        <MenuRow
          label="Peran akun"
          icon="work"
          onPress={() =>
            router.push({ pathname: "/role", params: { edit: "1" } })
          }
        />
        <MenuRow
          label="Lokasi & jangkauan"
          detail={
            data.city
              ? `${data.city.label} · ${data.account.location?.radiusKm} km`
              : "Aktifkan lokasi"
          }
          icon="location_on"
          onPress={() =>
            router.push({ pathname: "/location", params: { edit: "1" } })
          }
        />
        <MenuRow
          label="Nomor WhatsApp"
          detail={p?.whatsappReady ? "Terverifikasi" : "Belum diverifikasi"}
          icon="person_add"
          last
          onPress={() => router.push("/phone")}
        />
      </Panel>
      {state.demo && (
        <>
          <Text style={s.section}>Akun simulasi</Text>
          <Text style={s.small}>
            Beralih akun untuk mencoba alur dua pihak.
          </Text>
          <Panel compact>
            {(
              [
                { id: "demo-worker", label: "Buruh demo" },
                { id: "demo-employer", label: "Penyedia kerja demo" },
                { id: "demo-me", label: "Akun demo utama" },
              ] as const
            )
              .filter((x) => x.id !== data.account.id)
              .map((x, index, accounts) => (
                <MenuRow
                  key={x.id}
                  label={x.label}
                  icon="person"
                  last={index === accounts.length - 1}
                  onPress={() => {
                    state.switchDemo(x.id);
                    router.replace("/");
                  }}
                />
              ))}
          </Panel>
        </>
      )}
      <Text style={s.section}>Lainnya</Text>
      <Panel compact>
        <MenuRow
          label="Bantuan dan laporan"
          icon="help_outline"
          onPress={() => router.push("/help")}
        />
        <MenuRow
          label="Ketentuan dan privasi"
          icon="description"
          onPress={() => router.push("/legal")}
        />
        <MenuRow
          label="Atribusi data"
          icon="map"
          onPress={() => router.push("/attribution")}
        />
        <MenuRow
          label="Beri nilai Upahgo"
          detail="Belum tersedia di versi lokal"
          icon="edit"
          leading={
            <View style={{ width: 40, alignItems: "center" }}>
              <Star filled={false} />
            </View>
          }
          last
          onPress={() => setRatingOpen(true)}
        />
      </Panel>
      <Text style={s.section}>Kelola akun</Text>
      <Panel compact>
        <MenuRow
          label={state.demo ? "Keluar dari demo" : "Keluar akun"}
          icon="logout"
          busy={task.busy}
          onPress={() =>
            void task.run(async () => {
              await state.logout();
              router.replace("/");
            })
          }
        />
        <MenuRow
          label="Hapus akun"
          icon="delete_outline"
          destructive
          last
          disabled={task.busy}
          onPress={() => router.push("/delete-account")}
        />
      </Panel>
      {!!task.error && <Note error>{task.error}</Note>}
      <Sheet
        visible={ratingOpen}
        title="Beri nilai Upahgo"
        onClose={() => setRatingOpen(false)}
      >
        <Text style={s.body}>
          Penilaian tersedia setelah Upahgo diterbitkan di Google Play. Versi
          ini masih pengujian lokal dan belum memiliki tautan toko resmi.
        </Text>
      </Sheet>
    </Page>
  );
}
