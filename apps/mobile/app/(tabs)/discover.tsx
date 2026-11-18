import React, { useState } from "react";
import { View } from "react-native";
import { Switch, Text } from "react-native-paper";
import {
  TextButton as Button,
  AccountGate,
  Action,
  Choices,
  Empty,
  Icon,
  IconButton,
  LoadState,
  MenuRow,
  Note,
  Page,
  Panel,
  Sheet,
  s,
  useTask,
} from "../../src/ui";
import { router } from "expo-router";
import { AreaMap } from "../../src/AreaMap";
import { BrowseTools, usePeople } from "../../src/browse";
import { openPerson, PeopleGrid } from "../../src/PersonCard";
import { useSession } from "../../src/session";
import { c } from "../../src/theme";
import { profileReady } from "../../../../shared/contracts";
import type { Person, Role } from "../../../../shared/contracts";
import { LocationGate } from "../../src/LocationGate";
import { RatingSummary } from "../../src/Rating";
import { formatDistance } from "../../../../shared/geo";
import {
  ActivityArtwork,
  EffortLabel,
  ProfileIdentity,
} from "../../src/ActivityMedia";
export default function Discover() {
  return (
    <AccountGate>
      <LocationGate>
        <MapContent />
      </LocationGate>
    </AccountGate>
  );
}
function MapContent() {
  const state = useSession();
  const [override, setOverride] = useState<Role>();
  const browse = usePeople(override);
  const [list, setList] = useState(false);
  const [settings, setSettings] = useState(false);
  const [info, setInfo] = useState(false);
  const [selected, setSelected] = useState<Person | null>(null);
  const [group, setGroup] = useState<string[]>([]);
  const task = useTask();
  const p = state.data!.profile;
  const visible = !!p?.visibleUntil && Date.parse(p.visibleUntil) > browse.now;
  const chosen = browse.people.find((x) => x.id === selected?.id);
  const ready = profileReady(p);
  return (
    <Page title="Temukan" hideTitle scroll={list} padded={list}>
      {!list && (
        <View style={{ flex: 1 }}>
          <AreaMap
            people={browse.people}
            city={state.data!.city!}
            location={state.data!.account.location!}
            onSelect={setSelected}
            onGroupSelect={(people) => setGroup(people.map((p) => p.id))}
          />
          <View
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              right: 12,
              padding: 4,
              backgroundColor: c.surface,
              borderRadius: 20,
            }}
          >
            <BrowseTools
              browse={browse}
              compact
              trailing={
                <IconButton
                  accessibilityLabel="Lihat daftar"
                  icon={() => <Icon name="format_list_bulleted" />}
                  onPress={() => setList(true)}
                  style={{ margin: 0 }}
                />
              }
            />
          </View>
          <View
            style={{
              position: "absolute",
              bottom: 30,
              left: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Button mode="contained-tonal" onPress={() => setSettings(true)}>
              {visible ? "Tampil di peta" : "Tidak tampil"}
            </Button>
            <IconButton
              accessibilityLabel="Info lokasi"
              icon={() => <Icon name="info" />}
              onPress={() => setInfo(true)}
              style={{ margin: 0, backgroundColor: c.surface }}
            />
          </View>
          {(browse.load.loading || browse.load.error) && (
            <View
              style={{
                position: "absolute",
                top: 92,
                left: 16,
                right: 16,
                backgroundColor: c.surface,
                padding: 12,
                borderRadius: 12,
              }}
            >
              <LoadState {...browse.load} />
            </View>
          )}
        </View>
      )}
      {list && (
        <>
          <View
            style={{
              padding: list ? 0 : 16,
              gap: 8,
              backgroundColor: c.background,
            }}
          >
            <BrowseTools
              browse={browse}
              trailing={
                <IconButton
                  accessibilityLabel="Lihat peta"
                  icon={() => <Icon name="map" />}
                  onPress={() => setList(false)}
                  style={{ margin: 0 }}
                />
              }
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <Button compact onPress={() => setSettings(true)}>
                {visible ? "Tampil di peta" : "Tidak tampil"}
              </Button>
              <Button compact onPress={() => setInfo(true)}>
                Lokasi perkiraan
              </Button>
            </View>
          </View>
          <LoadState {...browse.load} />
          {
            <>
              {!browse.people.length &&
                !browse.load.loading &&
                !browse.load.error && (
                  <Empty
                    title={
                      browse.area
                        ? "Belum ada akun yang cocok"
                        : "Belum ada akun yang cocok"
                    }
                    body=""
                  />
                )}
              <PeopleGrid people={browse.people} />
              {browse.hasMore && (
                <Button onPress={browse.loadMore}>Muat lebih banyak</Button>
              )}
              {browse.capped && (
                <Text style={s.small}>
                  Hasil dibatasi. Persempit filter untuk melihat yang lain.
                </Text>
              )}
            </>
          }
        </>
      )}
      <Sheet
        visible={!!chosen}
        title={chosen?.name ?? "Profil"}
        onClose={() => setSelected(null)}
      >
        {chosen && (
          <>
            <View
              style={{ borderRadius: 24, overflow: "hidden", maxWidth: 320 }}
            >
              <ActivityArtwork tag={chosen.tags[0]} />
            </View>
            <Text style={s.small}>{chosen.areaLabel}</Text>
            <ProfileIdentity
              id={chosen.id}
              role={chosen.role}
              photoReady={chosen.photoReady}
              size={56}
            />
            <RatingSummary
              average={chosen.ratingAverage}
              count={chosen.ratingCount}
            />
            <EffortLabel person={chosen} />
            <Text style={s.small}>{formatDistance(chosen.distanceKm)}</Text>
            <Text style={s.body}>
              {chosen.tags
                .map(
                  (id) =>
                    state.data!.tags.find((t) => t.id === id)?.label ?? id,
                )
                .join(" · ")}
            </Text>
            <Action
              onPress={() => {
                setSelected(null);
                openPerson(chosen);
              }}
            >
              Lihat profil
            </Action>
          </>
        )}
      </Sheet>
      <Sheet
        visible={browse.people.some((p) => group.includes(p.id))}
        title="Akun di area ini"
        onClose={() => setGroup([])}
      >
        {browse.people
          .filter((p) => group.includes(p.id))
          .map((p) => (
            <MenuRow
              key={p.id}
              label={p.name}
              icon={p.role === "worker" ? "person" : "work"}
              detail={p.tags
                .map(
                  (id) =>
                    state.data!.tags.find((t) => t.id === id)?.label ?? id,
                )
                .join(" · ")}
              onPress={() => {
                setGroup([]);
                setSelected(p);
              }}
            />
          ))}
      </Sheet>
      <Sheet
        visible={settings}
        title="Pengaturan peta"
        onClose={() => setSettings(false)}
      >
        <Text style={s.section}>Lihat akun</Text>
        <Choices.Group
          value={browse.role}
          onValueChange={(value) => {
            setOverride(value as Role);
            setSelected(null);
          }}
        >
          <Choices.Item value="worker" label="Buruh" />
          <Choices.Item value="employer" label="Penyedia kerja" />
        </Choices.Group>
        <Panel>
          <View style={s.between}>
            <Text style={[s.body, { flex: 1 }]}>Tampil di peta</Text>
            <Switch
              accessibilityLabel="Tampil di peta"
              value={visible}
              disabled={task.busy || !ready || !p?.whatsappReady}
              onValueChange={(enabled) =>
                void task.run(async () => {
                  await state.api.call("visibility", { enabled });
                  await state.refresh();
                })
              }
            />
          </View>
          {!ready ? (
            <Action
              secondary
              onPress={() => {
                setSettings(false);
                router.push("/setup");
              }}
            >
              Lengkapi profil
            </Action>
          ) : !p?.whatsappReady ? (
            <Action
              secondary
              onPress={() => {
                setSettings(false);
                router.push("/phone");
              }}
            >
              Verifikasi nomor
            </Action>
          ) : (
            <Text style={s.small}>
              {visible
                ? `Sampai ${new Date(p!.visibleUntil!).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`
                : "Aktifkan saat siap dihubungi. Berlaku 1 jam."}
            </Text>
          )}
        </Panel>
        {!!task.error && <Note error>{task.error}</Note>}
      </Sheet>
      <Sheet
        visible={info}
        title="Lokasi perkiraan"
        onClose={() => setInfo(false)}
      >
        <Text style={s.body}>
          Titik publik dibuat perkiraan. Pencarian mengikuti radius GPS dalam{" "}
          {state.data!.city?.label}. Membesarkan peta tidak menambah radius. GPS
          bisa dipalsukan, bukan bukti identitas atau jaminan keamanan. Pada
          zoom maksimal, pin yang bertumpuk dipisah agar bisa dipilih. Garis
          menghubungkan pin ke lokasi perkiraan asalnya.
        </Text>
        <Action
          secondary
          onPress={() => {
            setInfo(false);
            setList(true);
          }}
        >
          Lihat daftar
        </Action>
      </Sheet>
    </Page>
  );
}
