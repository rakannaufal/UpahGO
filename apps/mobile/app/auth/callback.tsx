import React, { useEffect, useState } from "react";
import { Platform, Text } from "react-native";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { exchangeCallback } from "../../src/auth";
import { Page, Note, Action } from "../../src/ui";
export default function Callback() {
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const url =
          Platform.OS === "web"
            ? window.location.href
            : await Linking.getInitialURL();
        if (!url) throw new Error();
        if (Platform.OS === "web" && window.opener) {
          window.opener.postMessage(
            { type: "upahgo-oauth", url },
            window.location.origin,
          );
          window.close();
          return;
        }
        await exchangeCallback(url);
        if (active) router.replace("/");
      } catch {
        if (active) setError(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  return (
    <Page title="Menyelesaikan masuk">
      {error ? (
        <>
          <Note error>
            Masuk belum berhasil. Tautan mungkin kedaluwarsa atau bukan berasal
            dari permintaan perangkat ini.
          </Note>
          <Action onPress={() => router.replace("/")}>Ulangi masuk</Action>
        </>
      ) : (
        <Text>Memvalidasi sesi Google…</Text>
      )}
    </Page>
  );
}
