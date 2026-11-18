import { supabase } from "./auth";
import type { Api, ActionResults, Operation } from "../../../shared/contracts";
export const liveApi: Api = {
  async call<K extends Operation>(operation: K, args = {}) {
    const base = process.env.EXPO_PUBLIC_API_URL;
    if (!base || !supabase) throw new Error("GATEWAY_NOT_CONFIGURED");
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("UNAUTHENTICATED");
    let response: Response;
    try {
      response = await fetch(`${base.replace(/\/$/, "")}/v1/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({ operation, args }),
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new Error("NETWORK_ERROR");
    }
    const result = await response.json();
    if (!response.ok || result.error)
      throw new Error(result.error || "NETWORK_ERROR");
    if (operation === "bootstrap" && !result.data?.account?.id)
      throw new Error("GATEWAY_NOT_CONFIGURED");
    return result.data as ActionResults[K];
  },
};
