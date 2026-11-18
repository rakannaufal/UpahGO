import React, { useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { Text, TouchableRipple } from "react-native-paper";
import { Consent, Field, Icon, s } from "./ui";
import { c } from "./theme";
import {
  effortLabels,
  estimateEffort,
  type WorkContext,
  type Effort,
} from "../../../shared/jobs";
export const blankContext: WorkContext = {
  durationMinutes: 0,
  quantity: 0,
  loadKg: 0,
  floors: 0,
  lift: false,
  distanceMeters: 0,
  workers: 1,
  tools: "",
};
export function EffortPreferences({
  value,
  onChange,
}: {
  value: Effort[];
  onChange: (value: Effort[]) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      {(["light", "medium", "heavy"] as Effort[]).map((e) => (
        <Consent
          key={e}
          label={effortLabels[e]}
          checked={value.includes(e)}
          onChange={() =>
            onChange(
              value.includes(e) ? value.filter((x) => x !== e) : [...value, e],
            )
          }
        />
      ))}
    </View>
  );
}
export function WorkContextFields({
  value,
  onChange,
  tags,
}: {
  value: WorkContext | null;
  onChange: (value: WorkContext | null) => void;
  tags: string[];
}) {
  let effort = "Perlu rincian";
  try {
    effort = effortLabels[estimateEffort(tags, value)];
  } catch {
    /* Incomplete drafts stay unclassified. */
  }
  return (
    <View style={{ gap: 12 }}>
      <Consent
        label="Tambahkan rincian kebutuhan"
        checked={!!value}
        onChange={() => onChange(value ? null : { ...blankContext })}
      />
      {value && (
        <>
          {(
            [
              ["durationMinutes", "Perkiraan durasi (menit)"],
              ["quantity", "Jumlah barang / area"],
              ["loadKg", "Beban per barang (kg, 0 bila tidak angkut)"],
              ["floors", "Lantai yang dilalui (0 bila datar)"],
              ["distanceMeters", "Jarak angkut / jalan (meter)"],
              ["workers", "Jumlah tenaga"],
            ] as const
          ).map(([key, label]) => (
            <Field
              key={key}
              label={label}
              value={String(value[key])}
              keyboardType={key === "loadKg" ? "decimal-pad" : "number-pad"}
              maxLength={6}
              onChangeText={(text) =>
                onChange({
                  ...value,
                  [key]: text === "" ? 0 : Number(text.replace(",", ".")),
                })
              }
            />
          ))}
          <Consent
            label="Lift tersedia pada rute"
            checked={value.lift}
            onChange={() => onChange({ ...value, lift: !value.lift })}
          />
          <Field
            label="Alat dan bahan yang disediakan"
            value={value.tools}
            maxLength={160}
            onChangeText={(tools) => onChange({ ...value, tools })}
          />
        </>
      )}
      <Text style={s.body}>Tenaga: {effort}</Text>
      <Text style={s.small}>
        Perkiraan dari rincian tugas, bukan batas beban aman. Sepakati alat,
        akses dan waktu istirahat.
      </Text>
    </View>
  );
}
export function WorkContextSummary({
  value,
  expandable = false,
}: {
  value: WorkContext;
  expandable?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { fontScale } = useWindowDimensions();
  const facts = [
    [
      "schedule",
      "Perkiraan durasi",
      value.durationMinutes % 60 === 0
        ? `${value.durationMinutes / 60} jam`
        : `${value.durationMinutes} menit`,
    ],
    ["person", "Jumlah tenaga", `${value.workers} orang`],
    ["work", "Jumlah area/barang", `${value.quantity}`],
    ["cleaning_services", "Alat dan bahan", value.tools],
    ...(value.loadKg > 0
      ? [["inventory_2", "Beban per barang", `${value.loadKg} kg`]]
      : []),
    ...(value.floors > 0
      ? [
          [
            "home",
            "Akses lantai",
            `${value.floors} lantai · ${value.lift ? "Lift tersedia" : "Tanpa lift"}`,
          ],
        ]
      : []),
  ];
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
        {facts.map(([icon, label, detail]) => (
          <View
            key={label}
            style={{
              width: fontScale >= 1.5 ? "100%" : "46%",
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <Icon name={icon!} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[s.small, { fontSize: 12, lineHeight: 18 }]}>
                {label}
              </Text>
              <Text
                style={[
                  s.body,
                  { fontSize: 14, lineHeight: 21, fontWeight: "600" },
                ]}
              >
                {detail}
              </Text>
            </View>
          </View>
        ))}
      </View>
      {expandable && (
        <TouchableRipple
          accessibilityRole="button"
          accessibilityLabel="Akses dan kondisi lokasi"
          accessibilityState={{ expanded }}
          aria-expanded={expanded}
          onPress={() => setExpanded(!expanded)}
          style={{ borderRadius: 10 }}
        >
          <View
            style={{
              minHeight: 48,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <View
              style={{ transform: [{ rotate: expanded ? "90deg" : "0deg" }] }}
            >
              <Icon name="chevron_right" />
            </View>
            <Text
              style={[
                s.small,
                { color: c.primary, fontWeight: "600", flexShrink: 1 },
              ]}
            >
              Akses dan kondisi lokasi
            </Text>
          </View>
        </TouchableRipple>
      )}
      {(!expandable || expanded) && (
        <View
          style={{
            padding: 12,
            backgroundColor: c.surfaceVariant,
            borderRadius: 12,
            gap: 4,
          }}
        >
          <Text style={s.small}>
            Jarak jalan/angkut {value.distanceMeters} m ·{" "}
            {value.floors === 0 ? "Lantai dasar" : `${value.floors} lantai`}
          </Text>
          <Text style={s.small}>
            {value.loadKg === 0
              ? "Tidak ada beban angkut tercatat."
              : `${value.loadKg} kg per barang.`}{" "}
            {value.lift
              ? "Lift tersedia."
              : value.floors > 0
                ? "Tanpa lift."
                : ""}
          </Text>
          <Text style={s.small}>
            Perkiraan tenaga bukan batas beban aman. Sepakati alat, akses dan
            waktu istirahat.
          </Text>
        </View>
      )}
    </View>
  );
}
