import "react-native-url-polyfill/auto";
import { createClient, processLock } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { nativeCallbackUrl } from "../../../shared/native-auth";
WebBrowser.maybeCompleteAuthSession();
const memory = new Map<string, string>();
const chunkSize = 1800;
function manifest(
  raw: string | null,
): { version: string; count: number } | null {
  try {
    const value = JSON.parse(raw ?? "null");
    return value &&
      /^[a-z0-9-]+$/.test(value.version) &&
      Number.isInteger(value.count) &&
      value.count > 0 &&
      value.count <= 32
      ? value
      : null;
  } catch {
    return null;
  }
}
// New chunks commit before the manifest switches; interrupted writes never expose a partial session.
const storage = {
  async getItem(key: string) {
    if (Platform.OS === "web") return memory.get(key) ?? null;
    const raw = await SecureStore.getItemAsync(key);
    if (!raw) return null;
    const saved = manifest(raw);
    if (!saved) return null;
    const { version, count } = saved;
    const chunks = await Promise.all(
      Array.from({ length: count }, (_, i) =>
        SecureStore.getItemAsync(`${key}.${version}.${i}`),
      ),
    );
    return chunks.some((x) => x === null) ? null : chunks.join("");
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === "web") {
      memory.set(key, value);
      return;
    }
    const previous = await SecureStore.getItemAsync(key);
    const version = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const count = Math.ceil(value.length / chunkSize);
    if (count > 32) throw new Error("SESSION_TOO_LARGE");
    for (let i = 0; i < count; i++)
      await SecureStore.setItemAsync(
        `${key}.${version}.${i}`,
        value.slice(i * chunkSize, (i + 1) * chunkSize),
        { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY },
      );
    await SecureStore.setItemAsync(key, JSON.stringify({ version, count }), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    const old = manifest(previous);
    if (old) {
      for (let i = 0; i < old.count; i++)
        await SecureStore.deleteItemAsync(`${key}.${old.version}.${i}`);
    }
  },
  async removeItem(key: string) {
    if (Platform.OS === "web") {
      memory.delete(key);
      return;
    }
    const raw = await SecureStore.getItemAsync(key);
    await SecureStore.deleteItemAsync(key);
    const old = manifest(raw);
    if (old) {
      for (let i = 0; i < old.count; i++)
        await SecureStore.deleteItemAsync(`${key}.${old.version}.${i}`);
    }
  },
};
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const supabase =
  url && key
    ? createClient(url, key, {
        auth: {
          storage,
          persistSession: true,
          autoRefreshToken: Platform.OS !== "web",
          detectSessionInUrl: false,
          flowType: "pkce",
          lock: processLock,
        },
      })
    : null;
export function callbackUrl() {
  return Platform.OS === "web"
    ? `${window.location.origin}/auth/callback`
    : nativeCallbackUrl(Constants.expoConfig?.scheme);
}
export function validateCallback(url: string) {
  const expected = new URL(callbackUrl());
  const actual = new URL(url);
  return (
    actual.protocol === expected.protocol &&
    actual.host === expected.host &&
    actual.pathname === expected.pathname &&
    !actual.hash
  );
}
const exchanges = new Map<string, Promise<void>>();
export async function exchangeCallback(url: string) {
  if (!supabase || !validateCallback(url)) throw new Error("UNAUTHENTICATED");
  const parsed = new URL(url);
  const codes = parsed.searchParams.getAll("code");
  if (codes.length !== 1 || !codes[0] || parsed.searchParams.has("error"))
    throw new Error("UNAUTHENTICATED");
  const code = codes[0];
  const existing = exchanges.get(code);
  if (existing) return existing;
  const exchange = (async () => {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw new Error("UNAUTHENTICATED");
  })();
  exchanges.set(code, exchange);
  setTimeout(() => exchanges.delete(code), 60000);
  return exchange;
}
export async function signInGoogle() {
  if (!supabase) throw new Error("GATEWAY_NOT_CONFIGURED");
  const popup =
    Platform.OS === "web"
      ? window.open(
          "about:blank",
          "upahgo-google",
          "popup,width=480,height=700",
        )
      : null;
  if (Platform.OS === "web" && !popup) throw new Error("POPUP_BLOCKED");
  const redirectTo = callbackUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data.url) {
    popup?.close();
    throw new Error("UNAUTHENTICATED");
  }
  const authUrl = new URL(data.url);
  if (
    authUrl.origin !== new URL(url!).origin ||
    authUrl.pathname !== "/auth/v1/authorize"
  ) {
    popup?.close();
    throw new Error("UNAUTHENTICATED");
  }
  if (Platform.OS === "web" && popup) {
    return new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        window.removeEventListener("message", listener);
        clearInterval(timer);
        popup.close();
      };
      const listener = (event: MessageEvent) => {
        if (
          event.source !== popup ||
          event.origin !== window.location.origin ||
          event.data?.type !== "upahgo-oauth"
        )
          return;
        const callback = event.data.url;
        cleanup();
        if (typeof callback !== "string" || !validateCallback(callback)) {
          reject(new Error("UNAUTHENTICATED"));
          return;
        }
        exchangeCallback(callback).then(resolve, reject);
      };
      const started = Date.now();
      const timer = setInterval(() => {
        if (popup.closed || Date.now() - started > 300000) {
          cleanup();
          reject(new Error("AUTH_CANCELLED"));
        }
      }, 500);
      window.addEventListener("message", listener);
      popup.location.href = data.url;
    });
  }
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type === "success") await exchangeCallback(result.url);
  else throw new Error("AUTH_CANCELLED");
}
