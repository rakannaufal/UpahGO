import type {
  City,
  DiscoveryLocation,
  Person,
} from "../../../shared/contracts";
export type MapProps = {
  people: Person[];
  city: City;
  location: DiscoveryLocation;
  onSelect: (p: Person) => void;
  onGroupSelect?: (people: Person[]) => void;
};
export function markerGroups(people: Person[]): Person[][] {
  return Object.values(
    people.reduce<Record<string, Person[]>>((all, p) => {
      (all[`${p.latitude}:${p.longitude}`] ??= []).push(p);
      return all;
    }, {}),
  );
}

export type MapMarker = {
  people: Person[];
  latitude: number;
  longitude: number;
  displaced: boolean;
};
const worldSize = 256 * 2 ** 18;
function project(person: Pick<Person, "latitude" | "longitude">) {
  const sin = Math.sin(
    (Math.max(-85, Math.min(85, person.latitude)) * Math.PI) / 180,
  );
  return {
    x: ((person.longitude + 180) / 360) * worldSize,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * worldSize,
  };
}
function unproject(x: number, y: number) {
  return {
    longitude: (x / worldSize) * 360 - 180,
    latitude:
      (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / worldSize))) * 180) /
      Math.PI,
  };
}

// Displacement is presentation only; never write these points to public profiles or search origins.
export function mapMarkers(people: Person[], atMaxZoom: boolean): MapMarker[] {
  if (!atMaxZoom)
    return markerGroups(people).map((group) => ({
      people: group,
      latitude: group[0]!.latitude,
      longitude: group[0]!.longitude,
      displaced: false,
    }));
  const sorted = [...people].sort((a, b) => a.id.localeCompare(b.id));
  const groups: Person[][] = [];
  const remaining = new Set(sorted);
  for (const person of sorted) {
    if (!remaining.delete(person)) continue;
    const group = [person];
    for (let i = 0; i < group.length; i++) {
      const point = project(group[i]!);
      for (const next of remaining) {
        const other = project(next);
        if (Math.hypot(point.x - other.x, point.y - other.y) < 60) {
          remaining.delete(next);
          group.push(next);
        }
      }
    }
    groups.push(group);
  }
  const markers = groups.flatMap<MapMarker>((group) => {
    if (group.length === 1)
      return [
        {
          people: group,
          latitude: group[0]!.latitude,
          longitude: group[0]!.longitude,
          displaced: false,
        },
      ];
    const points = group.map(project);
    const center = {
      x: points.reduce((n, p) => n + p.x, 0) / points.length,
      y: points.reduce((n, p) => n + p.y, 0) / points.length,
    };
    const radius = Math.max(48, (group.length * 72) / (2 * Math.PI));
    return group.map((p, index) => {
      const angle = (index / group.length) * 2 * Math.PI - Math.PI / 2;
      return {
        people: [p],
        ...unproject(
          center.x + radius * Math.cos(angle),
          center.y + radius * Math.sin(angle),
        ),
        displaced: true,
      };
    });
  });
  const placed: { x: number; y: number }[] = [];
  return markers.map((marker) => {
    const original = project(marker);
    let point = original;
    const collides = () =>
      placed.some((p) => Math.hypot(p.x - point.x, p.y - point.y) < 64);
    for (let ring = 1; collides(); ring++) {
      for (let i = 0; i < ring * 8; i++) {
        const angle = (i / (ring * 8)) * 2 * Math.PI;
        point = {
          x: original.x + ring * 72 * Math.cos(angle),
          y: original.y + ring * 72 * Math.sin(angle),
        };
        if (!collides()) break;
      }
    }
    placed.push(point);
    return point === original
      ? marker
      : { ...marker, ...unproject(point.x, point.y), displaced: true };
  });
}
