import pekanbaru from "../../../shared/pekanbaru.json" with { type: "json" };
import { jobs } from "../../../shared/jobs.ts";
import type {
  Area,
  City,
  DiscoveryLocation,
  Profile,
} from "../../../shared/contracts";
export const demoCity = pekanbaru as City;
export const demoOrigin = { latitude: 0.507, longitude: 101.447 };
export const demoAreas: Area[] = [
  {
    id: "demo-area",
    cityId: "pekanbaru",
    label: "Sukajadi",
    latitude: 0.507,
    longitude: 101.447,
    timezone: "Asia/Jakarta",
  },
  {
    id: "demo-senapelan",
    cityId: "pekanbaru",
    label: "Senapelan",
    latitude: 0.529,
    longitude: 101.445,
    timezone: "Asia/Jakarta",
  },
  {
    id: "demo-marpoyan",
    cityId: "pekanbaru",
    label: "Marpoyan Damai",
    latitude: 0.481,
    longitude: 101.442,
    timezone: "Asia/Jakarta",
  },
  {
    id: "demo-binawidya",
    cityId: "pekanbaru",
    label: "Binawidya",
    latitude: 0.482,
    longitude: 101.394,
    timezone: "Asia/Jakarta",
  },
];
export const demoArea = demoAreas[0]!;
export function demoLocation(radiusKm = 5): DiscoveryLocation {
  return {
    ...demoOrigin,
    cityId: demoCity.id,
    radiusKm,
    accuracyMeters: 20,
    capturedAt: new Date().toISOString(),
  };
}
export const demoTags = jobs
  .filter((j) => j.demoEnabled)
  .map((j) => ({ id: j.id, label: j.label }));
export function seedProfiles(): Profile[] {
  const names = [
    "Dimas Saputra",
    "Siti Rahma",
    "Rudi Hartono",
    "Ayu Lestari",
    "Budi Santoso",
    "Nia Putri",
    "Rumah Bu Rina",
    "Kedai Pak Andi",
    "Rumah Kak Maya",
    "Kos Melati",
    "Rumah Pak Arif",
    "Ruko Cemerlang",
  ];
  return names.map((name, i) => ({
    id:
      i === 0 ? "demo-worker" : i === 6 ? "demo-employer" : `demo-person-${i}`,
    name,
    region: "Kota Pekanbaru",
    areaId: demoAreas[i % 6 === 5 ? 3 : i % 3]!.id,
    role: i < 6 ? "worker" : "employer",
    priceAmount:
      i % 6 === 5 ? null : (i < 6 ? 100000 : 120000) + (i % 6) * 15000,
    priceNegotiable: i % 6 !== 5 && i % 6 !== 2,
    tags: [
      ["sweep", "mop"],
      ["kitchen", "bathroom"],
      ["windows", "dust"],
      ["water-carry"],
      ["dishwash", "kitchen"],
      ["box-move"],
    ][i % 6]!,
    acceptedEfforts:
      i < 6
        ? i % 3 === 0
          ? ["light", "medium"]
          : i % 3 === 1
            ? ["medium"]
            : ["heavy"]
        : [],
    workContext:
      i < 6 || i % 6 === 5
        ? null
        : {
            durationMinutes: i % 6 === 0 || i % 6 === 2 ? 45 : 120,
            quantity: 2,
            loadKg: i % 6 === 3 ? 19 : 0,
            floors: 0,
            lift: false,
            distanceMeters: 10,
            workers: i % 6 === 3 ? 2 : 1,
            tools:
              i % 6 === 3 ? "Troli disediakan" : "Alat dan bahan disediakan",
          },
    bio:
      i < 6
        ? [
            "Bantu bersihkan rumah dan kos.",
            "Bersih-bersih dapur dan kamar mandi.",
            "Membersihkan jendela terjangkau dan debu.",
            "Bantu angkat galon dengan troli dan tenaga tambahan.",
            "Bantu mencuci piring dan membersihkan dapur.",
            "Bantu pindahkan kardus sesuai rincian beban.",
          ][i % 6]!
        : [
            "Butuh bantuan menyapu dan mengepel.",
            "Bersihkan dapur dan kamar mandi.",
            "Bantu bersihkan jendela dan debu.",
            "Butuh bantuan angkat galon. Troli disediakan, akses datar.",
            "Bantu mencuci piring dan membersihkan dapur.",
            "Butuh bantuan pindah kardus. Jumlah dan beban belum ditentukan.",
          ][i % 6]!,
    whatsappReady: true,
    status: "active",
    visibleUntil: new Date(Date.now() + 3600000).toISOString(),
  }));
}
