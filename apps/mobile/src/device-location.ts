import * as Location from "expo-location";
import { Platform } from "react-native";
import { validateLocation } from "../../../shared/geo";
export type DeviceFix = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  capturedAt: string;
};
export async function readDeviceLocation(prompt: boolean): Promise<DeviceFix> {
  let permission = await Location.getForegroundPermissionsAsync();
  if (permission.status !== "granted" && prompt && permission.canAskAgain)
    permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== "granted") throw new Error("LOCATION_DENIED");
  if (!(await Location.hasServicesEnabledAsync())) {
    if (prompt && Platform.OS === "android") {
      try {
        await Location.enableNetworkProviderAsync();
      } catch {
        throw new Error("LOCATION_DISABLED");
      }
    } else throw new Error("LOCATION_DISABLED");
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const position = await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        mayShowUserSettingsDialog: prompt,
      }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("LOCATION_INACCURATE")),
          20000,
        );
      }),
    ]);
    const fix = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracyMeters: position.coords.accuracy ?? 1001,
      capturedAt: new Date(position.timestamp).toISOString(),
    };
    validateLocation(fix);
    return fix;
  } finally {
    clearTimeout(timer);
  }
}
