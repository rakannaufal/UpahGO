import React, { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { c } from "./theme";
import { mapMarkers, type MapProps } from "./map-model";
import { TextButton, s } from "./ui";
import controls from "../../../assets/ceria/controls.json";
import { useSession } from "./session";
import { readPhoto } from "./photos";
export function AreaMap({
  people,
  city,
  location,
  onSelect,
  onGroupSelect,
}: MapProps) {
  const host = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const overlay = useRef<Leaflet.LayerGroup | null>(null);
  const leaflet = useRef<typeof Leaflet | null>(null);
  const callbacks = useRef({ onSelect, onGroupSelect });
  useEffect(() => {
    callbacks.current = { onSelect, onGroupSelect };
  }, [onSelect, onGroupSelect]);
  const [revision, setRevision] = useState(0);
  const [tileError, setTileError] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [atMaxZoom, setAtMaxZoom] = useState(false);
  const { api } = useSession();
  useEffect(() => {
    let active = true;
    let resize: ResizeObserver | undefined;
    void import("leaflet")
      .then((module) => {
        if (!active || !host.current) return;
        const L = module.default ?? module;
        leaflet.current = L;
        setLoadError(false);
        const bounds = L.latLngBounds(
          [city.bounds.south, city.bounds.west],
          [city.bounds.north, city.bounds.east],
        );
        const map = L.map(host.current, {
          maxBounds: bounds,
          maxBoundsViscosity: 1,
          zoomControl: false,
          zoomAnimation: false,
          fadeAnimation: false,
          markerZoomAnimation: false,
          maxZoom: 18,
          attributionControl: true,
        });
        mapRef.current = map;
        map.on("zoomend", () => {
          if (active) setAtMaxZoom(map.getZoom() >= 18);
        });
        const minZoom = Math.max(10, map.getBoundsZoom(bounds, true));
        map.setMinZoom(minZoom);
        map.setView(
          [location.latitude, location.longitude],
          Math.max(minZoom, 13),
        );
        L.control
          .zoom({
            position: "bottomright",
            zoomInTitle: "Perbesar peta",
            zoomOutTitle: "Perkecil peta",
          })
          .addTo(map);
        const tiles = L.tileLayer(
          "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution:
              '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>',
            maxZoom: 19,
            noWrap: true,
            bounds,
          },
        );
        tiles.on("tileerror", () => {
          if (active) setTileError(true);
        });
        tiles.addTo(map);
        map.createPane("city-mask").style.zIndex = "450";
        map.getPane("city-mask")!.style.pointerEvents = "none";
        const rings = city.boundary.coordinates.map((polygon) =>
          polygon[0]!.map(([lon, lat]) => [lat!, lon!] as Leaflet.LatLngTuple),
        );
        L.polygon(
          [
            [
              [-85, -180],
              [-85, 180],
              [85, 180],
              [85, -180],
            ],
            ...rings,
          ],
          {
            pane: "city-mask",
            stroke: false,
            fillColor: c.background,
            fillOpacity: 1,
            interactive: false,
          },
        ).addTo(map);
        city.boundary.coordinates.forEach((polygon) =>
          polygon.slice(1).forEach((hole) =>
            L.polygon(
              hole.map(([lon, lat]) => [lat!, lon!] as Leaflet.LatLngTuple),
              {
                pane: "city-mask",
                stroke: false,
                fillColor: c.background,
                fillOpacity: 1,
                interactive: false,
              },
            ).addTo(map),
          ),
        );
        L.geoJSON(city.boundary as GeoJSON.GeoJsonObject, {
          pane: "city-mask",
          style: { color: c.primary, weight: 2, fill: false },
          interactive: false,
        }).addTo(map);
        overlay.current = L.layerGroup().addTo(map);
        resize = new ResizeObserver(() =>
          map.invalidateSize({ animate: false }),
        );
        resize.observe(host.current);
        setRevision((n) => n + 1);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
      resize?.disconnect();
      overlay.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // A city change replaces the map and its camera restrictions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city.id, retry]);
  useEffect(() => {
    const L = leaflet.current,
      map = mapRef.current,
      layer = overlay.current;
    if (!revision || !L || !map || !layer) return;
    layer.clearLayers();
    L.circle([location.latitude, location.longitude], {
      radius: location.radiusKm * 1000,
      color: c.primary,
      weight: 1.5,
      fillColor: c.primary,
      fillOpacity: 0.07,
      interactive: false,
    }).addTo(layer);
    L.circleMarker([location.latitude, location.longitude], {
      radius: 7,
      color: c.surface,
      weight: 3,
      fillColor: c.primary,
      fillOpacity: 1,
      interactive: false,
    }).addTo(layer);
    let active = true;
    mapMarkers(people, atMaxZoom).forEach((entry) => {
      const group = entry.people;
      const person = group[0]!;
      const label =
        group.length > 1
          ? `${group.length} akun di ${person.areaLabel}`
          : `${person.name}, lokasi perkiraan`;
      const content = document.createElement("span");
      content.className = "profile-pin";
      if (group.length > 1) content.textContent = String(group.length);
      else {
        const picture = document.createElement("img");
        picture.alt = "";
        const fallback =
          "data:image/svg+xml," +
          encodeURIComponent(
            controls.person.replaceAll("currentColor", c.primary),
          );
        picture.src = fallback;
        picture.style.cssText = `width:44px;height:44px;object-fit:cover;border-radius:50%;background:${person.role === "worker" ? c.primaryContainer : c.warmContainer}`;
        picture.onerror = () => {
          picture.onerror = null;
          picture.src = fallback;
        };
        content.appendChild(picture);
        if (person.photoReady)
          void readPhoto(api, person.id, person.role)
            .then((uri) => {
              if (active && uri) picture.src = uri;
            })
            .catch(() => {});
      }
      if (entry.displaced)
        L.polyline(
          [
            [person.latitude, person.longitude],
            [entry.latitude, entry.longitude],
          ],
          { color: c.primary, weight: 2, interactive: false },
        ).addTo(layer);
      const marker = L.marker([entry.latitude, entry.longitude], {
        icon: L.divIcon({
          html: content,
          className: "upahgo-marker",
          iconSize: [56, 66],
          iconAnchor: [28, 66],
        }),
        keyboard: true,
        title: label,
        alt: label,
      });
      marker.on("click", () => {
        if (group.length > 1) {
          // A closer view keeps city bounds from recentering a selected cluster.
          map.setView(
            [person.latitude, person.longitude],
            Math.max(map.getZoom(), 16),
            {
              animate: false,
            },
          );
          callbacks.current.onGroupSelect?.(group);
        } else callbacks.current.onSelect(person);
      });
      marker.addTo(layer);
      marker.getElement()?.setAttribute("aria-label", label);
    });
    return () => {
      active = false;
    };
  }, [people, location, revision, atMaxZoom, api]);
  useEffect(() => {
    const L = leaflet.current,
      map = mapRef.current;
    if (!revision || !L || !map) return;
    const delta = location.radiusKm / 111;
    map.fitBounds(
      [
        [
          Math.max(city.bounds.south, location.latitude - delta),
          Math.max(city.bounds.west, location.longitude - delta),
        ],
        [
          Math.min(city.bounds.north, location.latitude + delta),
          Math.min(city.bounds.east, location.longitude + delta),
        ],
      ],
      {
        animate: false,
        paddingTopLeft: [28, 88],
        paddingBottomRight: [64, 84],
        maxZoom: 15,
      },
    );
  }, [
    location.capturedAt,
    location.radiusKm,
    location.latitude,
    location.longitude,
    city.bounds,
    revision,
  ]);
  return (
    <View
      style={{ flex: 1, minHeight: 300, backgroundColor: c.primaryContainer }}
    >
      <div
        ref={host}
        data-testid="discovery-map"
        role="region"
        aria-label={`Peta ${city.label}, radius ${location.radiusKm} kilometer`}
        style={{ position: "absolute", inset: 0, zIndex: 0 }}
      />
      {atMaxZoom && mapMarkers(people, true).some((m) => m.displaced) && (
        <View
          style={{
            position: "absolute",
            bottom: 94,
            left: 12,
            right: 68,
            padding: 12,
            borderRadius: 16,
            backgroundColor: c.infoContainer,
          }}
        >
          <Text style={[s.small, { color: c.info }]}>
            Pin dipisah agar bisa dipilih. Titik asal tetap lokasi perkiraan.
          </Text>
        </View>
      )}
      {(tileError || loadError) && (
        <View
          style={{
            position: "absolute",
            bottom: 126,
            left: 12,
            right: 68,
            backgroundColor: c.surface,
            padding: 10,
            borderRadius: 12,
          }}
        >
          <Text style={s.small}>
            {loadError
              ? "Peta belum berhasil dibuka."
              : "Peta dasar belum termuat. Titik dan daftar tetap tersedia."}
          </Text>
          <TextButton
            onPress={() => {
              setTileError(false);
              setRetry((n) => n + 1);
            }}
          >
            Coba lagi
          </TextButton>
        </View>
      )}
    </View>
  );
}
