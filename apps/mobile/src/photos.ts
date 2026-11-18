import { supabase } from "./auth";
import { DemoApi } from "./demo";
import type { Api, Role } from "../../../shared/contracts";
export async function photoRequest(
  api: Api,
  method: "GET" | "POST" | "DELETE",
  params = "",
  base64?: string,
  expectedActor?: string,
) {
  if (api instanceof DemoApi) {
    if (method !== "GET" && api.actor !== expectedActor)
      throw new Error("UNAUTHENTICATED");
    const key = api.actor + ":" + api.account().role;
    if (method === "POST" && base64) {
      api.photos[key] = "data:image/jpeg;base64," + base64;
      api.profile()!.photoStatus = "pending";
    }
    if (method === "DELETE") {
      delete api.photos[key];
      api.profile()!.photoStatus = null;
    }
    const query = new URLSearchParams(params);
    return {
      cleanup: method === "DELETE" ? "simulated" : undefined,
      uri:
        method === "GET" && query.get("id") === api.actor
          ? (api.photos[api.actor + ":" + query.get("role")] ?? null)
          : null,
    };
  }
  const base = process.env.EXPO_PUBLIC_API_URL;
  if (!base || !supabase) throw new Error("PHOTO_UNAVAILABLE");
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("UNAUTHENTICATED");
  if (method !== "GET" && data.session.user.id !== expectedActor)
    throw new Error("UNAUTHENTICATED");
  const bytes = base64
    ? Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
    : undefined;
  let response: Response;
  try {
    response = await fetch(
      `${base.replace(/\/$/, "")}/v1/photo${params ? "?" + params : ""}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
          "Content-Type": "image/jpeg",
          "x-upahgo-photo-consent": "true",
        },
        body: bytes?.buffer,
        signal: AbortSignal.timeout(30000),
      },
    );
  } catch {
    throw new Error("NETWORK_ERROR");
  }
  const result = await response.json();
  if (!response.ok || result.error)
    throw new Error(result.error ?? "PHOTO_UNAVAILABLE");
  return result.data as {
    uri?: string | null;
    cleanup?: "queued" | "simulated";
  };
}
export async function readPhoto(
  api: Api,
  id: string,
  role: Role,
  detail = false,
) {
  const result = await photoRequest(
    api,
    "GET",
    new URLSearchParams({
      id,
      role,
      size: detail ? "detail" : "thumb",
    }).toString(),
  );
  if (!result.uri || api instanceof DemoApi) return result.uri ?? null;
  const url = new URL(result.uri);
  const service = new URL(process.env.EXPO_PUBLIC_SUPABASE_URL!);
  if (
    url.origin !== service.origin ||
    !url.pathname.startsWith("/storage/v1/object/sign/profile-photos/")
  )
    throw new Error("PHOTO_UNAVAILABLE");
  const response = await fetch(url.toString(), {
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("PHOTO_UNAVAILABLE");
  const blob = await response.blob();
  if (blob.size > 1024 * 1024 || blob.type !== "image/jpeg")
    throw new Error("PHOTO_INVALID");
  // Render bytes in memory, rather than handing private signed URLs to native disk image caches.
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("PHOTO_UNAVAILABLE"));
    reader.readAsDataURL(blob);
  });
}
