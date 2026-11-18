import React, { useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { Text, TouchableRipple } from "react-native-paper";
import { router } from "expo-router";
import { s } from "./ui";
import { c } from "./theme";
import type { Person } from "../../../shared/contracts";
import { formatWage } from "../../../shared/contracts";
import { formatDistance } from "../../../shared/geo";
import { activityIcon, ProfileIdentity } from "./ActivityMedia";
import { ServiceArt } from "./CeriaArt";
import {
  PriceNegotiability,
  ProfilePrice,
  ProfileTags,
} from "./ProfilePresentation";
import { RatingSummary } from "./Rating";
export function openPerson(person: Person) {
  router.push({
    pathname: "/person/[id]",
    params: { id: person.id, role: person.role },
  });
}
export function PersonCard({
  person,
  compact = false,
}: {
  person: Person;
  compact?: boolean;
}) {
  const worker = person.role === "worker";
  const negotiable = person.priceAmount != null && person.priceNegotiable;
  return (
    <TouchableRipple
      testID="person-card"
      accessibilityRole="button"
      accessibilityLabel={`${person.name}, ${worker ? "Buruh" : "Penyedia kerja"}, ${person.areaLabel}, ${formatDistance(person.distanceKm)}. ${person.priceAmount == null ? "Harga belum diisi" : `${worker ? "Mulai dari" : "Anggaran"} ${formatWage(person.priceAmount)} per pekerjaan/sesi. ${negotiable ? "Bisa nego" : "Harga tetap"}`}. ${person.ratingCount > 0 && person.ratingAverage !== null ? `${person.ratingAverage.toLocaleString("id-ID")} dari 5, ${person.ratingCount} ulasan.` : "Belum dinilai."} Lihat profil`}
      onPress={() => openPerson(person)}
      style={[s.card, { flex: 1 }]}
    >
      <View style={{ flex: 1 }}>
        <View
          style={{
            padding: compact ? 10 : 16,
            gap: compact ? 10 : 16,
            flex: 1,
          }}
        >
          <View
            testID="person-card-header"
            style={{
              flexDirection: "row",
              alignItems: compact ? "flex-start" : "center",
              gap: compact ? 8 : 12,
            }}
          >
            <ProfileIdentity
              id={person.id}
              role={person.role}
              photoReady={person.photoReady}
              size={compact ? 36 : 48}
              tonal
            />
            <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
              <Text
                variant="titleMedium"
                style={{
                  fontWeight: "700",
                  fontSize: compact ? 14 : 16,
                  lineHeight: compact ? 20 : 22,
                  color: c.onSurface,
                }}
              >
                {person.name}
              </Text>
              <Text
                style={[
                  s.small,
                  {
                    fontSize: compact ? 12 : 13,
                    lineHeight: compact ? 18 : 20,
                  },
                ]}
              >
                {person.areaLabel} · {formatDistance(person.distanceKm)}
              </Text>
            </View>
          </View>
          <View
            testID="person-card-details"
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: compact ? 6 : 12,
              minHeight: compact ? 64 : 80,
            }}
          >
            <View style={{ flex: 1, gap: 10, minWidth: 0 }}>
              {person.priceAmount != null && (
                <PriceNegotiability
                  negotiable={person.priceNegotiable}
                  compact
                  dense={compact}
                />
              )}
              {!compact && <ProfileTags tags={person.tags} compact />}
            </View>
            <View
              testID="person-card-artwork"
              accessible={false}
              importantForAccessibility="no-hide-descendants"
              aria-hidden
            >
              <ServiceArt
                name={activityIcon(person.tags[0])}
                size={compact ? 56 : 80}
              />
            </View>
          </View>
          {compact && <ProfileTags tags={person.tags} compact />}
        </View>
        <View
          style={{
            paddingHorizontal: compact ? 10 : 16,
            paddingVertical: compact ? 12 : 14,
            backgroundColor: c.surfaceVariant,
            borderTopWidth: 1,
            borderColor: c.outlineVariant,
          }}
        >
          <ProfilePrice
            person={person}
            compact
            dense={compact}
            showPriceTerms={false}
            trailing={
              <RatingSummary
                average={person.ratingAverage}
                count={person.ratingCount}
                compact
              />
            }
          />
        </View>
      </View>
    </TouchableRipple>
  );
}
export function PeopleGrid({ people }: { people: Person[] }) {
  const { width, fontScale } = useWindowDimensions();
  const [measured, setMeasured] = useState(0);
  const available = measured || Math.min(width - 32, 800);
  const columns = fontScale >= 1.5 ? 1 : 2;
  const cardWidth = columns === 1 ? available : (available - 12) / 2;
  return (
    <View
      testID="people-grid"
      onLayout={(e) => setMeasured(e.nativeEvent.layout.width)}
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "stretch",
      }}
    >
      {people.map((p) => (
        <View key={p.id} style={{ width: cardWidth }}>
          <PersonCard person={p} compact={cardWidth < 260} />
        </View>
      ))}
    </View>
  );
}
