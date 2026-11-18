import React from "react";
import { Linking } from "react-native";
import { Text } from "react-native-paper";
import { Icon, Note, Page, Panel, TextButton, s, useTask } from "../src/ui";

export default function Attribution() {
  const task = useTask();
  const open = (url: string) =>
    void task.run(async () => {
      try {
        await Linking.openURL(url);
      } catch {
        throw new Error(
          "Tautan belum bisa dibuka. Periksa koneksi dan coba lagi.",
        );
      }
    });
  return (
    <Page title="Atribusi data" back form>
      <Icon name="map" />
      <Text style={s.body}>
        Sumber peta, batas wilayah, dan aset yang digunakan Upahgo.
      </Text>
      <Panel>
        <Text variant="titleLarge">OpenStreetMap</Text>
        <Text style={s.body}>
          © OpenStreetMap contributors. Data peta dan batas Kota Pekanbaru
          berlisensi ODbL 1.0. Batas wilayah berasal dari relation 16563796,
          diambil 17 November 2026 melalui Nominatim. Data ini bukan batas resmi
          pemerintah.
        </Text>
        <TextButton
          disabled={task.busy}
          onPress={() => open("https://www.openstreetmap.org/copyright")}
        >
          Lisensi OpenStreetMap
        </TextButton>
        <TextButton
          disabled={task.busy}
          onPress={() =>
            open("https://www.openstreetmap.org/relation/16563796")
          }
        >
          Sumber batas Pekanbaru
        </TextButton>
      </Panel>
      <Panel>
        <Text variant="titleLarge">Leaflet</Text>
        <Text style={s.body}>
          Peta preview web memakai Leaflet, berlisensi BSD 2-Clause. Atribusi
          penyedia data tetap tampil pada peta.
        </Text>
        <TextButton
          disabled={task.busy}
          onPress={() =>
            open("https://github.com/Leaflet/Leaflet/blob/v1.9.4/LICENSE")
          }
        >
          Lisensi Leaflet
        </TextButton>
      </Panel>
      <Panel>
        <Text variant="titleLarge">Ilustrasi dan ikon</Text>
        <Text style={s.body}>
          Ilustrasi Job Hunt dan Hiring oleh Katerina Limpitsouni melalui
          unDraw, dengan penyesuaian aksen. Ikon kontrol dan objek Ceria dibuat
          untuk proyek Upahgo; sebagian kontrol memakai Google Material Symbols
          (Apache 2.0). Lockup memakai Roboto (OFL 1.1). Google G digunakan
          untuk autentikasi Google.
        </Text>
        <TextButton
          disabled={task.busy}
          onPress={() => open("https://undraw.co/license")}
        >
          Lisensi ilustrasi unDraw
        </TextButton>
        <TextButton
          disabled={task.busy}
          onPress={() =>
            open(
              "https://github.com/google/material-design-icons/blob/master/LICENSE",
            )
          }
        >
          Lisensi Material Symbols
        </TextButton>
        <TextButton
          disabled={task.busy}
          onPress={() =>
            open("https://github.com/google/fonts/blob/main/ofl/roboto/OFL.txt")
          }
        >
          Lisensi Roboto
        </TextButton>
      </Panel>
      <Note>
        Profil, aktivitas, dan ulasan pada demo adalah data sintetis. Direktori
        wilayah live belum diprovisi.
      </Note>
      {!!task.error && <Note error>{task.error}</Note>}
    </Page>
  );
}
