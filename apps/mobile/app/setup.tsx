import React, { useState } from "react";
import { View } from "react-native";
import { Text, TouchableRipple } from "react-native-paper";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useSession } from "../src/session";
import {
  AccountGate,
  TextButton as Button,
  Action,
  Choices,
  Consent,
  Field,
  Icon,
  Note,
  Page,
  Sheet,
  s,
  useTask,
} from "../src/ui";
import {
  validateProfile,
  validateProfilePrice,
  parsePriceAmount,
} from "../../../shared/contracts";
import { useDraftGuard } from "../src/useDraftGuard";
import { c } from "../src/theme";
import {
  jobById,
  categories,
  validateWorkContext,
  type Effort,
  type WorkContext,
} from "../../../shared/jobs";
import { EffortPreferences, WorkContextFields } from "../src/WorkDetails";
import { ActivityArtwork } from "../src/ActivityMedia";
import { MoneyField } from "../src/ProfilePresentation";
export default function Setup() {
  return (
    <AccountGate registration={false}>
      <ProfileForm />
    </AccountGate>
  );
}
function ProfileForm() {
  const state = useSession();
  const profile = state.data!.profile;
  const account = state.data!.account;
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const [name, setName] = useState(profile?.name ?? "");
  const [areaId, setAreaId] = useState(
    profile?.areaId ?? account.browseAreaId ?? "",
  );
  const [region, setRegion] = useState(profile?.region ?? "");
  const [tags, setTags] = useState(profile?.tags ?? []);
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [price, setPrice] = useState(profile?.priceAmount?.toString() ?? "");
  const [priceNegotiable, setPriceNegotiable] = useState(
    profile?.priceNegotiable ?? false,
  );
  const [areaOpen, setAreaOpen] = useState(false);
  const [jobsOpen, setJobsOpen] = useState(false);
  const [jobQuery, setJobQuery] = useState("");
  const [category, setCategory] = useState("");
  const [acceptedEfforts, setAcceptedEfforts] = useState<Effort[]>(
    profile?.acceptedEfforts ?? [],
  );
  const [workContext, setWorkContext] = useState<WorkContext | null>(
    profile?.workContext ?? null,
  );
  const [initial] = useState(() =>
    JSON.stringify({
      name,
      areaId,
      region,
      tags,
      bio,
      price,
      priceNegotiable,
      acceptedEfforts,
      workContext,
    }),
  );
  const draft = useDraftGuard(
    initial !==
      JSON.stringify({
        name,
        areaId,
        region,
        tags,
        bio,
        price,
        priceNegotiable,
        acceptedEfforts,
        workContext,
      }),
  );
  const task = useTask();
  if (!account.introSeen) return <Redirect href="/onboarding" />;
  if (!account.role) return <Redirect href="/role" />;
  if (!account.location) return <Redirect href="/location" />;
  const area = state.data!.areas.find((a) => a.id === areaId);
  const goBack = () => {
    if (
      returnTo &&
      /^\/person\/[a-zA-Z0-9-]+\?role=(worker|employer)$/.test(returnTo)
    )
      router.replace(returnTo as "/");
    else router.dismissTo("/(tabs)/home");
  };
  return (
    <Page
      title={profile ? "Edit profil" : "Lengkapi profil"}
      form
      back={account.setupDone}
      toolbar={
        account.setupDone ? <Button onPress={goBack}>Batal</Button> : undefined
      }
    >
      <View
        style={{
          borderRadius: 24,
          overflow: "hidden",
          maxWidth: 200,
          width: "100%",
          alignSelf: "center",
        }}
      >
        <ActivityArtwork tag={tags[0]} />
      </View>
      <Field
        label="Nama tampilan"
        value={name}
        onChangeText={setName}
        maxLength={60}
        autoComplete="name"
      />
      {profile && (
        <Button
          disabled={task.busy}
          onPress={() => draft.confirm(() => router.push("/profile-photo"))}
        >
          Atur foto opsional
        </Button>
      )}
      <Action secondary onPress={() => setAreaOpen(true)}>
        {area?.label ?? "Pilih area"}
      </Action>
      {!state.data!.areas.length && (
        <Field
          label="Kota / kabupaten"
          value={region}
          onChangeText={setRegion}
          maxLength={100}
        />
      )}
      <Text style={s.section}>
        {account.role === "worker" ? "Layananmu" : "Butuh bantuan apa?"}
      </Text>
      <Text style={s.small}>Pilih hingga 5 layanan.</Text>
      <View style={s.tags}>
        {state
          .data!.tags.filter((tag) => tags.includes(tag.id))
          .map((tag) => (
            <TouchableRipple
              key={tag.id}
              accessibilityRole="checkbox"
              accessibilityLabel={tag.label}
              accessibilityState={{ checked: tags.includes(tag.id) }}
              aria-checked={tags.includes(tag.id)}
              onPress={() =>
                setTags((old) =>
                  old.includes(tag.id)
                    ? old.filter((t) => t !== tag.id)
                    : old.length < 5
                      ? [...old, tag.id]
                      : old,
                )
              }
              style={{
                borderRadius: 10,
                backgroundColor: tags.includes(tag.id)
                  ? c.primaryContainer
                  : c.surface,
                borderWidth: 1,
                borderColor: tags.includes(tag.id) ? c.primary : c.outline,
              }}
            >
              <View
                pointerEvents="none"
                style={{
                  minHeight: 48,
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  gap: 8,
                }}
              >
                {tags.includes(tag.id) && <Icon name="check" />}
                <Text
                  style={{
                    color: c.onPrimaryContainer,
                    fontSize: 14,
                    flexShrink: 1,
                  }}
                >
                  {tag.label}
                </Text>
              </View>
            </TouchableRipple>
          ))}
      </View>
      <Action secondary onPress={() => setJobsOpen(true)}>
        Pilih layanan / kebutuhan
      </Action>
      <Text style={s.section}>
        {account.role === "worker" ? "Tarif awal" : "Anggaran awal"}
      </Text>
      <Text style={s.small}>
        Total per pekerjaan/sesi. Isi sesuai lingkup yang kamu tawarkan; nominal
        akhir disepakati kedua pihak.
      </Text>
      <MoneyField
        label={
          account.role === "worker"
            ? "Tarif mulai (Rp, opsional)"
            : "Anggaran pekerjaan (Rp, opsional)"
        }
        value={price}
        disabled={task.busy}
        onChangeText={(value) => {
          setPrice(value);
          task.setError("");
          if (!value) setPriceNegotiable(false);
        }}
      />
      <Consent
        checked={priceNegotiable}
        onChange={() => setPriceNegotiable(!priceNegotiable)}
        label="Harga bisa dinegosiasikan"
        disabled={task.busy || !price}
      />
      <Text style={s.small}>
        Kosongkan jika belum tahu nominal. Profil akan menampilkan Harga belum
        diisi.
      </Text>
      <Text style={s.section}>
        {account.role === "worker"
          ? "Tenaga yang diterima"
          : "Rincian kebutuhan"}
      </Text>
      {account.role === "worker" ? (
        <>
          <EffortPreferences
            value={acceptedEfforts}
            onChange={setAcceptedEfforts}
          />
          <Text style={s.small}>
            Pilih sesuai kesediaanmu. Rincian setiap tugas tetap perlu
            disepakati.
          </Text>
        </>
      ) : (
        <WorkContextFields
          value={workContext}
          onChange={setWorkContext}
          tags={tags}
        />
      )}
      <Field
        label={
          account.role === "worker"
            ? "Tentang layanan (opsional)"
            : "Kebutuhanmu (opsional)"
        }
        value={bio}
        onChangeText={setBio}
        multiline
        maxLength={240}
      />
      <Text style={s.small}>Tanpa nomor, tautan atau alamat rumah.</Text>
      {!!task.error && <Note error>{task.error}</Note>}
      <Action
        busy={task.busy}
        onPress={() =>
          void task.run(async () => {
            const place = area?.label ?? region;
            validateProfile({ name, region: place, tags, bio });
            const priceAmount = price ? parsePriceAmount(price) : null;
            validateProfilePrice(priceAmount, priceNegotiable);
            if (account.role === "employer") validateWorkContext(workContext);
            await state.api.call("save_profile", {
              name,
              region: place,
              areaId: areaId || null,
              role: account.role,
              tags,
              bio,
              acceptedEfforts: account.role === "worker" ? acceptedEfforts : [],
              workContext: account.role === "employer" ? workContext : null,
              priceAmount,
              priceNegotiable,
            });
            await state.refresh();
            draft.proceed(goBack);
          })
        }
      >
        Simpan profil
      </Action>
      {!account.setupDone && (
        <Button
          disabled={task.busy}
          onPress={() =>
            draft.confirm(
              () =>
                void task.run(async () => {
                  await state.api.call("onboarding", { step: "profile" });
                  await state.refresh();
                  draft.proceed(() => router.replace("/(tabs)/home"));
                }),
            )
          }
        >
          Lewati dulu
        </Button>
      )}
      <Sheet
        visible={areaOpen}
        title="Pilih area"
        onClose={() => setAreaOpen(false)}
      >
        <Choices.Group
          value={areaId}
          onValueChange={(id) => {
            setAreaId(id);
            setAreaOpen(false);
          }}
        >
          {state.data!.areas.map((a) => (
            <Choices.Item key={a.id} value={a.id} label={a.label} />
          ))}
        </Choices.Group>
        {!state.data!.areas.length && (
          <Note>Direktori area belum tersedia.</Note>
        )}
      </Sheet>
      <Sheet
        visible={jobsOpen}
        title="Pilih pekerjaan"
        onClose={() => setJobsOpen(false)}
      >
        <Field
          label="Cari jenis pekerjaan"
          value={jobQuery}
          onChangeText={setJobQuery}
          maxLength={80}
        />
        <Choices.Group value={category} onValueChange={setCategory}>
          <Choices.Item label="Semua kategori" value="" />
          {categories
            .filter((cat) =>
              state.data!.tags.some(
                (t) => jobById(t.id)?.categoryId === cat.id,
              ),
            )
            .map((cat) => (
              <Choices.Item key={cat.id} value={cat.id} label={cat.label} />
            ))}
        </Choices.Group>
        <Text style={s.small}>{tags.length} / 5 dipilih</Text>
        {state
          .data!.tags.filter(
            (t) =>
              (!category || jobById(t.id)?.categoryId === category) &&
              `${t.label} ${jobById(t.id)?.aliases ?? ""}`
                .toLowerCase()
                .includes(jobQuery.toLowerCase()),
          )
          .map((t) => (
            <TouchableRipple
              key={t.id}
              accessibilityRole="checkbox"
              accessibilityLabel={t.label}
              accessibilityState={{
                checked: tags.includes(t.id),
                disabled: tags.length >= 5 && !tags.includes(t.id),
              }}
              aria-checked={tags.includes(t.id)}
              disabled={tags.length >= 5 && !tags.includes(t.id)}
              onPress={() =>
                setTags((old) =>
                  old.includes(t.id)
                    ? old.filter((id) => id !== t.id)
                    : [...old, t.id],
                )
              }
              style={{
                borderRadius: 10,
                backgroundColor: tags.includes(t.id)
                  ? c.primaryContainer
                  : c.surface,
              }}
            >
              <View
                style={{
                  minHeight: 56,
                  padding: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Text style={[s.body, { flex: 1 }]}>{t.label}</Text>
                {tags.includes(t.id) && <Icon name="check" />}
              </View>
            </TouchableRipple>
          ))}
        <Button onPress={() => setJobsOpen(false)}>Selesai memilih</Button>
        <Text style={s.small}>
          Jenis lain belum aktif. Katalog tidak membuka pekerjaan berisiko
          melalui tag bebas.
        </Text>
        <Button
          onPress={() => {
            setJobsOpen(false);
            router.push("/job-catalog");
          }}
        >
          Katalog dan pekerjaan lainnya
        </Button>
      </Sheet>
      {draft.prompt}
    </Page>
  );
}
