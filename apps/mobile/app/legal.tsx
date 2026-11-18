import React from "react";
import { Text } from "react-native-paper";
import { Icon, Note, Page, s } from "../src/ui";
import { contactPrivacyNotice, privacyNotice } from "../src/help-content";

export default function Legal() {
  return (
    <Page title="Ketentuan dan privasi" back form>
      <Icon name="description" />
      <Note>
        Informasi versi pengujian lokal. Kebijakan publik belum final.
      </Note>
      <Text style={s.section}>Penggunaan dan data</Text>
      <Text style={s.body}>{privacyNotice}</Text>
      <Text style={s.section}>Izin kontak</Text>
      <Text style={s.body}>{contactPrivacyNotice}</Text>
      <Text style={s.section}>Lokasi dan foto</Text>
      <Text style={s.body}>
        Lokasi dipakai saat aplikasi digunakan untuk mencari dalam radius dan
        kota/kabupaten hasil GPS. Titik publik merupakan lokasi perkiraan. Foto
        profil atau tempat bersifat opsional dan memerlukan persetujuan sebelum
        dikirim untuk peninjauan.
      </Text>
      <Text style={s.section}>Pekerjaan dan pembayaran</Text>
      <Text style={s.body}>
        Sepakati tugas dan upah sebelum bekerja. Pembayaran tunai dilakukan
        langsung, tanpa escrow atau jaminan pembayaran. Konfirmasi hasil selesai
        terpisah dari pengakuan uang diterima.
      </Text>
      <Text style={s.section}>Penghapusan akun</Text>
      <Text style={s.body}>
        Permintaan penghapusan membatasi akun, mematikan penanda peta, dan
        mencabut izin kontak. Data belum langsung dihapus; penanganan operator
        masih diperlukan.
      </Text>
    </Page>
  );
}
