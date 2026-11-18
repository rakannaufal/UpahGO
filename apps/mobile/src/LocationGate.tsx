import React, { useEffect, useState } from "react";
import { router } from "expo-router";
import { Text } from "react-native-paper";
import { locationFresh } from "../../../shared/geo";
import { Action, Icon, Note, Page, s } from "./ui";
import { useSession } from "./session";
export function LocationGate({ children }: { children: React.ReactNode }) {
  const state = useSession();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);
  if (
    !state.data?.city ||
    !locationFresh(state.data.account.location, now) ||
    state.locationIssue
  )
    return (
      <Page title="Lokasi" hideTitle form>
        <Icon name="location_on" />
        <Text style={s.section}>Aktifkan lokasi untuk mencari</Text>
        {!!state.locationIssue && <Note error>{state.locationIssue}</Note>}
        <Action
          onPress={() =>
            router.push({ pathname: "/location", params: { edit: "1" } })
          }
        >
          Perbarui lokasi
        </Action>
      </Page>
    );
  return children;
}
