import { configureFonts, MD3LightTheme } from "react-native-paper";
import tokens from "../../../design/tokens.json";
export const c = tokens.color;
export const theme = {
  ...MD3LightTheme,
  roundness: 4,
  fonts: configureFonts({
    config: {
      headlineMedium: { fontSize: 30, lineHeight: 36, fontWeight: "700" },
      headlineSmall: { fontSize: 26, lineHeight: 34, fontWeight: "700" },
      titleLarge: { fontSize: 20, lineHeight: 28, fontWeight: "700" },
      titleMedium: { fontSize: 16, lineHeight: 24, fontWeight: "600" },
      labelLarge: { fontSize: 16, lineHeight: 24, fontWeight: "600" },
      bodyLarge: { fontSize: 16, lineHeight: 24 },
      bodyMedium: { fontSize: 14, lineHeight: 21 },
    },
  }),
  colors: {
    ...MD3LightTheme.colors,
    primary: c.primary,
    onPrimary: c.onPrimary,
    primaryContainer: c.primaryContainer,
    onPrimaryContainer: c.onPrimaryContainer,
    secondaryContainer: c.warmContainer,
    onSecondaryContainer: c.onWarmContainer,
    background: c.background,
    onBackground: c.onBackground,
    surface: c.surface,
    onSurface: c.onSurface,
    surfaceVariant: c.surfaceVariant,
    onSurfaceVariant: c.onSurfaceVariant,
    outline: c.outline,
    outlineVariant: c.outlineVariant,
    error: c.error,
    errorContainer: c.errorContainer,
  },
};
export { tokens };
