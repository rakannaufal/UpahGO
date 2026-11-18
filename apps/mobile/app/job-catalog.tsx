import React, { useState } from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { router } from "expo-router";
import {
  jobs,
  categories,
  effortLabels,
  validateJobSuggestion,
  type WorkContext,
} from "../../../shared/jobs";
import {
  Page,
  Icon,
  Field,
  SearchField,
  TextButton as Button,
  MenuRow,
  Choices,
  Sheet,
  Action,
  Note,
  s,
  useTask,
  useLoad,
} from "../src/ui";
import { useSession } from "../src/session";
import { WorkContextFields } from "../src/WorkDetails";
import { c } from "../src/theme";
import { activityIcon } from "../src/ActivityMedia";
export default function JobCatalog() {
  const state = useSession();
  const task = useTask();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [pagination, setPagination] = useState({ key: "", limit: 24 });
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [context, setContext] = useState<WorkContext | null>(null);
  const [receipt, setReceipt] = useState("");
  const available = jobs.filter(
    (j) =>
      (!category || j.categoryId === category) &&
      `${j.label} ${j.aliases}`.toLowerCase().includes(query.toLowerCase()),
  );
  const key = query + ":" + category;
  const limit = pagination.key === key ? pagination.limit : 24;
  const load = useLoad(
    () =>
      state.data ? state.api.call("job_suggestions") : Promise.resolve([]),
    [state.api, state.data?.account.id],
  );
  return (
    <Page title="Katalog pekerjaan" back form>
      <Icon name="work" />
      <SearchField
        label="Cari jenis pekerjaan"
        value={query}
        onChangeText={setQuery}
        maxLength={80}
      />
      <Button mode="outlined" onPress={() => setCategoryOpen(true)}>
        {categories.find((c) => c.id === category)?.label ?? "Semua kategori"}
      </Button>
      <Sheet
        visible={categoryOpen}
        title="Kategori pekerjaan"
        onClose={() => setCategoryOpen(false)}
      >
        <Choices.Group
          value={category}
          onValueChange={(value) => {
            setCategory(value);
            setCategoryOpen(false);
          }}
        >
          <Choices.Item value="" label="Semua kategori" />
          {categories.map((c) => (
            <Choices.Item key={c.id} value={c.id} label={c.label} />
          ))}
        </Choices.Group>
      </Sheet>
      <Text style={s.small}>
        Baseline tenaga mengikuti kondisi tugas. Katalog rencana bukan daftar
        layanan aktif.
      </Text>
      {available.slice(0, limit).map((j) => (
        <View
          key={j.id}
          style={{
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderColor: c.outlineVariant,
            gap: 16,
            flexDirection: "row",
            alignItems: "flex-start",
          }}
        >
          <Icon name={activityIcon(j.id)} />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={[s.body, { fontWeight: "700" }]}>{j.label}</Text>
            <Text style={s.small}>
              {(state.demo ? j.demoEnabled : j.enabled)
                ? "Tersedia"
                : "Belum aktif"}{" "}
              · {j.baseline.map((e) => effortLabels[e as "light"]).join(" / ")}
            </Text>
            <Text style={s.small}>{j.contextHint}</Text>
          </View>
        </View>
      ))}
      {available.length > limit && (
        <Button onPress={() => setPagination({ key, limit: limit + 24 })}>
          Muat jenis berikutnya
        </Button>
      )}
      {!available.length && <Text style={s.body}>Jenis belum ditemukan.</Text>}
      <MenuRow
        label="Lainnya · Usulkan pekerjaan"
        icon="edit"
        detail="Disimpan untuk peninjauan, belum menjadi layanan aktif."
        onPress={() => (state.data ? setOpen(true) : router.push("/"))}
      />
      {!!load.value?.length && (
        <>
          <Text style={s.section}>Usulanmu</Text>
          {load.value.map((suggestion) => (
            <View key={suggestion.id} style={{ gap: 4 }}>
              <Text style={s.body}>{suggestion.title}</Text>
              <Text style={s.small}>
                Menunggu peninjauan ·{" "}
                {new Date(suggestion.createdAt).toLocaleDateString("id-ID")}
              </Text>
            </View>
          ))}
        </>
      )}
      <Sheet
        visible={open}
        title="Usulkan pekerjaan"
        onClose={() => setOpen(false)}
      >
        {receipt ? (
          <>
            <Note>
              Usulan tersimpan. Belum menjadi layanan aktif; operasional
              peninjauan belum dibuka.
            </Note>
            <Text selectable style={s.small}>
              Nomor usulan: {receipt}
            </Text>
            <Button onPress={() => setOpen(false)}>Tutup usulan</Button>
          </>
        ) : (
          <>
            <Field
              label="Nama pekerjaan"
              value={title}
              maxLength={80}
              onChangeText={setTitle}
            />
            <Field
              label="Rincian tugas"
              value={detail}
              maxLength={1000}
              multiline
              onChangeText={setDetail}
            />
            <WorkContextFields
              value={context}
              onChange={setContext}
              tags={[]}
            />
            <Text style={s.small}>
              Tanpa alamat, nomor, tautan, tugas ilegal atau pekerjaan berisiko
              di luar layanan.
            </Text>
            <Action
              busy={task.busy}
              onPress={() =>
                void task.run(async () => {
                  validateJobSuggestion(title, detail);
                  const r = await state.api.call("suggest_job", {
                    title,
                    detail,
                    workContext: context,
                  });
                  setReceipt(r.id);
                  load.reload();
                })
              }
            >
              Kirim usulan
            </Action>
            {!!task.error && <Note error>{task.error}</Note>}
          </>
        )}
      </Sheet>
    </Page>
  );
}
