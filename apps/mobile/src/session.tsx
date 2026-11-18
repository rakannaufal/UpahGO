import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, Platform } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./auth";
import { liveApi } from "./api";
import { DemoApi } from "./demo";
import { demoLocation } from "./demo-data";
import { readDeviceLocation } from "./device-location";
import type { Api, Bootstrap } from "../../../shared/contracts";
import { cloneData, errorMessage } from "../../../shared/contracts";
type State = {
  api: Api;
  demo: boolean;
  session: Session | null;
  ready: boolean;
  data: Bootstrap | null;
  error: string;
  refresh: () => Promise<void>;
  startDemo: () => void;
  switchDemo: (actor: "demo-me" | "demo-worker" | "demo-employer") => void;
  verifyDemoPhone: () => Promise<void>;
  logout: () => Promise<void>;
  locationIssue: string;
  locating: boolean;
  refreshLocation: (radiusKm?: number, prompt?: boolean) => Promise<void>;
};
const Context = createContext<State | null>(null);
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [demoApi, setDemoApi] = useState<DemoApi | null>(null);
  const [ready, setReady] = useState(!supabase);
  const [data, setData] = useState<Bootstrap | null>(null);
  const [error, setError] = useState("");
  const [locationIssue, setLocationIssue] = useState("");
  const [locating, setLocating] = useState(false);
  const locationBusy = useRef(false);
  const epoch = useRef(0);
  const api = demoApi ?? liveApi;
  const hasLocation = !!data?.account.location;
  const radiusKm = data?.account.location?.radiusKm ?? 5;
  async function refresh() {
    const current = epoch.current;
    setError("");
    try {
      const next = cloneData(await api.call("bootstrap"));
      if (current === epoch.current) setData(next);
    } catch (e) {
      if (current === epoch.current) setError(errorMessage(e));
    }
  }
  async function refreshLocation(
    radiusKm = data?.account.location?.radiusKm ?? 5,
    prompt = true,
  ) {
    if (locationBusy.current) return;
    locationBusy.current = true;
    setLocating(true);
    const current = epoch.current;
    try {
      const fix = demoApi
        ? demoLocation(radiusKm)
        : await readDeviceLocation(prompt);
      if (current !== epoch.current) return;
      await api.call("set_location", {
        latitude: fix.latitude,
        longitude: fix.longitude,
        accuracyMeters: fix.accuracyMeters,
        capturedAt: fix.capturedAt,
        radiusKm,
      });
      if (current === epoch.current) {
        const next = cloneData(await api.call("bootstrap"));
        if (current !== epoch.current) return;
        setData(next);
        setLocationIssue("");
      }
    } catch (e) {
      if (current === epoch.current) setLocationIssue(errorMessage(e));
      throw e;
    } finally {
      locationBusy.current = false;
      setLocating(false);
    }
  }
  useEffect(() => {
    if (demoApi || !data?.account.location) return;
    const check = () => {
      void refreshLocation(radiusKm, false).catch(() => {});
    };
    check();
    const listener = AppState.addEventListener("change", (next) => {
      if (next === "active") check();
    });
    return () => listener.remove();
    // Recheck once per account/foreground, never run a background location watcher.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.account.id, demoApi, hasLocation, radiusKm]);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, next) => {
        epoch.current++;
        setSession(next);
        setData(null);
        setError("");
      },
    );
    const sub = AppState.addEventListener("change", (state) => {
      if (Platform.OS !== "web") {
        if (state === "active") supabase!.auth.startAutoRefresh();
        else supabase!.auth.stopAutoRefresh();
      }
    });
    return () => {
      subscription.subscription.unsubscribe();
      sub.remove();
    };
  }, []);
  useEffect(() => {
    let mounted = true;
    if (session || demoApi)
      api
        .call("bootstrap")
        .then((value) => {
          if (mounted) setData(cloneData(value));
        })
        .catch((e) => {
          if (mounted) setError(errorMessage(e));
        });
    return () => {
      mounted = false;
    };
  }, [session, demoApi, api]);
  return (
    <Context.Provider
      value={{
        api,
        demo: !!demoApi,
        session,
        ready,
        data,
        error,
        locationIssue,
        locating,
        refreshLocation,
        refresh,
        startDemo: () => {
          epoch.current++;
          setDemoApi(new DemoApi());
          setData(null);
          setError("");
          setLocationIssue("");
        },
        verifyDemoPhone: async () => {
          if (demoApi?.profile()) {
            demoApi.profile()!.whatsappReady = true;
            await refresh();
          }
        },
        switchDemo: (actor) => {
          if (demoApi) {
            epoch.current++;
            const next = Object.assign(new DemoApi(), demoApi, {
              actor,
            });
            setDemoApi(next);
            setData(null);
            setError("");
            setLocationIssue("");
          }
        },
        logout: async () => {
          epoch.current++;
          if (!demoApi && supabase) {
            // Logout must remain available when presence cleanup cannot reach the server.
            await api.call("visibility", { enabled: false }).catch(() => {});
            const { error } = await supabase.auth.signOut({ scope: "local" });
            if (error) throw new Error("NETWORK_ERROR");
          }
          setDemoApi(null);
          setData(null);
          setSession(null);
          setLocationIssue("");
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useSession() {
  const c = useContext(Context);
  if (!c) throw new Error("Session provider missing");
  return c;
}
