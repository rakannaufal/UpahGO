import React, { useState } from "react";
import { View } from "react-native";
import { SegmentedButtons, Text, TouchableRipple } from "react-native-paper";
import { router } from "expo-router";
import { useSession } from "../../src/session";
import {
  Choices,
  Empty,
  Icon,
  IconButton,
  LoadState,
  Page,
  Sheet,
  s,
  useLoad,
} from "../../src/ui";
import { contactLabel, agreementLabel } from "../../src/labels";
import { formatWage } from "../../../../shared/contracts";
import { c, tokens } from "../../src/theme";

function ActivityCard({
  title,
  subtitle,
  status,
  pending,
  icon,
  detail,
  accessibilityLabel,
  onPress,
}: {
  title: string;
  subtitle: string;
  status: string;
  pending: boolean;
  icon: string;
  detail: string;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  return (
    <TouchableRipple
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={s.card}
    >
      <View style={{ padding: 16, gap: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name={icon} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="titleMedium" style={{ fontWeight: "700" }}>
              {title}
            </Text>
            <Text style={s.small}>{subtitle}</Text>
          </View>
          <Icon name="chevron_right" />
        </View>
        <View
          style={{
            borderTopWidth: 1,
            borderColor: c.outlineVariant,
            paddingTop: 12,
            gap: 8,
          }}
        >
          <Text
            style={{
              alignSelf: "flex-start",
              fontSize: 12,
              lineHeight: 18,
              fontWeight: "600",
              color: pending ? c.onWarmContainer : c.onPrimaryContainer,
              backgroundColor: pending ? c.warmContainer : c.surfaceVariant,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 8,
            }}
          >
            {status}
          </Text>
          <Text style={[s.small, { fontSize: 12, lineHeight: 18 }]}>
            {detail}
          </Text>
        </View>
      </View>
    </TouchableRipple>
  );
}

export default function Activity() {
  const { api, data } = useSession();
  const [section, setSection] = useState("contacts");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const load = useLoad(
    async () => ({
      contacts: await api.call("contacts"),
      agreements: await api.call("agreements"),
    }),
    [api, data!.account.id],
  );
  const contacts = load.value?.contacts.filter(
    (contact) =>
      filter === "all" ||
      (filter === "active"
        ? ["pending", "accepted"].includes(contact.status)
        : !["pending", "accepted"].includes(contact.status)),
  );
  const agreements = load.value?.agreements.filter(
    (agreement) =>
      filter === "all" ||
      (filter === "active"
        ? !["completed", "cancelled"].includes(agreement.status)
        : ["completed", "cancelled"].includes(agreement.status)),
  );
  return (
    <Page
      title="Aktivitas"
      hideTitle
      tonal
      contentMaxWidth={720}
      refreshing={load.loading}
      onRefresh={load.reload}
    >
      <View style={{ gap: 4 }}>
        <Text accessibilityRole="header" variant="headlineSmall">
          Aktivitasmu
        </Text>
        <Text style={s.small}>Pantau izin kontak dan pekerjaanmu.</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={{ flex: 1, maxWidth: 320 }}>
          <SegmentedButtons
            value={section}
            onValueChange={setSection}
            theme={{
              colors: {
                secondaryContainer: c.primaryContainer,
                onSecondaryContainer: c.onPrimaryContainer,
                outline: c.outline,
              },
            }}
            buttons={[
              {
                value: "contacts",
                label: "Kontak",
                style: {
                  minHeight: 48,
                  borderWidth: tokens.border.default,
                  borderColor: c.cardOutline,
                  backgroundColor:
                    section === "contacts" ? c.primaryContainer : c.surface,
                },
                labelStyle: {
                  fontSize: 14,
                  lineHeight: 20,
                  fontWeight: "600",
                  paddingVertical: 5,
                },
              },
              {
                value: "work",
                label: "Pekerjaan",
                style: {
                  minHeight: 48,
                  borderWidth: tokens.border.default,
                  borderColor: c.cardOutline,
                  backgroundColor:
                    section === "work" ? c.primaryContainer : c.surface,
                },
                labelStyle: {
                  fontSize: 14,
                  lineHeight: 20,
                  fontWeight: "600",
                  paddingVertical: 5,
                },
              },
            ]}
          />
        </View>
        <IconButton
          accessibilityLabel="Filter aktivitas"
          icon={() => <Icon name="filter_list" />}
          onPress={() => setFilterOpen(true)}
          style={[
            s.card,
            {
              margin: 0,
              borderRadius: 14,
              backgroundColor:
                filter === "all" ? c.surface : c.primaryContainer,
            },
          ]}
        />
      </View>
      <View style={[s.between, { marginTop: 8 }]}>
        <Text variant="titleMedium" style={{ fontWeight: "700" }}>
          {section === "contacts" ? "Permintaan kontak" : "Kesepakatan kerja"}
        </Text>
        <Text style={s.small}>
          {filter === "all"
            ? "Semua status"
            : filter === "active"
              ? "Aktif"
              : "Riwayat"}
        </Text>
      </View>
      <LoadState {...load} />
      {section === "contacts" ? (
        <>
          {contacts?.length === 0 && (
            <Empty
              title="Belum ada permintaan"
              body="Permintaan izin kontak akan muncul di sini."
            />
          )}
          {contacts?.map((contact) => {
            const sent = contact.senderId === data!.account.id;
            const name = sent ? contact.receiverName : contact.senderName;
            return (
              <ActivityCard
                key={contact.id}
                title={name}
                subtitle={sent ? "Permintaan terkirim" : "Permintaan masuk"}
                status={contactLabel[contact.status]}
                pending={contact.status === "pending"}
                icon="person_add"
                detail={new Date(contact.createdAt).toLocaleDateString(
                  "id-ID",
                  { day: "numeric", month: "long", year: "numeric" },
                )}
                accessibilityLabel={`${name}, ${contactLabel[contact.status]} · ${sent ? "Terkirim" : "Masuk"}`}
                onPress={() =>
                  router.push({
                    pathname: "/contact/[id]",
                    params: { id: contact.id },
                  })
                }
              />
            );
          })}
        </>
      ) : (
        <>
          {agreements?.length === 0 && (
            <Empty
              title="Belum ada pekerjaan"
              body="Kesepakatan tugas, jadwal, dan upah akan muncul di sini."
            />
          )}
          {agreements?.map((agreement) => {
            const worker = agreement.workerId === data!.account.id;
            const detail = `${formatWage(agreement.wage)} · ${agreementLabel[agreement.status]}${agreement.paymentReceivedAt ? " · Uang diterima" : ""}${(worker ? "worker" : "employer") !== data!.account.role ? (worker ? " · Sebagai Buruh" : " · Sebagai Penyedia kerja") : ""}`;
            return (
              <ActivityCard
                key={agreement.id}
                title={agreement.title}
                subtitle={formatWage(agreement.wage)}
                status={agreementLabel[agreement.status]}
                pending={
                  agreement.status === "proposed" ||
                  agreement.status === "completion_requested"
                }
                icon="work"
                detail={`${worker ? "Sebagai Buruh" : "Sebagai Penyedia kerja"} · ${agreement.paymentReceivedAt ? "Uang diterima" : "Belum ada pengakuan uang diterima"}`}
                accessibilityLabel={`${agreement.title}, ${detail}`}
                onPress={() =>
                  router.push({
                    pathname: "/agreement/[id]",
                    params: { id: agreement.id },
                  })
                }
              />
            );
          })}
        </>
      )}
      <Sheet
        visible={filterOpen}
        title="Filter aktivitas"
        onClose={() => setFilterOpen(false)}
      >
        <Choices.Group
          value={filter}
          onValueChange={(value) => {
            setFilter(value);
            setFilterOpen(false);
          }}
        >
          <Choices.Item value="all" label="Semua status" />
          <Choices.Item value="active" label="Aktif" />
          <Choices.Item value="history" label="Riwayat" />
        </Choices.Group>
      </Sheet>
    </Page>
  );
}
