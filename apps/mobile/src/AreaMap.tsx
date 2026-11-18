import React, { useRef, useState } from "react";
import Constants from "expo-constants";
import { View } from "react-native";
import MapView, {
  Circle,
  Marker,
  Polygon,
  Polyline,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import { Note } from "./ui";
import { c } from "./theme";
import { mapMarkers, type MapProps } from "./map-model";
import { ProfilePin } from "./ProfilePin";
export function AreaMap({
  people,
  city,
  location,
  onSelect,
  onGroupSelect,
}: MapProps) {
  const map = useRef<MapView>(null);
  const [atMaxZoom, setAtMaxZoom] = useState(false);
  if (!Constants.expoConfig?.extra?.mapsConfigured)
    return (
      <View style={{ padding: 16, paddingTop: 100 }}>
        <Note>
          Peta Android belum dikonfigurasi. Buka daftar untuk melihat akun.
        </Note>
      </View>
    );
  return (
    <MapView
      ref={map}
      provider={PROVIDER_GOOGLE}
      style={{ flex: 1, minHeight: 300 }}
      key={city.id}
      initialRegion={{
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      }}
      onMapReady={() =>
        map.current?.setMapBoundaries(
          { latitude: city.bounds.north, longitude: city.bounds.east },
          { latitude: city.bounds.south, longitude: city.bounds.west },
        )
      }
      minZoomLevel={11}
      maxZoomLevel={18}
      onRegionChangeComplete={() => {
        void map.current
          ?.getCamera()
          .then((camera) => setAtMaxZoom((camera.zoom ?? 0) >= 17.9))
          .catch(() => {});
      }}
      showsUserLocation={false}
      showsMyLocationButton={false}
      toolbarEnabled={false}
      zoomControlEnabled
      mapPadding={{ top: 76, right: 8, bottom: 78, left: 8 }}
    >
      <Circle
        center={location}
        radius={location.radiusKm * 1000}
        strokeColor={c.primary}
        fillColor="rgba(1,76,36,0.07)"
        strokeWidth={1.5}
      />
      <Polygon
        coordinates={[
          { latitude: -85, longitude: -180 },
          { latitude: -85, longitude: 180 },
          { latitude: 85, longitude: 180 },
          { latitude: 85, longitude: -180 },
        ]}
        holes={city.boundary.coordinates.map((poly) =>
          poly[0]!.map(([longitude, latitude]) => ({
            latitude: latitude!,
            longitude: longitude!,
          })),
        )}
        fillColor={c.background}
        strokeWidth={0}
      />
      {city.boundary.coordinates.map((poly, i) => (
        <Polygon
          key={i}
          coordinates={poly[0]!.map(([longitude, latitude]) => ({
            latitude: latitude!,
            longitude: longitude!,
          }))}
          strokeColor={c.primary}
          strokeWidth={2}
          fillColor="transparent"
        />
      ))}
      <Marker
        coordinate={location}
        title="Lokasimu (perkiraan)"
        pinColor={c.primary}
      />
      {mapMarkers(people, atMaxZoom).map((entry) => {
        const group = entry.people;
        const p = group[0]!;
        return (
          <React.Fragment key={p.id}>
            {entry.displaced && (
              <Polyline
                coordinates={[p, entry]}
                strokeColor={c.primary}
                strokeWidth={2}
              />
            )}
            <Marker
              coordinate={entry}
              anchor={{ x: 0.5, y: 1 }}
              title={
                group.length > 1
                  ? `${group.length} akun di ${p.areaLabel}`
                  : p.name
              }
              description={
                entry.displaced
                  ? "Pin dipisah untuk dipilih. Titik asal tetap lokasi perkiraan."
                  : "Lokasi perkiraan"
              }
              onPress={() => {
                if (group.length > 1) {
                  void map.current
                    ?.getCamera()
                    .then((camera) =>
                      map.current?.animateCamera(
                        { center: p, zoom: Math.max(camera.zoom ?? 0, 16) },
                        { duration: 0 },
                      ),
                    )
                    .catch(() => {});
                  onGroupSelect?.(group);
                } else onSelect(p);
              }}
            >
              <ProfilePin people={group} />
            </Marker>
          </React.Fragment>
        );
      })}
    </MapView>
  );
}
