import test from "node:test";
import assert from "node:assert/strict";
import { mapMarkers } from "../apps/mobile/src/map-model.ts";
import type { Person } from "../shared/contracts.ts";

function person(id: string, longitude = 101.44, latitude = 0.51): Person {
  return { id, latitude, longitude } as Person;
}
function pixels(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const scale = 256 * 2 ** 18;
  const y = (lat: number) =>
    (Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) * scale) /
    (2 * Math.PI);
  return Math.hypot(
    ((a.longitude - b.longitude) * scale) / 360,
    y(a.latitude) - y(b.latitude),
  );
}
test("ordinary zoom keeps coincident public points grouped", () => {
  const people = [person("a"), person("b"), person("c", 101.45)];
  const markers = mapMarkers(people, false);
  assert.equal(markers.length, 2);
  assert.equal(markers[0]!.people.length, 2);
  assert.equal(markers[0]!.longitude, people[0]!.longitude);
  assert.equal(markers[0]!.displaced, false);
});
test("maximum zoom separates coincident and nearby pins without mutating public coordinates", () => {
  const people = [
    person("a"),
    person("b"),
    person("c", 101.44001),
    person("d", 101.5),
  ];
  const before = structuredClone(people);
  const markers = mapMarkers(people, true);
  assert.equal(markers.length, 4);
  assert.ok(markers.every((m) => m.people.length === 1));
  for (let i = 0; i < markers.length; i++)
    for (let j = i + 1; j < markers.length; j++)
      assert.ok(pixels(markers[i]!, markers[j]!) >= 60);
  assert.equal(markers.find((m) => m.people[0]!.id === "d")!.displaced, false);
  assert.deepEqual(people, before);
  assert.deepEqual(mapMarkers([...people].reverse(), true), markers);
  assert.deepEqual(
    mapMarkers(people, false).map((m) => m.people.length),
    [2, 1, 1],
  );
});
test("a dense group remains individually selectable", () => {
  const people = Array.from({ length: 40 }, (_, i) => person(String(i)));
  const markers = mapMarkers(people, true);
  assert.equal(markers.length, 40);
  for (let i = 0; i < markers.length; i++)
    for (let j = i + 1; j < markers.length; j++)
      assert.ok(pixels(markers[i]!, markers[j]!) >= 60);
  assert.deepEqual(mapMarkers([], true), []);
});
test("neighboring clusters cannot collide after their rings expand", () => {
  const step = 360 / (256 * 2 ** 18);
  const people = [
    person("a"),
    person("b"),
    person("c", 101.44 + step * 72),
    person("d", 101.44 + step * 72),
  ];
  const markers = mapMarkers(people, true);
  for (let i = 0; i < markers.length; i++)
    for (let j = i + 1; j < markers.length; j++)
      assert.ok(pixels(markers[i]!, markers[j]!) >= 60);
});
