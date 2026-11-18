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
  return (
    <Page title="Penghapusan akun" back form>
      <Text variant="titleLarge">Ajukan penghapusan?</Text>
      <Text style={s.body}>
        Penanda peta dimatikan dan izin kontak dicabut. Data belum langsung
        dihapus; permintaan memerlukan penanganan operator.
      </Text>
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
