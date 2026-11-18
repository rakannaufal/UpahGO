import type { ExpoConfig } from "expo/config";
const config: ExpoConfig = {
  name: "Upahgo",
  slug: "upahgo",
  version: "0.1.0",
  scheme: "upahgo",
  userInterfaceStyle: "light",
  icon: "../../assets/brand/exports/android/launcher-icon.png",
  android: {
    package: "id.upahgo.app",
    versionCode: 1,
    softwareKeyboardLayoutMode: "resize",
    adaptiveIcon: {
      foregroundImage:
        "../../assets/brand/exports/android/adaptive-foreground.png",
      backgroundColor: "#014C24",
      monochromeImage:
        "../../assets/brand/exports/android/adaptive-monochrome.png",
    },
    blockedPermissions: [
      "android.permission.ACCESS_BACKGROUND_LOCATION",
      "android.permission.READ_CONTACTS",
      "android.permission.RECORD_AUDIO",
      "android.permission.CAMERA",
    ],
  },
  plugins: [
    "expo-router",
    [
      "expo-image-picker",
      {
        photosPermission:
          "Pilih foto identitas atau tempat untuk profil Upahgo.",
        cameraPermission: false,
        microphonePermission: false,
      },
    ],
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "Upahgo menggunakan lokasi saat aplikasi dibuka untuk mencari akun dalam radius dan kota/kabupatenmu.",
        isAndroidBackgroundLocationEnabled: false,
        isAndroidForegroundServiceEnabled: false,
      },
    ],
    ["expo-secure-store", { configureAndroidBackup: true }],
    [
      "expo-splash-screen",
      {
        backgroundColor: "#014C24",
        image: "../../assets/brand/exports/android/splash-mark.png",
        imageWidth: 180,
      },
    ],
    [
      "react-native-maps",
      {
        androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY ?? "",
      },
    ],
  ],
  web: {
    bundler: "metro",
    output: "single",
    name: "Upahgo",
    favicon: "../../assets/brand/exports/android/play-store-icon.png",
  },
  experiments: { typedRoutes: true },
  extra: { mapsConfigured: Boolean(process.env.GOOGLE_MAPS_ANDROID_API_KEY) },
};
export default config;
