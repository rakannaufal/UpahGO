import React, { useState } from "react";
import { Linking } from "react-native";
import { Text } from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import { useSession } from "../../src/session";
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
  Panel,
  Sheet,
  s,
  useLoad,
  useTask,
} from "../../src/ui";
import { ProfileIdentity } from "../../src/ActivityMedia";
import { contactLabel } from "../../src/labels";
import { profileReady, whatsappUrl } from "../../../../shared/contracts";
export default function Contact() {
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
  const [consent, setConsent] = useState(false);
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [info, setInfo] = useState("");
  const load = useLoad(
    () => state.api.call("contact", { id }),
    [state.api, id, state.data!.account.id],
  );
  const c = load.value;
  const mine = c?.receiverId === state.data!.account.id;
  const otherId = mine ? c?.senderId : c?.receiverId;
  const respond = (action: string) =>
    void task.run(async () => {
      await state.api.call("respond_contact", {
        id,
        action,
        consent: action === "accept" && consent,
      });
      load.reload();
    });
  return (
    <Page
      title="Permintaan kontak"
      back
      form
      toolbar={
        <IconButton
          accessibilityLabel="Pilihan kontak"
          icon={() => <Icon name="more_vert" />}
          onPress={() => setMenu(true)}
        />
      }
    >
      <LoadState {...load} />
      {c && (
        <>
          <Panel>
            <Icon name="person_add" />
            <ProfileIdentity
              role={mine ? c.senderRole : c.receiverRole}
              size={56}
            />
            <Text variant="titleLarge">
              {mine ? c.senderName : c.receiverName}
            </Text>
            <Text style={s.body}>{contactLabel[c.status]}</Text>
            {["pending", "accepted"].includes(c.status) && (
              <Text style={s.small}>
                Berlaku hingga{" "}
                {new Date(c.expiresAt).toLocaleString("id-ID", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            )}
          </Panel>
          {c.status === "pending" &&
            mine &&
            (!profileReady(state.data!.profile) ? (
              <Action onPress={() => router.push("/setup")}>
                Lengkapi profil
              </Action>
            ) : !state.data!.profile!.whatsappReady ? (
              <Action onPress={() => router.push("/phone")}>
                Verifikasi nomor
              </Action>
            ) : (
              <>
                <Consent
                  checked={consent}
                  onChange={() => setConsent(!consent)}
                  label={`Bagikan nomor WhatsApp dengan ${c.senderName}.`}
                />
                <Action
                  disabled={!consent}
                  busy={task.busy}
                  onPress={() => respond("accept")}
                >
                  Setujui dan bagikan nomor
                </Action>
                <Action
                  secondary
                  busy={task.busy}
                  onPress={() => respond("decline")}
                >
                  Tolak permintaan
                </Action>
              </>
            ))}
          {c.status === "accepted" && (
            <>
              <Action
                busy={task.busy}
                onPress={() =>
                  void task.run(async () => {
                    if (state.demo) {
                      setInfo("Simulasi: WhatsApp tidak dibuka.");
                      return;
                    }
                    const result = await state.api.call("approved_contact", {
                      id,
                    });
                    await Linking.openURL(whatsappUrl(result.phone));
                  })
                }
              >
                Buka WhatsApp
              </Action>
              <Action
                secondary
                onPress={() =>
                  router.push({
                    pathname: "/new-agreement",
                    params: { contactId: id, intent: "negotiate" },
                  })
                }
              >
                Tawar upah
              </Action>
              <Action
                secondary
                onPress={() =>
                  router.push({
                    pathname: "/new-agreement",
                    params: { contactId: id },
                  })
                }
              >
                Buat kesepakatan kerja
              </Action>
            </>
          )}
        </>
      )}
      {!!info && <Note>{info}</Note>}
      {!!task.error && <Note error>{task.error}</Note>}
      <Sheet
        visible={menu}
        title="Pilihan kontak"
        onClose={() => setMenu(false)}
      >
        {c && ["pending", "accepted"].includes(c.status) && (
          <MenuRow
            label={
              c.status === "pending"
                ? "Batalkan permintaan"
                : "Cabut izin kontak"
            }
            icon="cancel"
            onPress={() => {
              setMenu(false);
              setConfirm(true);
            }}
          />
        )}
        {otherId && (
          <MenuRow
            label="Laporkan akun"
            icon="report"
            onPress={() => {
              setMenu(false);
              router.push({
                pathname: "/report/[id]",
                params: { id: otherId },
              });
            }}
          />
        )}
      </Sheet>
      <Sheet
        visible={confirm}
        title={
          c?.status === "pending"
            ? "Batalkan permintaan?"
            : "Cabut izin kontak?"
        }
        onClose={() => setConfirm(false)}
      >
        <Text style={s.body}>
          Nomor yang sudah disalin tidak dapat ditarik kembali. Kesepakatan
          kerja tetap tersimpan.
        </Text>
        <Action
          busy={task.busy}
          onPress={() =>
            void task.run(async () => {
              await state.api.call("revoke_contact", { id });
              setConfirm(false);
              load.reload();
            })
          }
        >
          Ya, cabut akses kontak
        </Action>
        <Action secondary onPress={() => setConfirm(false)}>
          Kembali
        </Action>
        {!!task.error && <Note error>{task.error}</Note>}
      </Sheet>
    </Page>
  );
}
