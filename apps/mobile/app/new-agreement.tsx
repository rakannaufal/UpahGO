import React, { useState } from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import { useSession } from "../src/session";
import {
  AccountGate,
  Action,
  Choices,
  Field,
  LoadState,
  Note,
  Page,
  s,
  useLoad,
  useTask,
  Panel,
  Icon,
} from "../src/ui";
import { SchedulePicker } from "../src/SchedulePicker";
import {
  scheduleIso,
  formatWage,
  parsePriceAmount,
} from "../../../shared/contracts";
import { validateWorkContext, type WorkContext } from "../../../shared/jobs";
import { WorkContextFields, WorkContextSummary } from "../src/WorkDetails";
import { useDraftGuard } from "../src/useDraftGuard";
import { MoneyField, ProfilePrice } from "../src/ProfilePresentation";
export default function NewAgreement() {
  return (
    <AccountGate requireProfile>
      <Content />
    </AccountGate>
  );
}
function Content() {
  const { contactId, intent } = useLocalSearchParams<{
    contactId: string;
    intent?: string;
  }>();
  const state = useSession();
  const task = useTask();
  const [title, setTitle] = useState("");
  const [tasks, setTasks] = useState("");
  const [wage, setWage] = useState("");
  const [date, setDate] = useState("");
  const [workContext, setWorkContext] = useState<WorkContext | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [offerStep, setOfferStep] = useState<"edit" | "review" | "done">(
    intent === "negotiate" ? "edit" : "done",
  );
  const [offerNote, setOfferNote] = useState("");
  const [time, setTime] = useState("09:00");
  const [zone, setZone] = useState(
    state.data!.areas.find((a) => a.id === state.data!.profile!.areaId)
      ?.timezone ?? "Asia/Jakarta",
  );
  const draft = useDraftGuard(
    !!(title || tasks || wage || date || workContext || offerNote),
  );
  const load = useLoad(async () => {
    const c = (await state.api.call("contacts")).find(
      (c) =>
        c.id === contactId &&
        c.status === "accepted" &&
        Date.parse(c.expiresAt) > Date.now(),
    );
    if (!c) throw new Error("UNAVAILABLE");
    return c;
  }, [state.api, contactId, state.data!.account.id]);
  const priceLoad = useLoad(async () => {
    if (intent !== "negotiate" || !load.value) return null;
    const contact = load.value;
    const incoming = contact.receiverId === state.data!.account.id;
    return state.api.call("profile", {
      id: incoming ? contact.senderId : contact.receiverId,
      role: incoming ? contact.senderRole : contact.receiverRole,
    });
  }, [state.api, contactId, intent, load.value?.id, state.data!.account.id]);
  const otherName =
    load.value?.receiverId === state.data!.account.id
      ? load.value?.senderName
      : load.value?.receiverName;
  const offerFooter = load.value && offerStep !== "done" && (
    <>
      {offerStep === "edit" ? (
        <Action
          busy={task.busy}
          onPress={() =>
            void task.run(async () => {
              parsePriceAmount(wage);
              setOfferStep("review");
            })
          }
        >
          Tinjau usulan
        </Action>
      ) : (
        <>
          <Action
            onPress={() => {
              if (!tasks) setTasks(offerNote);
              setOfferStep("done");
            }}
          >
            Lanjut ke rincian kerja
          </Action>
          <Action secondary onPress={() => setOfferStep("edit")}>
            Edit usulan
          </Action>
        </>
      )}
      {!!task.error && <Note error>{task.error}</Note>}
    </>
  );
  return (
    <Page
      title={
        offerStep === "done"
          ? "Buat kesepakatan"
          : offerStep === "review"
            ? "Tinjau usulan"
            : "Usulkan upah"
      }
      back
      form
      footer={offerFooter}
    >
      <LoadState {...load} />
      {load.value && offerStep !== "done" && (
        <>
          <Text variant="headlineSmall" style={s.heading}>
            {offerStep === "review" ? "Periksa sebelum lanjut" : otherName}
          </Text>
          {offerStep === "edit" ? (
            <>
              <Note>
                Izin kontak disetujui. Persetujuan harga dan pekerjaan tetap
                langkah terpisah.
              </Note>
              {priceLoad.value && (
                <Panel>
                  <ProfilePrice person={priceLoad.value} />
                </Panel>
              )}
              {priceLoad.loading && (
                <Text style={s.small}>Memuat harga awal…</Text>
              )}
              {!!priceLoad.error && (
                <>
                  <Note error>
                    Harga awal belum dapat dimuat. Isi usulanmu atau coba muat
                    kembali.
                  </Note>
                  <Action secondary onPress={priceLoad.reload}>
                    Muat ulang harga
                  </Action>
                </>
              )}
              <MoneyField
                label="Total upah yang diusulkan (Rp)"
                value={wage}
                onChangeText={(value) => {
                  setWage(value);
                  task.setError("");
                }}
              />
              <Text style={s.small}>
                Total per pekerjaan/sesi. Isi Rp1.000–Rp50.000.000.
              </Text>
              <View style={{ gap: 2 }}>
                <Text style={s.small}>Catatan usulan (opsional)</Text>
                <Field
                  accessibilityLabel="Catatan usulan (opsional)"
                  value={offerNote}
                  onChangeText={setOfferNote}
                  maxLength={500}
                  multiline
                />
              </View>
              <Text style={s.small}>
                Ini baru usulan. Rincian tugas, jadwal, dan nominal akhir harus
                diterima kedua pihak sebelum bekerja.
              </Text>
            </>
          ) : (
            <>
              <Panel>
                <Text style={s.small}>Dengan {otherName}</Text>
                <Text variant="headlineSmall">{formatWage(Number(wage))}</Text>
                <Text style={s.small}>Total per pekerjaan/sesi</Text>
                {!!offerNote && <Text style={s.body}>{offerNote}</Text>}
              </Panel>
              <Note>
                Usulan belum dikirim. Lengkapi tugas dan jadwal, lalu tinjau
                kesepakatan sebelum mengirim.
              </Note>
            </>
          )}
        </>
      )}
      {load.value && offerStep === "done" && !reviewing && (
        <>
          <Icon name="description" />
          <Field
            label="Judul pekerjaan"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
          <Text style={s.section}>Kondisi kerja</Text>
          <WorkContextFields
            value={workContext}
            onChange={setWorkContext}
            tags={[]}
          />
          <Field
            label="Tugas dan batas pekerjaan"
            value={tasks}
            onChangeText={setTasks}
            multiline
            maxLength={1000}
          />
          <MoneyField
            label="Total upah tunai (Rp)"
            value={wage}
            onChangeText={(value) => {
              setWage(value);
              task.setError("");
            }}
          />
          <Text style={s.small}>
            Total per pekerjaan/sesi. Nominal masih berupa usulan sampai
            diterima pihak lain.
          </Text>
          <Text style={s.section}>Jadwal</Text>
          <SchedulePicker
            date={date}
            time={time}
            zone={zone}
            onDate={setDate}
            onTime={setTime}
          />
          <Choices.Group value={zone} onValueChange={setZone}>
            {[
              { value: "Asia/Jakarta", label: "WIB" },
              { value: "Asia/Makassar", label: "WITA" },
              { value: "Asia/Jayapura", label: "WIT" },
            ].map((z) => (
              <Choices.Item key={z.value} {...z} />
            ))}
          </Choices.Group>
          <Text style={s.small}>
            Sepakati alat, bahan, durasi dan alamat sebelum bekerja.
          </Text>
          <Action
            busy={task.busy}
            onPress={() =>
              void task.run(async () => {
                const startsAt = scheduleIso(date, time, zone);
                parsePriceAmount(wage);
                if (
                  title.trim().length < 3 ||
                  tasks.trim().length < 10 ||
                  !Number.isInteger(Number(wage)) ||
                  Number(wage) < 1000 ||
                  Number(wage) > 50000000 ||
                  Date.parse(startsAt) <= Date.now()
                )
                  throw new Error("AGREEMENT_INVALID");
                validateWorkContext(workContext);
                setReviewing(true);
              })
            }
          >
            Tinjau kesepakatan
          </Action>
        </>
      )}
      {load.value && reviewing && (
        <>
          <Panel>
            <Text variant="headlineSmall" style={s.heading}>
              {title}
            </Text>
            <Text style={s.body}>{tasks}</Text>
            <Text style={s.section}>{formatWage(Number(wage))}</Text>
            <Text style={s.small}>Total upah tunai di tempat</Text>
            <Text style={s.body}>
              {date} · {time} ({zone})
            </Text>
            {workContext && <WorkContextSummary value={workContext} />}
          </Panel>
          <Action
            busy={task.busy}
            onPress={() =>
              void task.run(async () => {
                const g = await state.api.call("create_agreement", {
                  contactId,
                  title,
                  tasks,
                  wage: Number(wage),
                  startsAt: scheduleIso(date, time, zone),
                  timezone: zone,
                  workContext,
                });
                draft.proceed(() =>
                  router.replace({
                    pathname: "/agreement/[id]",
                    params: { id: g.id },
                  }),
                );
              })
            }
          >
            Kirim kesepakatan
          </Action>
          <Action
            secondary
            disabled={task.busy}
            onPress={() => setReviewing(false)}
          >
            Edit rincian
          </Action>
        </>
      )}
      {offerStep === "done" && !!task.error && <Note error>{task.error}</Note>}
      {draft.prompt}
    </Page>
  );
}
