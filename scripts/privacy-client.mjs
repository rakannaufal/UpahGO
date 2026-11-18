import { createClient } from "@supabase/supabase-js";

export function privacyClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || new URL(url).protocol !== "https:")
    throw new Error(
      "Privacy runner requires an explicit HTTPS Supabase URL and server service credential",
    );
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (url, options) =>
        fetch(url, {
          ...options,
          redirect: "error",
          signal: AbortSignal.timeout(15000),
        }),
    },
  });
}
