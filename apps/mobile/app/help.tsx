import React, { useState } from "react";
import { Text } from "react-native-paper";
import { router } from "expo-router";
import { Icon, MenuRow, Note, Page, Sheet, s } from "../src/ui";
import { useSession } from "../src/session";
import { contactPrivacyNotice, privacyNotice } from "../src/help-content";
const topics = [
  {
    title: "Lokasi di peta",
    body: "Lokasi dipakai saat aplikasi digunakan untuk mencari dalam radius dan kota/kabupaten hasil GPS. Titik publik dibulatkan, bukan posisi rumah tepat. Pilih Tampil di peta hanya saat siap dihubungi. GPS dapat dipalsukan; batas wilayah bukan jaminan keamanan. Peta web memakai OpenStreetMap, yang menerima IP dan permintaan tile area peta.",
  },
  {
    title: "Nomor dan izin kontak",
    body: contactPrivacyNotice,
  },
  {
    title: "Pekerjaan dan upah COD",
    body: "Sepakati tugas, alat, durasi, lokasi dan total upah sebelum bekerja. COD dibayar langsung, tanpa escrow atau jaminan pembayaran. Konfirmasi uang diterima hanya setelah uang berada di tanganmu.",
  },
  {
    title: "Rating dan ulasan",
    body: "Peserta pekerjaan yang sudah selesai dapat memberi satu penilaian untuk pihak lain. Nilai dipisahkan menurut peran saat pekerjaan berlangsung. Ulasan dipublikasikan setelah dikirim; penilaian bukan verifikasi identitas atau jaminan keamanan. Laporkan akun terkait jika ada penyalahgunaan.",
  },
  {
    title: "Privasi dan ketentuan",
    body: privacyNotice,
  },
  {
    title: "Laporkan masalah",
    body: "Lapor atau blokir melalui profil akun terkait. Form laporan bukan layanan darurat. Dalam bahaya langsung, menjauh dan hubungi layanan darurat setempat. Penanganan operator belum diaktifkan untuk peluncuran publik.",
  },
];
export default function Help() {
  const state = useSession();
  const [open, setOpen] = useState<number | null>(null);
  return (
    <Page title="Bantuan dan laporan" back form>
      <Icon name="help_outline" />
      <Text variant="headlineMedium">Ada yang ingin ditanyakan?</Text>
      {topics.map((topic, i) => (
        <MenuRow
          key={topic.title}
          label={topic.title}
          icon="help_outline"
          onPress={() => setOpen(i)}
        />
      ))}
      <MenuRow
        label="Katalog pekerjaan"
        icon="work"
        onPress={() => router.push("/job-catalog")}
      />
      {(state.demo || state.session) && (
        <MenuRow
          label="Lihat pengenalan aplikasi"
          icon="info"
          onPress={() => router.push({ pathname: "/intro-preview" })}
        />
      )}
      <Note>
        Kebijakan dan bantuan operasional belum final. Belum untuk rilis publik.
      </Note>
      <Sheet
        visible={open !== null}
        title={open !== null ? topics[open]!.title : ""}
        onClose={() => setOpen(null)}
      >
        <Text style={s.body}>{open !== null ? topics[open]!.body : ""}</Text>
      </Sheet>
    </Page>
  );
}
