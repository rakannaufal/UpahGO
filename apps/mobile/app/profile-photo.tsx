import React, { useState } from "react";
import { Image, View } from "react-native";
import { Text } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import {
  AccountGate,
  Page,
  Action,
  TextButton as Button,
  Consent,
  Note,
  LoadState,
  s,
  useLoad,
  useTask,
  Sheet,
} from "../src/ui";
import { useSession } from "../src/session";
import { photoRequest, readPhoto } from "../src/photos";
import { ProfileIdentity } from "../src/ActivityMedia";
import { useDraftGuard } from "../src/useDraftGuard";
export default function ProfilePhoto() {
  return (
    <AccountGate requireProfile>
      <Content />
    </AccountGate>
  );
}
function Content() {
  const state = useSession();
  const profile = state.data!.profile!;
  const role = state.data!.account.role!;
  const task = useTask();
  const [draft, setDraft] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [info, setInfo] = useState("");
  const [removeOpen, setRemoveOpen] = useState(false);
  const guard = useDraftGuard(!!draft);
  const load = useLoad(
    () =>
      profile.photoStatus
        ? readPhoto(state.api, profile.id, role, true)
        : Promise.resolve(null),
    [state.api, profile.id, role, profile.photoStatus],
  );
  const saveImage = async (
    context: ReturnType<typeof ImageManipulator.manipulate>,
  ) => {
    const image = await context.renderAsync();
    try {
      const result = await image.saveAsync({
        base64: true,
        format: SaveFormat.JPEG,
        compress: 0.82,
      });
      if (!result.base64 || result.base64.length > (5 * 1024 * 1024 * 4) / 3)
        throw new Error("PHOTO_INVALID");
      setDraft("data:image/jpeg;base64," + result.base64);
      setConsent(false);
      setInfo("");
    } finally {
      image.release();
      context.release();
    }
  };
  return (
    <Page title={role === "worker" ? "Foto profil" : "Foto tempat"} back form>
      <View style={{ alignItems: "center", paddingVertical: 16 }}>
        {draft || load.value ? (
          <Image
            accessibilityLabel="Pratinjau foto"
            source={{ uri: draft ?? load.value! }}
            resizeMode="contain"
            style={{
              width: "100%",
              maxWidth: 360,
              aspectRatio: 1,
              borderRadius: 24,
            }}
          />
        ) : (
          <ProfileIdentity role={role} size={96} />
        )}
      </View>
      <LoadState {...load} />
      {profile.photoStatus && (
        <Text style={s.body}>
          {profile.photoStatus === "pending"
            ? "Menunggu peninjauan. Belum tampil publik."
            : profile.photoStatus === "rejected"
              ? "Foto tidak disetujui. Pilih foto lain."
              : "Foto tampil pada profil publik."}
        </Text>
      )}
      <Action
        secondary
        busy={task.busy}
        onPress={() =>
          void task.run(async () => {
            const picked = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 1,
              exif: false,
              allowsMultipleSelection: false,
            });
            if (picked.canceled) return;
            const asset = picked.assets[0]!;
            if (
              (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) ||
              !asset.width ||
              !asset.height ||
              asset.width * asset.height > 12000000
            )
              throw new Error("PHOTO_INVALID");
            const context = ImageManipulator.manipulate(asset.uri);
            context.resize(
              asset.width >= asset.height
                ? { width: Math.min(1280, asset.width) }
                : { height: Math.min(1280, asset.height) },
            );
            await saveImage(context);
          })
        }
      >
        {draft || profile.photoStatus ? "Ganti foto" : "Pilih dari galeri"}
      </Action>
      {draft && (
        <>
          <Button
            disabled={task.busy}
            onPress={() =>
              void task.run(async () => {
                const context = ImageManipulator.manipulate(draft);
                const image = await context.renderAsync();
                const side = Math.min(image.width, image.height);
                context.crop({
                  originX: Math.floor((image.width - side) / 2),
                  originY: Math.floor((image.height - side) / 2),
                  width: side,
                  height: side,
                });
                image.release();
                await saveImage(context);
              })
            }
          >
            Potong persegi dari tengah
          </Button>
          <Text style={s.small}>
            Gunakan foto milikmu. Hindari wajah orang lain, alamat, nomor rumah
            dan pelat kendaraan.
          </Text>
          <Consent
            checked={consent}
            disabled={task.busy}
            onChange={() => setConsent(!consent)}
            label="Saya berhak memakai foto ini dan mengizinkan tampil publik setelah disetujui."
          />
          <Action
            disabled={!consent}
            busy={task.busy}
            onPress={() =>
              void task.run(async () => {
                await photoRequest(
                  state.api,
                  "POST",
                  "",
                  draft.split(",")[1],
                  profile.id,
                );
                setDraft(null);
                setConsent(false);
                await state.refresh();
                load.reload();
                setInfo(
                  state.demo
                    ? "Simulasi foto tersimpan di memori. Tidak diunggah atau tampil publik."
                    : "Foto dikirim untuk peninjauan. Belum tampil publik.",
                );
              })
            }
          >
            Kirim foto
          </Action>
          <Button
            disabled={task.busy}
            onPress={() => {
              setDraft(null);
              setConsent(false);
            }}
          >
            Batalkan foto baru
          </Button>
        </>
      )}
      {!!profile.photoStatus && !draft && (
        <Button disabled={task.busy} onPress={() => setRemoveOpen(true)}>
          Hapus foto
        </Button>
      )}
      <Text style={s.small}>
        Foto opsional. Gambar aktivitas pada kartu tetap digunakan. Peninjauan
        operasional belum dibuka untuk rilis publik.
      </Text>
      {!!info && <Note>{info}</Note>}
      {!!task.error && !removeOpen && <Note error>{task.error}</Note>}
      <Sheet
        visible={removeOpen}
        title="Hapus foto?"
        onClose={() => setRemoveOpen(false)}
      >
        <Text style={s.body}>
          Foto hilang dari profil. Tautan sementara yang sudah dibuka dapat
          berlaku hingga 60 detik. Penghapusan salinan server diproses terpisah.
        </Text>
        <Action
          busy={task.busy}
          onPress={() =>
            void task.run(async () => {
              await photoRequest(
                state.api,
                "DELETE",
                "",
                undefined,
                profile.id,
              );
              await state.refresh();
              load.reload();
              setRemoveOpen(false);
              setInfo(
                state.demo
                  ? "Simulasi foto dihapus dari memori."
                  : "Foto dihapus dari profil. Penghapusan salinan server masuk antrean.",
              );
            })
          }
        >
          Hapus foto dari profil
        </Action>
        <Button disabled={task.busy} onPress={() => setRemoveOpen(false)}>
          Batal
        </Button>
        {!!task.error && <Note error>{task.error}</Note>}
      </Sheet>
      {guard.prompt}
    </Page>
  );
}
