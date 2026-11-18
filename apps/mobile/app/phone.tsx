import React, { useState } from "react";
import { Text } from "react-native-paper";
import { useSession } from "../src/session";
import { supabase } from "../src/auth";
import { normalizePhone } from "../../../shared/contracts";
import {
  AccountGate,
  Action,
  Field,
  Icon,
  Note,
  Page,
  s,
  useTask,
} from "../src/ui";
export default function Phone() {
  return (
    <AccountGate requireProfile>
      <Content />
    </AccountGate>
  );
}
function Content() {
  const state = useSession();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [info, setInfo] = useState("");
  const task = useTask();
  const ready = state.data!.profile!.whatsappReady;
  return (
    <Page title="Nomor WhatsApp" back form>
      <Icon name="person_add" />
      <Text style={s.body}>
        {ready
          ? "Nomor terverifikasi"
          : "Verifikasi nomor untuk berbagi kontak."}
      </Text>
      {state.demo ? (
        <>
          <Note>Verifikasi simulasi. Tidak ada SMS dikirim.</Note>
          <Action disabled={ready} onPress={() => void state.verifyDemoPhone()}>
            Simulasikan verifikasi
          </Action>
        </>
      ) : (
        <>
          <Field
            label="Nomor WhatsApp"
            value={phone}
            onChangeText={(v) => {
              setPhone(v);
              setSent(false);
              setOtp("");
              setInfo("");
            }}
            keyboardType="phone-pad"
            autoComplete="tel"
            maxLength={18}
          />
          <Action
            secondary
            busy={task.busy}
            onPress={() =>
              void task.run(async () => {
                if (!supabase) throw new Error("GATEWAY_NOT_CONFIGURED");
                const { error } = await supabase.auth.updateUser({
                  phone: normalizePhone(phone),
                });
                if (error) throw new Error("NETWORK_ERROR");
                setSent(true);
                setInfo("Kode SMS dikirim.");
              })
            }
          >
            {sent ? "Kirim ulang kode" : "Kirim kode SMS"}
          </Action>
          {sent && (
            <>
              <Field
                label="Kode SMS"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                autoComplete="sms-otp"
                maxLength={8}
              />
              <Action
                busy={task.busy}
                onPress={() =>
                  void task.run(async () => {
                    if (!supabase) throw new Error("GATEWAY_NOT_CONFIGURED");
                    const { error } = await supabase.auth.verifyOtp({
                      phone: normalizePhone(phone),
                      token: otp,
                      type: "phone_change",
                    });
                    if (error) throw new Error("PHONE_INVALID");
                    setOtp("");
                    setSent(false);
                    setInfo("Nomor berhasil diverifikasi.");
                    await state.refresh();
                  })
                }
              >
                Verifikasi nomor
              </Action>
            </>
          )}
          <Text style={s.small}>
            Gunakan nomor WhatsApp milikmu. Jangan bagikan kode SMS.
          </Text>
        </>
      )}
      {!!info && <Note>{info}</Note>}
      {!!task.error && <Note error>{task.error}</Note>}
    </Page>
  );
}
