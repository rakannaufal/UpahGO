import React, { useState } from "react";
import { Text } from "react-native-paper";
import { useLocalSearchParams } from "expo-router";
import { useSession } from "../../src/session";
import {
  Action,
  AccountGate,
  LoadState,
  Note,
  Page,
  Panel,
  s,
  useLoad,
  useTask,
  DetailRow,
  Icon,
} from "../../src/ui";
import { agreementLabel } from "../../src/labels";
import { AgreementRating } from "../../src/Rating";
import { WorkContextSummary } from "../../src/WorkDetails";
import {
  canTransitionAgreement,
  formatWage,
} from "../../../../shared/contracts";
export default function Agreement() {
  return (
    <AccountGate requireProfile>
      <AgreementDetail />
    </AccountGate>
  );
}
function AgreementDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useSession();
  const task = useTask();
  const [pending, setPending] = useState("");
  const load = useLoad(
    () => state.api.call("agreement", { id }),
    [state.api, id, state.data!.account.id],
  );
  const g = load.value;
  const labels: Record<string, string> = {
    accept: "Setujui pekerjaan",
    cancel: "Batalkan pekerjaan",
    request_completion: "Ajukan pekerjaan selesai",
    confirm_completion: "Konfirmasi hasil selesai",
    acknowledge_payment: "Uang tunai sudah diterima",
  };
  return (
    <Page title="Kesepakatan kerja" back form>
      <LoadState {...load} />
      {g && (
        <>
          <Panel>
            <Icon name="description" />
            <Text variant="headlineSmall">{g.title}</Text>
            <Text style={s.body}>{agreementLabel[g.status]}</Text>
            <DetailRow label="Buruh" value={g.workerName} icon="person" />
            <DetailRow
              label="Penyedia kerja"
              value={g.employerName}
              icon="home"
            />
            <Text variant="headlineMedium">{formatWage(g.wage)}</Text>
            <Text style={s.small}>Total upah · Tunai di tempat</Text>
            <Text style={s.body}>{g.tasks}</Text>
            {g.workContext && <WorkContextSummary value={g.workContext} />}
            <Text style={s.body}>
              {new Intl.DateTimeFormat("id-ID", {
                dateStyle: "full",
                timeStyle: "short",
                timeZone: g.timezone,
              }).format(new Date(g.startsAt))}{" "}
              ({g.timezone})
            </Text>
          </Panel>
          <Note>
            {g.paymentReceivedAt
              ? `Pekerja mencatat uang diterima pada ${new Date(g.paymentReceivedAt).toLocaleString("id-ID")}.`
              : "Belum ada pengakuan uang diterima. Status pekerjaan selesai tidak berarti upah sudah dibayar."}
          </Note>
          {Object.entries(labels)
            .filter(([action]) =>
              canTransitionAgreement(g, state.data!.profile!.id, action),
            )
            .map(([action, label]) => (
              <Action
                key={action}
                secondary={action === "cancel"}
                onPress={() => setPending(action)}
              >
                {label}
              </Action>
            ))}
          {g.status === "completed" && <AgreementRating agreement={g} />}
          {pending && (
            <Panel>
              <Text variant="titleLarge">{labels[pending]}?</Text>
              <Text style={s.body}>
                {pending === "acknowledge_payment"
                  ? "Konfirmasi hanya setelah uang tunai benar-benar diterima."
                  : pending === "accept"
                    ? "Pastikan tugas, jadwal dan upah sudah sesuai."
                    : "Pastikan tindakan ini sesuai kondisi pekerjaan sebenarnya."}
              </Text>
              <Action
                busy={task.busy}
                onPress={() =>
                  void task.run(async () => {
                    await state.api.call("agreement_action", {
                      id,
                      action: pending,
                    });
                    setPending("");
                    load.reload();
                  })
                }
              >
                Konfirmasi
              </Action>
              <Action secondary onPress={() => setPending("")}>
                Kembali
              </Action>
            </Panel>
          )}
        </>
      )}
      {!!task.error && <Note error>{task.error}</Note>}
    </Page>
  );
}
