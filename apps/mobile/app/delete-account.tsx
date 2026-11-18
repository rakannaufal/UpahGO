import React, { useState } from "react";
import { Text } from "react-native-paper";
import { useSession } from "../src/session";
import {
  AccountGate,
  Action,
  Consent,
  Note,
  Page,
  s,
  useTask,
} from "../src/ui";
export default function Deletion() {
  return (
    <AccountGate>
      <Content />
    </AccountGate>
  );
}
function Content() {
  const state = useSession();
  const task = useTask();
  const [consent, setConsent] = useState(false);
  const policy = state.data?.deletionPolicy;
  return (
    <Page title="Penghapusan akun" back form>
      <Text variant="titleLarge">Ajukan penghapusan?</Text>
      <Text style={s.body}>
        Akun dibatasi, penanda peta dimatikan, dan izin kontak dicabut.
        Identitas, lokasi, foto, dan akses masuk diproses untuk dihapus. Catatan
        kerja dan pembayaran milik kedua pihak tetap dilindungi.
      </Text>
      <Note>
        {state.demo
          ? "Ini simulasi. Tidak ada akun atau data nyata yang dihapus."
          : policy?.enabled
            ? `Rincian kerja dan komentar ulasan dapat disimpan ${policy.workDays} hari, laporan ${policy.reportDays} hari. Penahanan bukti sengketa dapat memperpanjang retensi. Catatan transaksi minimum tetap ada di riwayat peserta lain. Salinan backup menunggu kedaluwarsa hingga ${policy.backupDays} hari. Permintaan belum berarti semua data terhapus.`
            : "Pemrosesan penghapusan produksi belum diaktifkan. Kebijakan retensi masih memerlukan peninjauan; permintaan belum berarti data sudah terhapus."}
      </Note>
      <Consent
        checked={consent}
        onChange={() => setConsent(!consent)}
        label="Saya memahami akibat permintaan ini."
      />
      <Action
        disabled={!consent}
        busy={task.busy}
        onPress={() =>
          void task.run(async () => {
            await state.api.call("request_deletion", { confirm: true });
            await state.refresh();
          })
        }
      >
        Ajukan penghapusan
      </Action>
      {!!task.error && <Note error>{task.error}</Note>}
    </Page>
  );
}
