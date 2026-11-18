import React from "react";
import { View } from "react-native";
import { Text, TouchableRipple } from "react-native-paper";
import { router } from "expo-router";
import { useSession } from "../../src/session";
import { c } from "../../src/theme";
import { Empty, Icon, LoadState, Note, Page, s, useTask } from "../../src/ui";
import { HistoryMore, useHistory } from "../../src/useHistory";
export default function Notices() {
  const { api, data } = useSession();
  const load = useHistory(
    (after) => api.call("notifications", after ? { after } : {}),
    [api, data!.account.id],
  );
  const task = useTask();
  return (
    <Page
      title="Notifikasi"
      hideTitle
      tonal
      contentMaxWidth={720}
      refreshing={load.loading}
      onRefresh={load.reload}
    >
      <View style={{ gap: 4 }}>
        <Text accessibilityRole="header" variant="headlineSmall">
          Kabar terbaru
        </Text>
        <Text style={s.small} accessibilityLiveRegion="polite">
          {load.value
            ? `${load.value.filter((notice) => !notice.read).length} belum dibaca dari ${load.value.length} yang dimuat`
            : "Kabar kontak dan pekerjaanmu di satu tempat."}
        </Text>
      </View>
      <LoadState {...load} />
      {!!task.error && <Note error>{task.error}</Note>}
      {load.value?.length === 0 && (
        <Empty
          title="Belum ada notifikasi"
          body="Kabar izin kontak dan kesepakatan kerja akan muncul di sini."
        />
      )}
      {load.value?.map((n, index, notices) => (
        <React.Fragment key={n.id}>
          {(index === 0 ||
            new Date(n.createdAt).toDateString() !==
              new Date(notices[index - 1]!.createdAt).toDateString()) && (
            <Text
              style={[
                s.small,
                { fontWeight: "600", marginTop: index ? 12 : 8 },
              ]}
            >
              {new Date(n.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
          )}
          <TouchableRipple
            accessibilityRole="button"
            accessibilityLabel={`${n.title}${n.read ? "" : ", belum dibaca"}`}
            disabled={task.busy}
            accessibilityState={{ disabled: task.busy, busy: task.busy }}
            style={s.card}
            onPress={() =>
              void task.run(async () => {
                await api.call("read_notification", { id: n.id });
                load.update(n.id, { read: true });
                const match = n.route.match(
                  /^\/(contact|agreement)\/([a-zA-Z0-9-]+)$/,
                );
                if (match)
                  router.push({
                    pathname:
                      match[1] === "contact"
                        ? "/contact/[id]"
                        : "/agreement/[id]",
                    params: { id: match[2]! },
                  });
              })
            }
          >
            <View
              style={{
                padding: 16,
                gap: 12,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon
                    name={
                      n.route.startsWith("/contact/") ? "person_add" : "work"
                    }
                  />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text
                    variant="titleMedium"
                    style={{ fontWeight: n.read ? "600" : "700" }}
                  >
                    {n.title}
                  </Text>
                  {!!n.body && <Text style={s.small}>{n.body}</Text>}
                </View>
                <Icon name="chevron_right" />
              </View>
              <View
                style={[
                  s.between,
                  {
                    paddingTop: 10,
                    borderTopWidth: 1,
                    borderColor: c.outlineVariant,
                    flexWrap: "wrap",
                  },
                ]}
              >
                <Text style={[s.small, { fontSize: 12, lineHeight: 18 }]}>
                  {new Date(n.createdAt).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    lineHeight: 18,
                    color: n.read ? c.onSurfaceVariant : c.primary,
                    fontWeight: "600",
                  }}
                >
                  {n.read ? "Sudah dibaca" : "Belum dibaca"}
                </Text>
              </View>
            </View>
          </TouchableRipple>
        </React.Fragment>
      ))}
      <HistoryMore {...load} />
    </Page>
  );
}
