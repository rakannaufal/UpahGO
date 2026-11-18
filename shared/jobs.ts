import catalog from "./job-catalog.json" with { type: "json" };
export type Effort = "light" | "medium" | "heavy";
export const effortLabels: Record<Effort | "unknown", string> = {
  light: "Ringan",
  medium: "Sedang",
  heavy: "Berat",
  unknown: "Perlu rincian",
};
export type WorkContext = {
  durationMinutes: number;
  quantity: number;
  loadKg: number;
  floors: number;
  lift: boolean;
  distanceMeters: number;
  workers: number;
  tools: string;
};
export type Job = {
  id: string;
  code: string;
  label: string;
  categoryId: string;
  baseline: string[];
  contextHint: string;
  artworkKey: string;
  enabled: boolean;
  demoEnabled: boolean;
  aliases: string;
};
export const jobs: Job[] = catalog.jobs;
export const categories = catalog.categories;
export function jobById(id: string | undefined) {
  return jobs.find((j) => j.id === id);
}
export function validateWorkContext(value: unknown): WorkContext | null {
  if (value == null) return null;
  if (typeof value !== "object" || Array.isArray(value))
    throw new Error("CONTEXT_INVALID");
  const c = value as WorkContext;
  const ranges = {
    durationMinutes: [1, 720],
    quantity: [1, 1000],
    loadKg: [0, 500],
    floors: [0, 50],
    distanceMeters: [0, 10000],
    workers: [1, 50],
  };
  if (
    Object.keys(c).some(
      (k) => ![...Object.keys(ranges), "lift", "tools"].includes(k),
    )
  )
    throw new Error("CONTEXT_INVALID");
  for (const [key, [min, max]] of Object.entries(ranges)) {
    const n = c[key as keyof typeof ranges];
    if (
      typeof n !== "number" ||
      !Number.isFinite(n) ||
      n < min! ||
      n > max! ||
      (key !== "loadKg" && !Number.isInteger(n))
    )
      throw new Error("CONTEXT_INVALID");
  }
  if (
    typeof c.lift !== "boolean" ||
    typeof c.tools !== "string" ||
    c.tools.trim().length < 2 ||
    c.tools.length > 160 ||
    /https?:|www\.|\+?\d[\d ()-]{7,}/i.test(c.tools)
  )
    throw new Error("CONTEXT_INVALID");
  return c;
}
// Conservative product estimates, never a safe lifting limit or medical assessment.
export function estimateEffort(
  tags: string[],
  context: WorkContext | null | undefined,
): Effort | "unknown" {
  if (!context || !tags.length || tags.some((t) => !jobById(t)))
    return "unknown";
  validateWorkContext(context);
  if (
    tags.includes("water-carry") ||
    context.loadKg >= 15 ||
    context.durationMinutes > 240 ||
    (context.floors > 0 && !context.lift && context.loadKg > 5)
  )
    return "heavy";
  if (tags.some((t) => jobById(t)!.baseline.includes("heavy"))) return "heavy";
  if (
    context.loadKg > 0 ||
    context.durationMinutes > 60 ||
    context.quantity > 2 ||
    context.distanceMeters > 100 ||
    tags.some(
      (t) =>
        jobById(t)!.baseline.length === 1 &&
        jobById(t)!.baseline[0] === "medium",
    )
  )
    return "medium";
  return "light";
}
export function validateEfforts(value: unknown): Effort[] {
  if (
    !Array.isArray(value) ||
    value.length > 3 ||
    new Set(value).size !== value.length ||
    value.some((e) => !["light", "medium", "heavy"].includes(e))
  )
    throw new Error("CONTEXT_INVALID");
  return value as Effort[];
}
export type DiscoveryFilters = {
  query: string;
  category: string;
  tag: string;
  effort: string;
  sort: "distance" | "rating";
};
export const emptyFilters: DiscoveryFilters = {
  query: "",
  category: "",
  tag: "",
  effort: "",
  sort: "distance",
};
export function matchesJobSearch(tags: string[], name: string, query: string) {
  const text = [
    name,
    ...tags.map((t) => {
      const j = jobById(t);
      return `${j?.label ?? t} ${j?.aliases ?? ""}`;
    }),
  ]
    .join(" ")
    .toLocaleLowerCase("id-ID");
  return text.includes(query.trim().toLocaleLowerCase("id-ID"));
}
export function validateJobSuggestion(title: string, detail: string) {
  if (
    title.trim().length < 3 ||
    title.length > 80 ||
    detail.trim().length < 10 ||
    detail.length > 1000 ||
    /https?:|www\.|\+?\d[\d ()-]{7,}/i.test(title + " " + detail)
  )
    throw new Error("SUGGESTION_INVALID");
}
