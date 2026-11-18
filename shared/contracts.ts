import type { Effort, WorkContext } from "./jobs";
export type Role = "worker" | "employer";
export type Tag = { id: string; label: string };
export type Area = {
  id: string;
  cityId: string | null;
  label: string;
  latitude: number;
  longitude: number;
  timezone: string;
};
export type City = {
  id: string;
  label: string;
  bounds: { south: number; north: number; west: number; east: number };
  boundary: { type: "MultiPolygon"; coordinates: number[][][][] };
  attribution: string;
};
export type DiscoveryLocation = {
  cityId: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  accuracyMeters: number;
  capturedAt: string;
};
export const radiusOptions = [1, 3, 5, 10, 20] as const;
export type Profile = {
  id: string;
  name: string;
  region: string;
  areaId: string | null;
  role: Role;
  tags: string[];
  bio: string;
  whatsappReady: boolean;
  status: "active" | "deletion_requested";
  visibleUntil: string | null;
  acceptedEfforts?: Effort[];
  workContext?: WorkContext | null;
  photoStatus?: "pending" | "approved" | "rejected" | null;
  priceAmount?: number | null;
  priceNegotiable?: boolean;
};
export type Person = {
  id: string;
  name: string;
  role: Role;
  areaId: string;
  areaLabel: string;
  latitude: number;
  longitude: number;
  tags: string[];
  bio: string;
  expiresAt: string;
  distanceKm: number;
  ratingAverage: number | null;
  ratingCount: number;
  acceptedEfforts?: Effort[];
  workContext?: WorkContext | null;
  effort?: Effort | "unknown";
  photoReady?: boolean;
  priceAmount?: number | null;
  priceNegotiable?: boolean;
};
export type Review = {
  id: string;
  agreementId: string;
  reviewerName: string;
  score: number;
  comment: string;
  createdAt: string;
};
export type AgreementReviews = {
  received: Review | null;
  submitted: Review | null;
};
export type ContactStatus =
  "pending" | "accepted" | "declined" | "cancelled" | "revoked" | "expired";
export type Contact = {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  receiverName: string;
  senderRole: Role;
  receiverRole: Role;
  status: ContactStatus;
  expiresAt: string;
  createdAt: string;
};
export type AgreementStatus =
  "proposed" | "agreed" | "completion_requested" | "completed" | "cancelled";
export type Agreement = {
  id: string;
  contactId: string;
  workerId: string;
  employerId: string;
  creatorId: string;
  workerName: string;
  employerName: string;
  title: string;
  tasks: string;
  wage: number;
  startsAt: string;
  timezone: string;
  status: AgreementStatus;
  paymentReceivedAt: string | null;
  createdAt: string;
  workContext?: WorkContext | null;
};
export type JobSuggestion = {
  id: string;
  title: string;
  detail: string;
  status: "pending";
  createdAt: string;
};
export type Notice = {
  id: string;
  title: string;
  body: string;
  route: string;
  read: boolean;
  createdAt: string;
};
export type Account = {
  id: string;
  role: Role | null;
  introSeen: boolean;
  setupDone: boolean;
  browseAreaId: string | null;
  status: "active" | "restricted" | "deletion_requested";
  location: DiscoveryLocation | null;
};
export type Bootstrap = {
  deletionPolicy?: {
    enabled: boolean;
    version: string;
    workDays: number;
    reportDays: number;
    backupDays: number;
  };
  account: Account;
  profile: Profile | null;
  areas: Area[];
  tags: Tag[];
  city: City | null;
};
export const operations = [
  "bootstrap",
  "onboarding",
  "set_role",
  "set_area",
  "set_location",
  "set_radius",
  "save_profile",
  "discover",
  "profile",
  "visibility",
  "contacts",
  "contact",
  "request_contact",
  "respond_contact",
  "revoke_contact",
  "approved_contact",
  "agreements",
  "agreement",
  "create_agreement",
  "agreement_action",
  "report",
  "block",
  "unblock",
  "notifications",
  "read_notification",
  "request_deletion",
  "reviews",
  "agreement_reviews",
  "submit_review",
  "suggest_job",
  "job_suggestions",
  "photo_access",
] as const;
export type Operation = (typeof operations)[number];
export const readOperations: ReadonlySet<Operation> = new Set([
  "bootstrap",
  "discover",
  "profile",
  "contacts",
  "contact",
  "approved_contact",
  "agreements",
  "agreement",
  "notifications",
  "reviews",
  "agreement_reviews",
  "job_suggestions",
  "photo_access",
]);
export type ActionResults = {
  bootstrap: Bootstrap;
  onboarding: Account;
  set_role: Account;
  set_area: Account;
  set_location: Account;
  set_radius: Account;
  save_profile: Profile;
  discover: Person[];
  profile: Person;
  visibility: Profile;
  contacts: Contact[];
  contact: Contact;
  request_contact: Contact;
  respond_contact: Contact;
  revoke_contact: Contact;
  approved_contact: { phone: string };
  agreements: Agreement[];
  agreement: Agreement;
  create_agreement: Agreement;
  agreement_action: Agreement;
  report: { id: string };
  block: { ok: true };
  unblock: { ok: true };
  notifications: Notice[];
  read_notification: { ok: true };
  request_deletion: { ok: true };
  reviews: Review[];
  agreement_reviews: AgreementReviews;
  submit_review: Review;
  suggest_job: JobSuggestion;
  job_suggestions: JobSuggestion[];
  photo_access: {
    key: string | null;
    status: "pending" | "approved" | "rejected" | null;
  };
};
export type ActionArgs = Record<string, unknown>;
export type HistoryCursor = { id: string; createdAt: string };
export const historyPageSize = 100;
export function cloneData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
export function profileReady(profile: Profile | null | undefined): boolean {
  return (
    !!profile &&
    profile.status === "active" &&
    !!profile.areaId &&
    profile.tags.length > 0
  );
}
export function entryRoute(
  data: Bootstrap,
): "/onboarding" | "/role" | "/location" | "/setup" | "/(tabs)/home" {
  if (!data.account.introSeen) return "/onboarding";
  if (!data.account.role) return "/role";
  if (!data.account.location) return "/location";
  if (!data.account.setupDone) return "/setup";
  return "/(tabs)/home";
}
export interface Api {
  call<K extends Operation>(
    operation: K,
    args?: ActionArgs,
  ): Promise<ActionResults[K]>;
}

export function normalizePhone(input: string): string {
  const digits = input.replace(/[\s()-]/g, "");
  const normalized = digits.startsWith("08")
    ? "+62" + digits.slice(1)
    : digits.startsWith("62")
      ? "+" + digits
      : digits;
  if (!/^\+628[1-9][0-9]{7,10}$/.test(normalized))
    throw new Error("PHONE_INVALID");
  return normalized;
}

export function validateProfile(
  input: Pick<Profile, "name" | "region" | "tags" | "bio">,
): void {
  if (
    input.name.trim().length < 2 ||
    input.name.length > 60 ||
    /https?:|\d{5}/i.test(input.name)
  )
    throw new Error("PROFILE_INVALID");
  if (
    input.region.trim().length < 3 ||
    input.region.length > 100 ||
    input.bio.length > 240
  )
    throw new Error("PROFILE_INVALID");
  if (input.tags.length > 5 || new Set(input.tags).size !== input.tags.length)
    throw new Error("TAGS_INVALID");
  if (/https?:|\+?\d[\d\s()-]{7,}/i.test(input.bio))
    throw new Error("PUBLIC_CONTACT_FORBIDDEN");
}

export function validateProfilePrice(
  amount: unknown,
  negotiable: unknown,
): void {
  if (
    typeof negotiable !== "boolean" ||
    (amount === null
      ? negotiable
      : typeof amount !== "number" ||
        !Number.isInteger(amount) ||
        amount < 1000 ||
        amount > 50000000)
  )
    throw new Error("PRICE_INVALID");
}

export function parsePriceAmount(input: string): number {
  if (!/^\d{1,8}$/.test(input)) throw new Error("PRICE_INVALID");
  const amount = Number(input);
  validateProfilePrice(amount, false);
  return amount;
}

export function canTransitionAgreement(
  agreement: Agreement,
  actorId: string,
  action: string,
): boolean {
  const participant =
    actorId === agreement.workerId || actorId === agreement.employerId;
  if (!participant) return false;
  if (action === "accept")
    return agreement.status === "proposed" && actorId !== agreement.creatorId;
  if (action === "cancel")
    return agreement.status === "proposed" || agreement.status === "agreed";
  if (action === "request_completion")
    return agreement.status === "agreed" && actorId === agreement.workerId;
  if (action === "confirm_completion")
    return (
      agreement.status === "completion_requested" &&
      actorId === agreement.employerId
    );
  if (action === "acknowledge_payment")
    return (
      agreement.status === "completed" &&
      actorId === agreement.workerId &&
      !agreement.paymentReceivedAt
    );
  return false;
}

export function formatWage(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function whatsappUrl(phone: string): string {
  if (!/^\+?[1-9][0-9]{7,14}$/.test(phone)) throw new Error("PHONE_INVALID");
  return `https://wa.me/${phone.replace(/^\+/, "")}`;
}
export function scheduleIso(date: string, time: string, zone: string): string {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
  )
    throw new Error("AGREEMENT_INVALID");
  const offsets: Record<string, string> = {
    "Asia/Jakarta": "+07:00",
    "Asia/Makassar": "+08:00",
    "Asia/Jayapura": "+09:00",
  };
  if (!offsets[zone]) throw new Error("AGREEMENT_INVALID");
  const calendar = new Date(`${date}T00:00:00Z`);
  if (
    !Number.isFinite(calendar.getTime()) ||
    calendar.toISOString().slice(0, 10) !== date
  )
    throw new Error("AGREEMENT_INVALID");
  const result = new Date(`${date}T${time}:00${offsets[zone]}`);
  if (!Number.isFinite(result.getTime())) throw new Error("AGREEMENT_INVALID");
  return result.toISOString();
}

export const errors: Record<string, string> = {
  PRICE_INVALID: "Isi nominal utuh antara Rp1.000 dan Rp50.000.000.",
  PHOTO_INVALID: "Foto belum dapat diproses. Pilih gambar lain, maksimal 5 MB.",
  PHOTO_UNAVAILABLE:
    "Layanan foto belum tersedia. Profil tetap bisa digunakan tanpa foto.",
  SUGGESTION_INVALID:
    "Isi nama pekerjaan 3–80 karakter dan rincian 10–1000 karakter, tanpa nomor atau tautan.",
  CONTEXT_INVALID:
    "Periksa rincian tenaga, jumlah, durasi, alat dan akses pekerjaan.",
  FILTER_INVALID: "Filter tidak valid. Reset filter lalu coba lagi.",
  POPUP_BLOCKED: "Izinkan jendela masuk Google pada browser, lalu coba lagi.",
  AUTH_CANCELLED:
    "Masuk dibatalkan atau waktunya habis. Coba kembali saat siap.",
  UNAUTHENTICATED: "Sesi berakhir. Silakan masuk kembali.",
  UNAVAILABLE: "Data sudah berubah atau tidak dapat diakses. Perbarui halaman.",
  FORBIDDEN: "Tindakan ini tidak diizinkan untuk akunmu.",
  RATE_LIMITED: "Terlalu banyak permintaan. Tunggu sebentar, lalu coba lagi.",
  PROFILE_INVALID:
    "Periksa nama dan daerah. Jangan cantumkan nomor atau tautan pada nama.",
  PROFILE_INCOMPLETE: "Lengkapi nama, area dan layanan untuk melanjutkan.",
  ROLE_REQUIRED: "Pilih peran terlebih dahulu.",
  TAGS_INVALID: "Pilih maksimal lima layanan yang tersedia.",
  PUBLIC_CONTACT_FORBIDDEN:
    "Jangan cantumkan nomor atau tautan pada profil publik.",
  PHONE_INVALID: "Gunakan nomor Indonesia yang valid, misalnya 08… atau +628….",
  PHONE_REQUIRED: "Verifikasi nomor WhatsApp di Akun sebelum berbagi kontak.",
  TARGET_PHONE_REQUIRED: "Akun ini belum menyiapkan nomor WhatsApp.",
  CONSENT_REQUIRED: "Setujui penjelasan pembagian nomor sebelum melanjutkan.",
  CONTACT_EXPIRED: "Izin kontak tidak berlaku lagi. Nomor tidak dapat dibuka.",
  INCOMING_REQUEST:
    "Ada permintaan dari orang ini. Buka Aktivitas untuk menanggapinya.",
  CONTACT_PENDING: "Permintaan yang sama masih menunggu respons.",
  AREA_REQUIRED: "Pilih area yang tersedia sebelum tampil di peta.",
  LOCATION_REQUIRED: "Aktifkan lokasi untuk melihat akun di sekitarmu.",
  LOCATION_DENIED:
    "Izin lokasi ditolak. Izinkan lokasi di pengaturan perangkat, lalu coba lagi.",
  LOCATION_DISABLED:
    "GPS belum aktif. Aktifkan lokasi perangkat, lalu coba lagi.",
  LOCATION_INACCURATE:
    "Lokasi belum cukup akurat. Coba di tempat terbuka, lalu ulangi.",
  LOCATION_UNSUPPORTED: "Lokasi tidak tersedia pada perangkat ini.",
  LOCATION_STALE: "Perbarui lokasi untuk melanjutkan pencarian.",
  CITY_UNAVAILABLE:
    "Wilayah ini belum tersedia. Akun dan riwayatmu tetap bisa diakses.",
  CITY_MISMATCH: "Pencarian dibatasi dalam kota atau kabupaten hasil GPS.",
  RADIUS_INVALID: "Pilih radius 1, 3, 5, 10, atau 20 km.",
  REVIEW_INVALID:
    "Pilih 1–5 bintang. Ulasan maksimal 300 karakter, tanpa nomor atau tautan.",
  REVIEW_NOT_ALLOWED:
    "Penilaian hanya untuk peserta pekerjaan yang sudah selesai.",
  REVIEW_EXISTS: "Penilaian untuk pekerjaan ini sudah dikirim.",
  TAGS_REQUIRED: "Pilih minimal satu layanan atau kebutuhan sebelum tampil.",
  AGREEMENT_INVALID: "Periksa tugas, upah, tanggal, dan waktu pekerjaan.",
  STATE_CONFLICT: "Status berubah. Perbarui halaman sebelum mencoba kembali.",
  REPORT_INVALID: "Pilih kategori dan tulis keterangan 10–1000 karakter.",
  ACCOUNT_RESTRICTED: "Akun sedang dibatasi atau menunggu penghapusan.",
  GATEWAY_NOT_CONFIGURED:
    "Layanan belum selesai dikonfigurasi. Mode demo tetap tersedia.",
  NETWORK_ERROR: "Koneksi belum berhasil. Periksa jaringan, lalu coba lagi.",
};
export function errorMessage(error: unknown): string {
  const code = error instanceof Error ? error.message : "";
  return (
    errors[code] ??
    "Permintaan belum berhasil. Coba lagi; masukanmu tetap disimpan."
  );
}
