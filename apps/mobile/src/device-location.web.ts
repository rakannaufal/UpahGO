import { validateLocation } from "../../../shared/geo";
type DeviceFix = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  capturedAt: string;
};
export async function readDeviceLocation(prompt: boolean): Promise<DeviceFix> {
  if (!navigator.geolocation) throw new Error("LOCATION_UNSUPPORTED");
  if (!prompt) {
    const permission = await navigator.permissions?.query({
      name: "geolocation",
    });
    if (!permission || permission.state !== "granted")
      throw new Error("LOCATION_DENIED");
  }
  const fix = await new Promise<DeviceFix>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
          accuracyMeters: p.coords.accuracy,
          capturedAt: new Date(p.timestamp).toISOString(),
        }),
      (e) =>
        reject(
          new Error(e.code === 1 ? "LOCATION_DENIED" : "LOCATION_INACCURATE"),
        ),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  });
  validateLocation(fix);
  return fix;
}
