import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import type { Person } from "../../../shared/contracts";
import { formatWage } from "../../../shared/contracts";
import { jobById } from "../../../shared/jobs";
import { useSession } from "./session";
import { c } from "./theme";
import { Field, s } from "./ui";

const shortLabels: Record<string, string> = {
  sweep: "Menyapu",
  mop: "Mengepel",
  dust: "Lap debu",
  kitchen: "Dapur",
  bathroom: "Kamar mandi",
  windows: "Jendela",
  dishwash: "Cuci piring",
  laundry: "Lipat pakaian",
  "water-carry": "Angkat galon",
  "box-move": "Pindah kardus",
};

export function ProfileTags({
  tags,
  compact = false,
}: {
  tags: string[];
  compact?: boolean;
}) {
  const { data } = useSession();
  const shown = compact ? tags.slice(0, 2) : tags;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
      {shown.map((id) => (
        <Text
          key={id}
          style={{
            alignSelf: "flex-start",
            maxWidth: "100%",
            flexShrink: 1,
            color: c.onSurfaceVariant,
            backgroundColor: c.surfaceVariant,
            borderRadius: 8,
            paddingHorizontal: compact ? 7 : 9,
            paddingVertical: compact ? 3 : 5,
            fontSize: compact ? 12 : 14,
            lineHeight: compact ? 18 : 21,
          }}
        >
          {(compact && shortLabels[id]) ||
            data?.tags.find((t) => t.id === id)?.label ||
            jobById(id)?.label ||
            id}
        </Text>
      ))}
      {compact && tags.length > 2 && (
        <Text style={[s.small, { fontSize: 12, lineHeight: 24 }]}>
          +{tags.length - 2}
        </Text>
      )}
    </View>
  );
}

export function ProfilePrice({
  person,
  compact = false,
  dense = false,
  showPriceTerms = true,
  trailing,
}: {
  person: Pick<Person, "role" | "priceAmount" | "priceNegotiable">;
  compact?: boolean;
  dense?: boolean;
  showPriceTerms?: boolean;
  trailing?: React.ReactNode;
}) {
  const amount = person.priceAmount;
  return (
    <View style={{ gap: compact ? 2 : 5 }}>
      <Text style={[s.small, compact && { fontSize: 12, lineHeight: 18 }]}>
        {amount == null
          ? "Harga belum diisi"
          : person.role === "worker"
            ? compact
              ? "Mulai dari"
              : "Tarif mulai"
            : compact
              ? "Anggaran"
              : "Anggaran pekerjaan"}
      </Text>
      <View
        style={{
          flexDirection: compact && !trailing ? "column" : "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: compact && !trailing ? "flex-start" : "center",
          gap: trailing ? 12 : 6,
        }}
      >
        <Text
          style={{
            color: c.onSurface,
            fontSize: compact
              ? amount != null && amount >= 10000000
                ? 16
                : dense
                  ? 18
                  : 22
              : 26,
            lineHeight: compact
              ? dense || (amount != null && amount >= 10000000)
                ? 25
                : 28
              : 34,
            fontWeight: "700",
            flexShrink: 1,
          }}
        >
          {amount == null ? "Bahas bersama" : formatWage(amount)}
        </Text>
        {trailing && (
          <View style={{ marginLeft: "auto", maxWidth: "100%" }}>
            {trailing}
          </View>
        )}
        {showPriceTerms && !compact && amount != null && (
          <PriceNegotiability negotiable={person.priceNegotiable} />
        )}
      </View>
      <Text style={[s.small, compact && { fontSize: 12, lineHeight: 18 }]}>
        {compact
          ? "Per pekerjaan/sesi"
          : amount == null
            ? "Tanyakan rincian dan nominal sebelum bekerja."
            : "Total per pekerjaan/sesi. Nominal akhir disepakati bersama."}
      </Text>
      {showPriceTerms && compact && amount != null && (
        <PriceNegotiability negotiable={person.priceNegotiable} compact />
      )}
    </View>
  );
}

export function PriceNegotiability({
  negotiable = false,
  compact = false,
  dense = false,
}: {
  negotiable?: boolean;
  compact?: boolean;
  dense?: boolean;
}) {
  return (
    <View
      testID={negotiable ? "profile-negotiable" : "profile-fixed-price"}
      style={{
        alignSelf: "flex-start",
      }}
    >
      <Text
        style={{
          color: negotiable ? c.onPrimaryContainer : c.onSurfaceVariant,
          fontSize: dense ? 12 : compact ? 13 : 14,
          lineHeight: 20,
          fontWeight: "600",
        }}
      >
        {negotiable ? "Bisa nego" : "Harga tetap"}
      </Text>
    </View>
  );
}

export function MoneyField({
  label,
  value,
  onChangeText,
  disabled = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={s.small}>{label}</Text>
      <Field
        accessibilityLabel={label}
        value={
          /^\d+$/.test(value) ? Number(value).toLocaleString("id-ID") : value
        }
        onChangeText={(text) => onChangeText(text.replaceAll(".", ""))}
        keyboardType="number-pad"
        maxLength={10}
        disabled={disabled}
      />
    </View>
  );
}
