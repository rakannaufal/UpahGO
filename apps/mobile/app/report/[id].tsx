import React, { useState } from "react";
import { Text } from "react-native-paper";
import { useLocalSearchParams } from "expo-router";
import { useSession } from "../../src/session";
import {
  Action,
  AccountGate,
  Choices as RadioButton,
  Field,
  Note,
  Page,
  Panel,
  s,
  useTask,
} from "../../src/ui";
export default function Report() {
  return (
    <AccountGate requireProfile>
      <Content />
    </AccountGate>
  );
}
function Content() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useSession();
  const task = useTask();
  const [category, setCategory] = useState("other");
  const [detail, setDetail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <Page title="Laporkan akun" back form>
      {sent ? (
        <Panel>
          <Text variant="titleLarge">
            {state.demo ? "Laporan simulasi tercatat" : "Laporan tersimpan"}
          </Text>
          <Text style={s.body}>
            Penanganan operator belum aktif pada versi ini.
          </Text>
        </Panel>
      ) : (
        <>
          <Note>Dalam bahaya, hubungi layanan darurat setempat.</Note>
          <RadioButton.Group value={category} onValueChange={setCategory}>
            {[
              { value: "harassment", label: "Pelecehan / gangguan" },
              { value: "unsafe_work", label: "Pekerjaan tidak aman" },
              { value: "unpaid", label: "Upah belum dibayar" },
              { value: "other", label: "Masalah lain" },
            ].map((x) => (
              <RadioButton.Item
                key={x.value}
                {...x}
                style={{ minHeight: 56 }}
              />
            ))}
          </RadioButton.Group>
          <Field
            label="Apa yang terjadi?"
            value={detail}
            onChangeText={setDetail}
            multiline
            numberOfLines={6}
            maxLength={1000}
          />
          <Text style={s.small}>
            10–1000 karakter. Jangan kirim OTP, nomor identitas, atau data
            sensitif lain.
          </Text>
          {!!task.error && <Note error>{task.error}</Note>}
          <Action
            busy={task.busy}
            onPress={() =>
              void task.run(async () => {
                await state.api.call("report", {
                  targetId: id,
                  category,
                  detail,
                });
                setSent(true);
              })
            }
          >
            Kirim laporan
          </Action>
        </>
      )}
    </Page>
  );
}
