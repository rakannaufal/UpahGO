import React from "react";
import { View } from "react-native";
import { Text, TouchableRipple } from "react-native-paper";
import {
  TextButton as Button,
  Page,
  LoadState,
  Empty,
  Icon,
  IconButton,
  s,
} from "../../src/ui";
import { router } from "expo-router";
import { PeopleGrid } from "../../src/PersonCard";
import { usePeople, BrowseTools } from "../../src/browse";
import { useSession } from "../../src/session";
import { c, tokens } from "../../src/theme";
import { ServiceArt } from "../../src/CeriaArt";
import { LocationGate } from "../../src/LocationGate";
export default function Home() {
  return (
    <LocationGate>
      <HomeContent />
    </LocationGate>
  );
}
function HomeContent() {
  const state = useSession();
  const browse = usePeople();
  return (
    <Page
      title="Beranda"
      hideTitle
      contentMaxWidth={tokens.layout.browseMaxWidth}
      refreshing={browse.load.loading}
      onRefresh={browse.load.reload}
    >
      <View
        style={{
          backgroundColor: c.primary,
          borderRadius: 28,
          padding: 18,
          gap: 4,
        }}
      >
        <Text
          style={{
            color: c.onPrimary,
            fontSize: 25,
            lineHeight: 31,
            fontWeight: "700",
            paddingRight: 72,
          }}
        >
          Bantuan harian,{"\n"}dekat dari rumah.
        </Text>
        <View style={{ position: "absolute", top: 18, right: 14 }}>
          <ServiceArt
            name={browse.role === "worker" ? "home" : "work"}
            size={64}
          />
        </View>
        <Text style={{ color: c.onPrimary, fontSize: 13, lineHeight: 20 }}>
          {state.data!.city?.label} · {state.data!.account.location?.radiusKm}{" "}
          km
        </Text>
        <Button
          mode="contained-tonal"
          icon={() => <Icon name="map" />}
          onPress={() => router.push("/(tabs)/discover")}
          style={{
            alignSelf: "flex-start",
            backgroundColor: c.primaryContainer,
          }}
          labelStyle={{ color: c.onPrimaryContainer }}
        >
          Buka peta sekitar
        </Button>
      </View>
      <BrowseTools
        browse={browse}
        inlineEffort={false}
        trailing={
          <IconButton
            accessibilityLabel="Perbarui hasil"
            icon={() => <Icon name="refresh" />}
            onPress={browse.load.reload}
            style={{ margin: 0 }}
          />
        }
      />
      <View style={{ flexDirection: "row", gap: 8, marginVertical: 8 }}>
        {[
          { tag: "sweep", name: "cleaning_services", label: "Menyapu" },
          { tag: "mop", name: "mop", label: "Mengepel" },
          { tag: "kitchen", name: "countertops", label: "Dapur" },
          { tag: "", name: "inventory_2", label: "Lainnya" },
        ].map((item) => (
          <TouchableRipple
            key={item.name}
            accessibilityRole="button"
            accessibilityLabel={
              item.tag ? `Filter ${item.label}` : "Buka katalog pekerjaan"
            }
            onPress={() =>
              item.tag
                ? browse.setFilters({
                    ...browse.filters,
                    category: "",
                    tag: item.tag,
                  })
                : router.push("/job-catalog")
            }
            style={{
              flex: 1,
              minWidth: 0,
              borderRadius: 16,
              borderWidth: tokens.border.default,
              borderColor: c.cardOutline,
              backgroundColor:
                item.tag && browse.filters.tag === item.tag
                  ? c.primaryContainer
                  : "transparent",
            }}
          >
            <View style={{ alignItems: "center", gap: 6, paddingVertical: 12 }}>
              <ServiceArt name={item.name} size={36} />
              <Text
                style={{
                  fontSize: 12,
                  lineHeight: 18,
                  color: c.onSurface,
                  textAlign: "center",
                  fontWeight: "600",
                }}
              >
                {item.label}
              </Text>
            </View>
          </TouchableRipple>
        ))}
      </View>
      {!state.data?.profile && (
        <Button
          style={{ alignSelf: "flex-start" }}
          icon={() => <Icon name="person_add" />}
          onPress={() => router.push("/setup")}
        >
          Lengkapi profil
        </Button>
      )}
      <LoadState {...browse.load} />
      {!browse.load.loading && !browse.load.error && !browse.people.length ? (
        <>
          <Empty
            title="Belum ada akun yang cocok"
            body={
              browse.filtered
                ? "Coba kurangi filter pekerjaan."
                : "Coba radius atau kecamatan lain."
            }
          />
          {browse.filtered && (
            <Button onPress={browse.reset}>Reset filter</Button>
          )}
        </>
      ) : (
        !browse.load.loading &&
        !browse.load.error && (
          <>
            <Text style={s.section}>
              {browse.role === "worker"
                ? "Buruh di dekatmu"
                : "Butuh bantuan di dekatmu"}
            </Text>
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
        )
      )}
    </Page>
  );
}
