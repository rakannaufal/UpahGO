import React, { useState, useEffect } from "react";
import { Image, View } from "react-native";
import { Text } from "react-native-paper";
import { jobById, effortLabels, estimateEffort } from "../../../shared/jobs";
import type { Person, Profile, Role } from "../../../shared/contracts";
import { Icon, s } from "./ui";
import { c } from "./theme";
import { readPhoto } from "./photos";
import { useSession } from "./session";
import { ServiceArt } from "./CeriaArt";

const activityIcons: Record<string, string> = {
  sweep: "cleaning_services",
  mop: "mop",
  dust: "countertops",
  kitchen: "countertops",
  bathroom: "bathtub",
  windows: "window",
  "water-carry": "inventory_2",
  "box-move": "inventory_2",
  dishwash: "countertops",
  laundry: "bathtub",
};
export function activityIcon(tag?: string) {
  return activityIcons[tag ?? ""] ?? "work";
}
export function ActivityArtwork({
  tag,
  compact = false,
  height,
  warm = false,
}: {
  tag?: string;
  compact?: boolean;
  height?: number;
  warm?: boolean;
}) {
  const job = jobById(tag);
  return (
    <View
      accessibilityLabel={`Aktivitas: ${job?.label ?? "Bantuan harian"}`}
      style={{
        aspectRatio: height ? undefined : compact ? 1 : 1.85,
        height,
        width: compact ? 56 : "100%",
        borderRadius: compact ? 12 : 14,
        backgroundColor:
          warm || tag === "water-carry" || tag === "box-move"
            ? c.warmContainer
            : c.primaryContainer,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <ServiceArt name={activityIcon(tag)} size={compact ? 32 : 48} />
    </View>
  );
}
export function ProfileIdentity({
  role,
  size = 40,
  id,
  photoReady = false,
  tonal = false,
}: {
  role: string;
  size?: number;
  id?: string;
  photoReady?: boolean;
  tonal?: boolean;
}) {
  const { api } = useSession();
  const [photo, setPhoto] = useState<{ key: string; uri: string } | null>(null);
  const key = `${id}:${role}:${photoReady}`;
  useEffect(() => {
    let active = true;
    if (id && photoReady)
      void readPhoto(api, id, role as Role)
        .then((uri) => {
          if (active && uri) setPhoto({ key, uri });
        })
        .catch(() => {});
    return () => {
      active = false;
    };
  }, [api, id, key, photoReady, role]);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: tonal
          ? role === "worker"
            ? c.primaryContainer
            : c.warmContainer
          : "transparent",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {photo?.key === key ? (
        <Image
          source={{ uri: photo.uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          accessibilityLabel={role === "worker" ? "Foto buruh" : "Foto tempat"}
          onError={() => setPhoto(null)}
        />
      ) : (
        <Icon name={role === "worker" ? "person" : "home"} />
      )}
    </View>
  );
}
export function EffortLabel({
  person,
}: {
  person: Pick<
    Person | Profile,
    "role" | "tags" | "acceptedEfforts" | "workContext"
  >;
}) {
  const effort =
    person.role === "worker"
      ? (person.acceptedEfforts ?? [])
          .map((e) => effortLabels[e])
          .join(" · ") || "Belum memilih tenaga"
      : effortLabels[estimateEffort(person.tags, person.workContext)];
  return (
    <Text style={[s.small, { color: c.primary, fontWeight: "600" }]}>
      {person.role === "worker" ? "Menerima: " : "Tenaga: "}
      {effort}
    </Text>
  );
}
