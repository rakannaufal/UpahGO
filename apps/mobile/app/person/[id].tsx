import React, { useState } from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import { useSession } from "../../src/session";
import { c } from "../../src/theme";
import {
  AccountGate,
  Action,
  Consent,
  Icon,
  IconButton,
  LoadState,
  MenuRow,
  Note,
  Page,
  Sheet,
  s,
  useLoad,
  useTask,
} from "../../src/ui";
import { profileReady } from "../../../../shared/contracts";
import { ProfileReviews, RatingSummary } from "../../src/Rating";
import { formatDistance } from "../../../../shared/geo";
import {
  ActivityArtwork,
  ProfileIdentity,
  EffortLabel,
} from "../../src/ActivityMedia";
import { WorkContextSummary } from "../../src/WorkDetails";
import { ProfilePrice, ProfileTags } from "../../src/ProfilePresentation";
export default function Person() {
  return (
    <AccountGate>
      <Content />
    </AccountGate>
  );
}
function Content() {
  const { id, role } = useLocalSearchParams<{ id: string; role: string }>();
  const state = useSession();
  const task = useTask();
  const [contact, setContact] = useState(false);
  const [consent, setConsent] = useState(false);
  const [menu, setMenu] = useState(false);
  const [block, setBlock] = useState(false);
  const load = useLoad(
    () => state.api.call("profile", { id, role }),
    [state.api, id, role, state.data!.account.id, state.data!.account.role],
  );
  const p = load.value;
  const beginContact = (negotiate = false) =>
    void task.run(async () => {
      if (!p) return;
      const actor = state.data!.account;
      const existing = (await state.api.call("contacts")).find(
        (c) =>
          ["accepted", "pending"].includes(c.status) &&
          Date.parse(c.expiresAt) > Date.now() &&
          ((c.senderId === actor.id &&
            c.receiverId === p.id &&
            c.senderRole === actor.role &&
            c.receiverRole === p.role) ||
            (c.receiverId === actor.id &&
              c.senderId === p.id &&
              c.receiverRole === actor.role &&
              c.senderRole === p.role)),
      );
      if (existing) {
        router.push(
          negotiate && existing.status === "accepted"
            ? {
                pathname: "/new-agreement",
                params: { contactId: existing.id, intent: "negotiate" },
              }
            : { pathname: "/contact/[id]", params: { id: existing.id } },
        );
      } else {
        setConsent(false);
        setContact(true);
      }
    });
  const actions = p && (
    <>
      {p.role === state.data!.account.role ? (
        <Text style={s.small}>Akun ini memiliki peran yang sama denganmu.</Text>
      ) : !profileReady(state.data!.profile) ? (
        <Action
          onPress={() =>
            router.push({
              pathname: "/setup",
              params: { returnTo: `/person/${p.id}?role=${p.role}` },
            })
          }
        >
          Lengkapi profil
        </Action>
      ) : !state.data!.profile!.whatsappReady ? (
        <Action onPress={() => router.push("/phone")}>Verifikasi nomor</Action>
      ) : (
        <>
          <Text style={[s.small, { fontSize: 12, textAlign: "center" }]}>
            Kontak dibuka setelah izin kedua pihak.
          </Text>
          <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
            <View style={{ flex: 1, minWidth: 110 }}>
              <Action
                secondary={!!p.priceNegotiable}
                disabled={task.busy}
                onPress={() => beginContact()}
              >
                Hubungi
              </Action>
            </View>
            {p.priceNegotiable && (
              <View style={{ flex: 1.2, minWidth: 130 }}>
                <Action busy={task.busy} onPress={() => beginContact(true)}>
                  Tawar upah
                </Action>
              </View>
            )}
          </View>
        </>
      )}
      {!!task.error && <Note error>{task.error}</Note>}
    </>
  );
  return (
    <Page
      title="Profil"
      back
      form
      padded={false}
      footer={actions}
      toolbar={
        <IconButton
          accessibilityLabel="Pilihan akun"
          icon={() => <Icon name="more_vert" />}
          onPress={() => setMenu(true)}
        />
      }
    >
      <LoadState {...load} />
      {p && (
        <>
          <View>
            <View style={{ marginHorizontal: 20, marginTop: 16 }}>
              <ActivityArtwork
                tag={p.tags[0]}
                height={108}
                warm={p.role === "employer"}
              />
            </View>
            <View style={{ paddingHorizontal: 20, paddingBottom: 20, gap: 8 }}>
              <View
                style={{
                  alignSelf: "flex-start",
                  padding: 4,
                  marginTop: -32,
                  backgroundColor: c.surface,
                  borderRadius: 40,
                }}
              >
                <ProfileIdentity
                  id={p.id}
                  role={p.role}
                  photoReady={p.photoReady}
                  size={56}
                  tonal
                />
              </View>
              <Text
                variant="headlineSmall"
                style={{ fontSize: 24, lineHeight: 32, fontWeight: "700" }}
              >
                {p.name}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <Text style={s.small}>
                  {p.role === "worker" ? "Buruh" : "Penyedia kerja"}
                </Text>
                <RatingSummary
                  average={p.ratingAverage}
                  count={p.ratingCount}
                />
              </View>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
              >
                <Icon name="location_on" />
                <Text style={[s.small, { flex: 1 }]}>
                  {p.areaLabel} · Jarak perkiraan {formatDistance(p.distanceKm)}
                </Text>
              </View>
            </View>
            <View
              style={{
                padding: 20,
                backgroundColor: c.surfaceVariant,
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderColor: c.outlineVariant,
              }}
            >
              <ProfilePrice person={p} />
            </View>
            <View
              style={{
                paddingVertical: 22,
                marginHorizontal: 20,
                borderBottomWidth: 1,
                borderColor: c.outlineVariant,
                gap: 12,
              }}
            >
              <Text style={s.section}>
                {p.role === "employer"
                  ? "Yang perlu dibantu"
                  : "Layanan yang ditawarkan"}
              </Text>
              <ProfileTags tags={p.tags} />
              {!!p.bio && <Text style={s.body}>{p.bio}</Text>}
            </View>
            <View
              style={{
                paddingVertical: 22,
                marginHorizontal: 20,
                borderBottomWidth: 1,
                borderColor: c.outlineVariant,
                gap: 16,
              }}
            >
              <Text style={s.section}>
                {p.role === "employer"
                  ? "Rincian pekerjaan"
                  : "Preferensi pekerjaan"}
              </Text>
              <EffortLabel person={p} />
              {p.role === "employer" &&
                (p.workContext ? (
                  <WorkContextSummary value={p.workContext} expandable />
                ) : (
                  <Text style={s.small}>
                    Rincian durasi, jumlah, alat dan akses belum diisi.
                    Bicarakan sebelum bekerja.
                  </Text>
                ))}
            </View>
            <View style={{ paddingVertical: 22, marginHorizontal: 20 }}>
              <ProfileReviews id={p.id} role={p.role} />
            </View>
          </View>
        </>
      )}
      <Sheet
        visible={contact}
        title="Minta izin kontak"
        onClose={() => {
          if (!task.busy) setContact(false);
        }}
      >
        <Text style={s.body}>
          Nomor WhatsApp dibagikan setelah penerima menyetujui.
        </Text>
        <Consent
          checked={consent}
          disabled={task.busy}
          onChange={() => setConsent(!consent)}
          label={`Bagikan nomor WhatsApp dengan ${p?.name ?? "akun ini"}.`}
        />
        <Action
          busy={task.busy}
          disabled={!consent}
          onPress={() =>
            void task.run(async () => {
              const result = await state.api.call("request_contact", {
                targetId: id,
                targetRole: role,
                consent,
              });
              setContact(false);
              router.replace({
                pathname: "/contact/[id]",
                params: { id: result.id },
              });
            })
          }
        >
          Kirim permintaan kontak
        </Action>
        {!!task.error && <Note error>{task.error}</Note>}
      </Sheet>
      <Sheet visible={menu} title="Pilihan akun" onClose={() => setMenu(false)}>
        <MenuRow
          label="Laporkan akun"
          icon="report"
          onPress={() => {
            setMenu(false);
            router.push({ pathname: "/report/[id]", params: { id } });
          }}
        />
        <MenuRow
          label="Blokir akun"
          icon="block"
          destructive
          onPress={() => {
            setMenu(false);
            setBlock(true);
          }}
        />
      </Sheet>
      <Sheet
        visible={block}
        title="Blokir akun ini?"
        onClose={() => setBlock(false)}
      >
        <Text style={s.body}>
          Akun hilang dari hasilmu. Izin kontak dicabut; catatan kerja tetap
          tersimpan.
        </Text>
        {!state.data!.profile ? (
          <Action
            onPress={() => {
              setBlock(false);
              router.push("/setup");
            }}
          >
            Lengkapi profil
          </Action>
        ) : (
          <Action
            busy={task.busy}
            onPress={() =>
              void task.run(async () => {
                await state.api.call("block", { targetId: id });
                setBlock(false);
                router.dismissTo("/(tabs)/home");
              })
            }
          >
            Ya, blokir akun
          </Action>
        )}
        <Action secondary onPress={() => setBlock(false)}>
          Batal
        </Action>
        {!!task.error && <Note error>{task.error}</Note>}
      </Sheet>
    </Page>
  );
}
