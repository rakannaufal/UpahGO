import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { Text, TouchableRipple } from "react-native-paper";
import { router } from "expo-router";
import {
  TextButton as Button,
  Choices,
  SearchField,
  Icon,
  IconButton,
  Note,
  Sheet,
  s,
  useLoad,
  useTask,
} from "./ui";
import { useSession } from "./session";
import { radiusOptions } from "../../../shared/contracts";
import type { Person, Role } from "../../../shared/contracts";
import {
  categories,
  effortLabels,
  emptyFilters,
  jobById,
  type DiscoveryFilters,
} from "../../../shared/jobs";
import { useDiscoveryFilters } from "./discovery-state";
import { c, tokens } from "./theme";
export function usePeople(roleOverride?: Role) {
  const state = useSession();
  const account = state.data!.account;
  const role =
    roleOverride ?? (account.role === "worker" ? "employer" : "worker");
  const areaId = account.browseAreaId ?? "";
  const { filters, setFilters } = useDiscoveryFilters();
  const [query, setQuery] = useState(filters.query);
  useEffect(() => {
    const timer = setTimeout(() => setQuery(filters.query.trim()), 300);
    return () => clearTimeout(timer);
  }, [filters.query]);
  const key = JSON.stringify([
    account.id,
    role,
    areaId,
    account.location?.capturedAt,
    account.location?.radiusKm,
    filters.category,
    filters.tag,
    filters.effort,
    filters.sort,
    query,
  ]);
  const [pagination, setPagination] = useState({ key, pages: 1 });
  const pages = pagination.key === key ? pagination.pages : 1;
  const cache = useRef<{
    key: string;
    pageCount: number;
    results: Map<number, Person[]>;
  } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);
  const load = useLoad(async () => {
    // Appending fetches only new pages; focus/refresh revalidates the entire visible window.
    if (
      !cache.current ||
      cache.current.key !== key ||
      cache.current.pageCount >= pages
    )
      cache.current = { key, pageCount: 0, results: new Map() };
    const snapshot = cache.current;
    const people = [];
    let hasMore = false;
    let capped = false;
    for (let i = 0; i < pages; i++) {
      const page =
        snapshot.results.get(i) ??
        (await state.api.call("discover", {
          role,
          areaId: areaId || null,
          tag: filters.tag || null,
          category: filters.category || null,
          effort: filters.effort || null,
          query,
          sort: filters.sort,
          offset: i * 40,
        }));
      snapshot.results.set(i, page);
      people.push(...page);
      hasMore = page.length === 40 && i < 25;
      capped = page.length === 40 && i === 25;
      if (!hasMore) break;
    }
    snapshot.pageCount = pages;
    return {
      people: [...new Map(people.map((p) => [p.id, p])).values()],
      hasMore,
      capped,
    };
  }, [state.api, key, pages]);
  return {
    now,
    role,
    areaId,
    filters,
    setFilters,
    reset: () => setFilters(emptyFilters),
    filtered: !!(
      filters.query ||
      filters.category ||
      filters.tag ||
      filters.effort ||
      filters.sort !== "distance"
    ),
    area: state.data!.areas.find((a) => a.id === areaId) ?? null,
    people: (load.value?.people ?? []).filter(
      (p) => Date.parse(p.expiresAt) > now,
    ),
    hasMore: load.value?.hasMore ?? false,
    capped: load.value?.capped ?? false,
    loadMore: () => setPagination({ key, pages: pages + 1 }),
    load,
  };
}
export type Browse = ReturnType<typeof usePeople>;
export function EffortSelector({
  value,
  onChange,
  unknown = false,
}: {
  value: string;
  onChange: (value: string) => void;
  unknown?: boolean;
}) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Tingkat tenaga"
      style={{
        flexDirection: "row",
        gap: 4,
        padding: 4,
        borderRadius: 24,
        backgroundColor: c.surfaceVariant,
        flexWrap: unknown ? "wrap" : "nowrap",
      }}
    >
      {[
        { id: "", label: "Semua" },
        ...Object.entries(effortLabels)
          .filter(([id]) => unknown || id !== "unknown")
          .map(([id, label]) => ({ id, label })),
      ].map((item) => (
        <TouchableRipple
          key={item.id}
          accessibilityRole="radio"
          accessibilityLabel={item.label}
          accessibilityState={{ checked: value === item.id }}
          aria-checked={value === item.id}
          onPress={() => onChange(item.id)}
          style={{
            flex: 1,
            minWidth: 48,
            borderRadius: 22,
            backgroundColor: value === item.id ? c.primary : "transparent",
          }}
        >
          <View
            pointerEvents="none"
            style={{
              minHeight: 48,
              paddingHorizontal: 6,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: value === item.id ? c.onPrimary : c.onSurfaceVariant,
                fontSize: 14,
                fontWeight: value === item.id ? "700" : "400",
              }}
            >
              {item.label}
            </Text>
          </View>
        </TouchableRipple>
      ))}
    </View>
  );
}
export function RadiusChoices({
  value,
  onChange,
}: {
  value: number;
  onChange: (km: number) => void;
}) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Radius pencarian"
      style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
    >
      {radiusOptions.map((km) => (
        <TouchableRipple
          key={km}
          accessibilityRole="radio"
          accessibilityLabel={`${km} km`}
          accessibilityState={{ checked: value === km }}
          aria-checked={value === km}
          onPress={() => onChange(km)}
          style={{
            borderRadius: 24,
            backgroundColor: value === km ? c.primaryContainer : c.surface,
            borderWidth: 1,
            borderColor: value === km ? c.primary : c.outline,
          }}
        >
          <View
            pointerEvents="none"
            style={{
              minHeight: 48,
              minWidth: 56,
              paddingHorizontal: 12,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: c.onPrimaryContainer,
                fontWeight: value === km ? "700" : "400",
              }}
            >
              {km} km
            </Text>
          </View>
        </TouchableRipple>
      ))}
    </View>
  );
}
export function BrowseTools({
  browse,
  trailing,
  compact = false,
  inlineEffort = true,
}: {
  browse: Browse;
  trailing?: React.ReactNode;
  compact?: boolean;
  inlineEffort?: boolean;
}) {
  const state = useSession();
  const task = useTask();
  const [areaOpen, setAreaOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const { filters, setFilters } = browse;
  const [draft, setDraft] = useState<DiscoveryFilters>(filters);
  const [jobQuery, setJobQuery] = useState("");
  const location = state.data!.account.location;
  const [radius, setRadius] = useState(location?.radiusKm ?? 5);
  const [district, setDistrict] = useState(
    state.data!.account.browseAreaId ?? "",
  );
  const area = state.data!.areas.find(
    (a) => a.id === state.data!.account.browseAreaId,
  );
  const cityLabel =
    state.data!.city?.label.replace(/^(Kota|Kabupaten) /, "") ?? "Lokasi";
  const activeCategories = categories.filter((cat) =>
    state.data!.tags.some((t) => jobById(t.id)?.categoryId === cat.id),
  );
  const available = state.data!.tags.filter(
    (t) =>
      (!draft.category || jobById(t.id)?.categoryId === draft.category) &&
      `${t.label} ${jobById(t.id)?.aliases ?? ""}`
        .toLowerCase()
        .includes(jobQuery.toLowerCase()),
  );
  return (
    <>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Button
          accessibilityLabel="Lokasi dan radius"
          mode="outlined"
          compact
          icon={() => <Icon name="location_on" />}
          style={{
            flex: 1,
            borderWidth: tokens.border.default,
            borderColor: c.cardOutline,
            backgroundColor: c.surface,
          }}
          labelStyle={{
            flexShrink: 1,
            textAlign: "left",
            fontSize: 14,
            marginHorizontal: 8,
          }}
          onPress={() => {
            setRadius(location?.radiusKm ?? 5);
            setDistrict(state.data!.account.browseAreaId ?? "");
            setAreaOpen(true);
          }}
        >
          {area?.label ?? cityLabel} · {location?.radiusKm ?? 5} km
        </Button>
        <IconButton
          accessibilityLabel={
            browse.filtered ? "Ubah filter pekerjaan" : "Filter pekerjaan"
          }
          icon={() => <Icon name="filter_list" />}
          onPress={() => {
            setDraft(filters);
            setJobQuery("");
            setFilterOpen(true);
          }}
          selected={browse.filtered}
          style={{
            margin: 0,
            backgroundColor: browse.filtered ? c.primaryContainer : c.surface,
          }}
        />
        {trailing}
      </View>
      {!compact && (
        <>
          <SearchField
            label={
              state.data!.account.role === "worker"
                ? "Cari pekerjaan"
                : "Cari layanan atau buruh"
            }
            value={filters.query}
            onChangeText={(query) => setFilters({ ...filters, query })}
            maxLength={80}
            returnKeyType="search"
          />
          {inlineEffort && (
            <EffortSelector
              value={filters.effort}
              onChange={(effort) => setFilters({ ...filters, effort })}
            />
          )}
          {(filters.category || filters.tag) && (
            <View style={s.between}>
              <Text style={[s.small, { flex: 1 }]}>
                {state.data!.tags.find((t) => t.id === filters.tag)?.label ??
                  categories.find((c) => c.id === filters.category)?.label}
              </Text>
              <Button onPress={browse.reset}>Reset</Button>
            </View>
          )}
        </>
      )}
      <Sheet
        visible={areaOpen}
        title="Lokasi & radius"
        onClose={() => setAreaOpen(false)}
      >
        <Text style={s.section}>{state.data!.city?.label}</Text>
        <Text style={s.small}>
          Radius dari GPS, tetap dalam kota/kabupaten ini.
        </Text>
        <RadiusChoices value={radius} onChange={setRadius} />
        <Text style={s.section}>Kecamatan</Text>
        <Choices.Group value={district} onValueChange={setDistrict}>
          <Choices.Item label="Semua kecamatan" value="" />
          {state.data!.areas.map((a) => (
            <Choices.Item key={a.id} value={a.id} label={a.label} />
          ))}
        </Choices.Group>
        <Button
          mode="contained"
          disabled={task.busy}
          loading={task.busy}
          onPress={() =>
            void task.run(async () => {
              await state.api.call("set_radius", { radiusKm: radius });
              await state.api.call("set_area", { areaId: district || null });
              await state.refresh();
              setAreaOpen(false);
            })
          }
        >
          Terapkan
        </Button>
        <Button
          disabled={task.busy}
          onPress={() => {
            setAreaOpen(false);
            router.push({ pathname: "/location", params: { edit: "1" } });
          }}
        >
          Perbarui GPS
        </Button>
        {!!task.error && <Note error>{task.error}</Note>}
      </Sheet>
      <Sheet
        visible={filterOpen}
        title="Filter pekerjaan"
        onClose={() => setFilterOpen(false)}
      >
        <SearchField
          label="Cari nama atau pekerjaan"
          value={draft.query}
          maxLength={80}
          onChangeText={(query) => setDraft({ ...draft, query })}
        />
        <Text style={s.section}>Tenaga</Text>
        <Choices.Group
          value={draft.effort}
          onValueChange={(effort) => setDraft({ ...draft, effort })}
        >
          <Choices.Item value="" label="Semua tenaga" />
          {Object.entries(effortLabels)
            .filter(([id]) => browse.role === "employer" || id !== "unknown")
            .map(([id, label]) => (
              <Choices.Item key={id} value={id} label={label} />
            ))}
        </Choices.Group>
        <Text style={s.section}>Kategori</Text>
        <Choices.Group
          value={draft.category}
          onValueChange={(category) =>
            setDraft({ ...draft, category, tag: "" })
          }
        >
          <Choices.Item value="" label="Semua kategori" />
          {activeCategories.map((cat) => (
            <Choices.Item key={cat.id} value={cat.id} label={cat.label} />
          ))}
        </Choices.Group>
        <Text style={s.section}>Jenis pekerjaan</Text>
        <SearchField
          label="Cari jenis pekerjaan"
          value={jobQuery}
          onChangeText={setJobQuery}
          maxLength={80}
        />
        <Choices.Group
          value={draft.tag}
          onValueChange={(tag) => setDraft({ ...draft, tag })}
        >
          <Choices.Item value="" label="Semua pekerjaan" />
          {available.map((t) => (
            <Choices.Item key={t.id} value={t.id} label={t.label} />
          ))}
        </Choices.Group>
        {!available.length && (
          <Text style={s.small}>Jenis ini belum tersedia.</Text>
        )}
        <Text style={s.section}>Urutkan</Text>
        <Choices.Group
          value={draft.sort}
          onValueChange={(sort) =>
            setDraft({ ...draft, sort: sort as "distance" | "rating" })
          }
        >
          <Choices.Item value="distance" label="Terdekat" />
          <Choices.Item value="rating" label="Rating tertinggi" />
        </Choices.Group>
        <Button
          mode="contained"
          onPress={() => {
            setFilters(draft);
            setFilterOpen(false);
          }}
        >
          Terapkan filter
        </Button>
        <Button
          onPress={() => {
            setDraft(emptyFilters);
            setJobQuery("");
          }}
        >
          Reset filter
        </Button>
      </Sheet>
    </>
  );
}
