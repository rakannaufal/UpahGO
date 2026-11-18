import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AccessibilityInfo,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  Modal,
  Pressable,
  RefreshControl,
  Image,
} from "react-native";
import {
  ActivityIndicator,
  Button as PaperButton,
  IconButton as PaperIconButton,
  TouchableRipple,
  Text,
  TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, router, useFocusEffect, useIsFocused } from "expo-router";
import { SvgXml } from "react-native-svg";
import { c, tokens } from "./theme";
import icons from "./icons.json";
import controls from "../../../assets/ceria/controls.json";
import { cloneData, errorMessage, entryRoute } from "../../../shared/contracts";
import { useSession } from "./session";
export function IconButton(
  props: React.ComponentProps<typeof PaperIconButton>,
) {
  return (
    <PaperIconButton
      {...props}
      style={[
        { borderRadius: tokens.radius.button },
        props.style,
        {
          width: 48,
          height: 48,
          backgroundColor: "transparent",
          borderWidth: 0,
        },
      ]}
    />
  );
}
export function TextButton(props: React.ComponentProps<typeof PaperButton>) {
  return (
    <PaperButton
      {...props}
      style={[
        { minWidth: 48, borderRadius: tokens.radius.button },
        props.style,
      ]}
      contentStyle={[props.contentStyle, { minHeight: 48 }]}
    />
  );
}
export function Icon({
  name,
  color = c.primary,
  filled = false,
}: {
  name: string;
  color?: string;
  filled?: boolean;
}) {
  const alias =
    (
      {
        list_alt: "description",
        format_list_bulleted: "description",
        kitchen: "countertops",
      } as Record<string, string>
    )[name] ?? name;
  const filledPath = (
    {
      home: "M4 10 12 3 20 10V20H15V14H9V20H4Z",
      location_on:
        "M20 10C20 16 12 22 12 22S4 16 4 10A8 8 0 1 1 20 10ZM15 10A3 3 0 1 0 9 10A3 3 0 1 0 15 10Z",
      person: "M16 7A4 4 0 1 1 8 7A4 4 0 1 1 16 7M4 21V18C4 12 20 12 20 18V21Z",
      notifications:
        "M5 16V10C5 1 19 1 19 10V16L21 18H3ZM9 20H15A3 3 0 0 1 9 20Z",
      description:
        "M6 3H13V10H20V21H4V5Q4 3 6 3ZM15 3 20 8H15ZM8 13V15H16V13ZM8 17V19H14V17Z",
    } as Record<string, string>
  )[alias];
  const xml =
    filled && filledPath
      ? `<svg viewBox="0 0 24 24"><path d="${filledPath}" fill="currentColor" fill-rule="evenodd"/></svg>`
      : ((controls as Record<string, string>)[alias] ??
        (icons as Record<string, string>)[name]);
  return xml ? (
    <SvgXml
      xml={xml.replaceAll("currentColor", color)}
      width={tokens.size.icon}
      height={tokens.size.icon}
      testID={filled ? "icon-filled" : "icon-outline"}
      accessible={false}
      aria-hidden
      pointerEvents="none"
    />
  ) : null;
}
export function Page({
  title,
  subtitle,
  children,
  back = false,
  form = false,
  scroll = true,
  toolbar,
  padded = true,
  onRefresh,
  refreshing = false,
  contentMaxWidth = 1200,
  hideTitle = false,
  tonal = false,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  back?: boolean;
  form?: boolean;
  scroll?: boolean;
  toolbar?: React.ReactNode;
  padded?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  contentMaxWidth?: number;
  hideTitle?: boolean;
  tonal?: boolean;
  footer?: React.ReactNode;
}) {
  const { width } = useWindowDimensions();
  const focused = useIsFocused();
  const { demo } = useSession();
  return (
    <SafeAreaView
      testID={`page-${title}`}
      aria-hidden={!focused}
      importantForAccessibility={focused ? "auto" : "no-hide-descendants"}
      style={[
        s.page,
        tonal && { backgroundColor: c.surfaceVariant },
        Platform.OS === "web" && !focused && { display: "none" },
      ]}
      edges={
        hideTitle &&
        ["Beranda", "Temukan", "Aktivitas", "Notifikasi", "Akun"].includes(
          title,
        )
          ? ["top", "left", "right"]
          : ["top", "left", "right", "bottom"]
      }
    >
      {demo && (
        <View
          style={{
            alignSelf: "flex-end",
            backgroundColor: c.warmContainer,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text style={{ fontSize: 12, color: c.onWarmContainer }}>
            Demo · data sintetis
          </Text>
        </View>
      )}
      <KeyboardAvoidingView
        style={s.fill}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {hideTitle &&
          ["Beranda", "Temukan", "Aktivitas", "Notifikasi", "Akun"].includes(
            title,
          ) && (
            <View
              style={[s.topBar, { paddingHorizontal: width < 600 ? 20 : 32 }]}
            >
              <Image
                source={require("../../../assets/brand/exports/upahgo-lockup-light.png")}
                style={{ width: 144, height: 42 }}
                resizeMode="contain"
                accessibilityLabel="Upahgo"
              />
            </View>
          )}
        {(!hideTitle || back || toolbar) && (
          <View
            style={[s.topBar, { paddingHorizontal: width < 600 ? 16 : 24 }]}
          >
            {back && (
              <IconButton
                accessibilityLabel="Kembali"
                icon={() => <Icon name="arrow_back" />}
                onPress={() =>
                  router.canGoBack() ? router.back() : router.replace("/")
                }
                style={{ margin: 0 }}
              />
            )}
            {!hideTitle && (
              <Text
                accessibilityRole="header"
                variant="titleLarge"
                style={{ flex: 1, color: c.onBackground, fontWeight: "700" }}
              >
                {title}
              </Text>
            )}
            {hideTitle && <View style={{ flex: 1 }} />}
            {toolbar}
          </View>
        )}
        {scroll ? (
          <ScrollView
            testID="page-scroll"
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={c.primary}
                />
              ) : undefined
            }
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              s.content,
              { maxWidth: contentMaxWidth },
              {
                padding: padded
                  ? width < 600
                    ? 20
                    : width < 840
                      ? 24
                      : 32
                  : 0,
              },
              form && { maxWidth: tokens.layout.formMaxWidth },
            ]}
          >
            {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
            {children}
          </ScrollView>
        ) : (
          <View style={[s.fill, { padding: padded ? 16 : 0 }]}>{children}</View>
        )}
        {footer && (
          <View
            style={{
              borderTopWidth: 1,
              borderColor: c.cardOutline,
              backgroundColor: c.surface,
            }}
          >
            <View
              style={{
                width: "100%",
                alignSelf: "center",
                maxWidth: form ? tokens.layout.formMaxWidth : contentMaxWidth,
                paddingHorizontal: width < 600 ? 20 : 24,
                paddingTop: 10,
                paddingBottom: 12,
                gap: 8,
              }}
            >
              {footer}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function AccountGate({
  children,
  requireProfile = false,
  registration = true,
}: {
  children: React.ReactNode;
  requireProfile?: boolean;
  registration?: boolean;
}) {
  const state = useSession();
  if (!state.ready)
    return (
      <Page title="Upahgo">
        <Text>Menyiapkan aplikasi…</Text>
      </Page>
    );
  if (!state.demo && !state.session) return <Redirect href="/" />;
  if (!state.data)
    return (
      <Page title="Memuat akun" back>
        <LoadState
          loading={!state.error}
          error={state.error}
          reload={() => void state.refresh()}
        />
      </Page>
    );
  if (state.data.account.status !== "active")
    return (
      <Page title="Akun">
        <Note>Permintaan penghapusan tercatat. Akun dibatasi.</Note>
        <Action onPress={() => void state.logout()}>Keluar akun</Action>
      </Page>
    );
  if (registration) {
    const next = entryRoute(state.data);
    if (next !== "/(tabs)/home") return <Redirect href={next} />;
  }
  if (requireProfile && !state.data.profile)
    return (
      <Page title="Lengkapi profil" back>
        <Action onPress={() => router.push("/setup")}>Lengkapi profil</Action>
      </Page>
    );
  return <>{children}</>;
}
export function Panel({
  children,
  warm = false,
  compact = false,
}: {
  children: React.ReactNode;
  warm?: boolean;
  compact?: boolean;
}) {
  return (
    <PanelContext.Provider value={true}>
      <View
        style={[
          s.panel,
          warm && { backgroundColor: c.warmContainer },
          compact && { paddingHorizontal: 16, paddingVertical: 4, gap: 0 },
        ]}
      >
        {children}
      </View>
    </PanelContext.Provider>
  );
}
const PanelContext = createContext(false);
export function Note({
  children,
  error = false,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  return (
    <Text
      accessibilityRole={error ? "alert" : undefined}
      style={[
        s.note,
        error && { color: c.error, backgroundColor: c.errorContainer },
      ]}
    >
      {children}
    </Text>
  );
}
export function Action({
  children,
  onPress,
  disabled = false,
  secondary = false,
  busy = false,
  testID,
  icon,
}: {
  children: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  busy?: boolean;
  testID?: string;
  icon?: React.ReactNode;
}) {
  return (
    <TouchableRipple
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={children}
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={[
        s.button,
        {
          borderWidth: secondary ? tokens.border.default : 0,
          borderColor: disabled ? c.outlineVariant : c.outline,
          backgroundColor: disabled
            ? c.surfaceVariant
            : secondary
              ? c.surface
              : c.primary,
          overflow: "hidden",
        },
      ]}
    >
      <View
        style={{
          minHeight: tokens.size.buttonMinHeight,
          paddingHorizontal: 20,
          paddingVertical: 10,
          flexDirection: "row",
          gap: 10,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {busy && (
          <ActivityIndicator
            size={20}
            color={secondary ? c.primary : c.onPrimary}
          />
        )}
        {!busy && icon}
        <Text
          style={{
            fontSize: 16,
            lineHeight: 24,
            flexShrink: 1,
            fontWeight: "600",
            textAlign: "center",
            color: disabled
              ? c.onSurfaceVariant
              : secondary
                ? c.onSurface
                : c.onPrimary,
          }}
        >
          {children}
        </Text>
      </View>
    </TouchableRipple>
  );
}
export function Field({
  label,
  value,
  onChangeText,
  multiline = false,
  keyboardType = "default",
  ...rest
}: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      mode="outlined"
      label={label}
      accessibilityLabel={typeof label === "string" ? label : undefined}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      keyboardType={keyboardType}
      outlineStyle={{
        borderRadius: tokens.radius.control,
        borderWidth: tokens.border.default,
      }}
      style={s.field}
      {...rest}
    />
  );
}
export function SearchField({
  label,
  value,
  onChangeText,
  ...rest
}: React.ComponentProps<typeof TextInput> & { label: string }) {
  return (
    <TextInput
      mode="outlined"
      placeholder={label}
      accessibilityLabel={label}
      value={value}
      onChangeText={onChangeText}
      returnKeyType="search"
      outlineColor={c.outline}
      activeOutlineColor={c.primary}
      placeholderTextColor={c.onSurfaceVariant}
      outlineStyle={{
        borderRadius: tokens.radius.control,
        borderWidth: tokens.border.default,
      }}
      style={[s.field, { minHeight: 56 }]}
      left={
        <TextInput.Icon
          icon={() => <Icon name="search" />}
          forceTextInputFocus={false}
          disabled
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          aria-hidden
        />
      }
      right={
        value ? (
          <TextInput.Icon
            icon={() => <Icon name="close" />}
            accessibilityLabel="Hapus pencarian"
            onPress={() => onChangeText?.("")}
            style={{ width: 48, height: 48 }}
          />
        ) : undefined
      }
      {...rest}
    />
  );
}
export function Consent({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <TouchableRipple
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      aria-checked={checked}
      onPress={onChange}
      style={{ borderRadius: 10 }}
    >
      <View
        style={[
          s.consent,
          { flexDirection: "row", gap: 12, alignItems: "center" },
        ]}
        pointerEvents="none"
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderWidth: checked ? 0 : 2,
            borderColor: c.primary,
            borderRadius: 6,
            backgroundColor: checked ? c.primary : c.surface,
          }}
        >
          {checked && <Icon name="check" color={c.onPrimary} />}
        </View>
        <Text style={{ flex: 1, fontSize: 14, lineHeight: 22 }}>{label}</Text>
      </View>
    </TouchableRipple>
  );
}
const ChoiceContext = createContext({
  value: "",
  onValueChange: (_value: string) => {},
});
function ChoiceGroup({
  value,
  onValueChange,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <ChoiceContext.Provider value={{ value, onValueChange }}>
      <View accessibilityRole="radiogroup" style={{ gap: 8 }}>
        {children}
      </View>
    </ChoiceContext.Provider>
  );
}
function ChoiceItem({
  label,
  value,
}: {
  label: string;
  value: string;
  style?: unknown;
}) {
  const group = useContext(ChoiceContext);
  const checked = group.value === value;
  return (
    <TouchableRipple
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      aria-checked={checked}
      onPress={() => group.onValueChange(value)}
      style={{ borderRadius: 10 }}
    >
      <View
        style={{
          minHeight: 48,
          flexDirection: "row",
          gap: 16,
          paddingVertical: 12,
          paddingHorizontal: 16,
          alignItems: "center",
        }}
        pointerEvents="none"
      >
        <Text style={{ fontSize: 16, lineHeight: 24, flex: 1 }}>{label}</Text>
        <View
          style={{
            height: 24,
            width: 24,
            borderWidth: 2,
            borderRadius: 12,
            borderColor: checked ? c.primary : c.outline,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {checked && (
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: c.primary,
              }}
            />
          )}
        </View>
      </View>
    </TouchableRipple>
  );
}
export const Choices = { Group: ChoiceGroup, Item: ChoiceItem };
export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <View style={{ paddingVertical: 32, paddingHorizontal: 16, gap: 12 }}>
      <Icon name="location_on" />
      <Text variant="titleLarge" style={s.heading}>
        {title}
      </Text>
      {!!body && <Text style={s.body}>{body}</Text>}
    </View>
  );
}
export function useTask() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  return {
    busy,
    error,
    setError,
    run: async (fn: () => Promise<void>) => {
      if (lock.current) return;
      lock.current = true;
      setBusy(true);
      setError("");
      try {
        await fn();
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        lock.current = false;
        setBusy(false);
      }
    },
  };
}
export function useLoad<T>(
  loader: () => Promise<T>,
  deps: React.DependencyList,
) {
  const [value, setValue] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  // Callers provide the dependencies that define the resource identity.
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/use-memo
  const load = useCallback(loader, deps);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError("");
      setValue(null);
      void revision;
      load()
        .then((v) => {
          if (active) setValue(cloneData(v));
        })
        .catch((e) => {
          if (active) setError(errorMessage(e));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [load, revision]),
  );
  return { value, error, loading, reload: () => setRevision((x) => x + 1) };
}
export function LoadState({
  loading,
  error,
  reload,
}: {
  loading: boolean;
  error: string;
  reload: () => void;
}) {
  return (
    <>
      {loading && (
        <View
          accessibilityLiveRegion="polite"
          accessibilityLabel="Memuat data"
          style={{ gap: 12, paddingVertical: 12 }}
        >
          <Text style={s.small}>Memuat data…</Text>
          {["80%", "60%"].map((width) => (
            <View
              key={width}
              aria-hidden
              style={{
                height: 16,
                width: width as `${number}%`,
                borderRadius: 4,
                backgroundColor: c.outlineVariant,
              }}
            />
          ))}
        </View>
      )}
      {!!error && (
        <>
          <Note error>{error}</Note>
          <Action secondary onPress={reload}>
            Coba lagi
          </Action>
        </>
      )}
    </>
  );
}
export function Reveal({ children }: { children: React.ReactNode }) {
  const [opacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (!reduce && active) {
        opacity.setValue(0);
        Animated.timing(opacity, {
          toValue: 1,
          duration: tokens.motion.stateDuration,
          useNativeDriver: true,
        }).start();
      }
    });
    return () => {
      active = false;
      opacity.stopAnimation();
    };
  }, [opacity]);
  return (
    <Animated.View testID="content-reveal" style={{ opacity, gap: 16 }}>
      {children}
    </Animated.View>
  );
}
export const s = StyleSheet.create({
  fill: { flex: 1 },
  page: { flex: 1, backgroundColor: c.background },
  content: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    gap: 16,
    paddingBottom: 40,
  },
  heading: { fontWeight: "700", color: c.onBackground },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: c.onSurfaceVariant,
    marginBottom: 8,
  },
  body: { fontSize: 16, lineHeight: 24, color: c.onSurface },
  topBar: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: 8 },
  panel: {
    backgroundColor: c.surface,
    borderRadius: tokens.radius.card,
    borderWidth: tokens.border.default,
    borderColor: c.cardOutline,
    padding: 20,
    gap: 12,
  },
  note: {
    padding: 16,
    borderRadius: 16,
    fontSize: 14,
    lineHeight: 22,
    color: c.onPrimaryContainer,
    backgroundColor: c.primaryContainer,
  },
  button: { borderRadius: tokens.radius.button, marginVertical: 4 },
  back: { alignSelf: "flex-start", minHeight: 48, justifyContent: "center" },
  field: { backgroundColor: c.surface, marginVertical: 4 },
  consent: { minHeight: 56, paddingHorizontal: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  small: { fontSize: 14, lineHeight: 22, color: c.onSurfaceVariant },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    backgroundColor: c.surfaceVariant,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    color: c.onSurfaceVariant,
    fontSize: 14,
  },
  section: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    marginTop: 16,
    color: c.onSurface,
  },
  card: {
    borderWidth: tokens.border.default,
    borderColor: c.cardOutline,
    borderRadius: tokens.radius.card,
    backgroundColor: c.surface,
    overflow: "hidden",
  },
});

export function MenuRow({
  label,
  detail,
  icon,
  onPress,
  destructive = false,
  leading,
  last = false,
  disabled = false,
  busy = false,
}: {
  label: string;
  detail?: string;
  icon: string;
  onPress: () => void;
  destructive?: boolean;
  leading?: React.ReactNode;
  last?: boolean;
  disabled?: boolean;
  busy?: boolean;
}) {
  const grouped = useContext(PanelContext);
  return (
    <TouchableRipple
      accessibilityRole="button"
      accessibilityLabel={detail ? `${label}, ${detail}` : label}
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={grouped ? { borderRadius: 12 } : s.card}
    >
      <View
        style={{
          minHeight: 72,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: grouped ? 0 : 16,
          paddingVertical: 12,
          borderBottomWidth: grouped && !last ? 1 : 0,
          borderBottomColor: c.outlineVariant,
        }}
      >
        {leading ?? (
          <View
            style={{
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name={icon} />
          </View>
        )}
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={[
              s.body,
              { fontWeight: "600" },
              destructive && { color: c.error },
            ]}
          >
            {label}
          </Text>
          {!!detail && <Text style={s.small}>{detail}</Text>}
        </View>
        {busy ? (
          <ActivityIndicator size={20} color={c.primary} />
        ) : (
          <Icon name="chevron_right" />
        )}
      </View>
    </TouchableRipple>
  );
}
export function DetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderColor: c.outlineVariant,
      }}
    >
      <Icon name={icon} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={s.small}>{label}</Text>
        <Text style={s.body}>{value}</Text>
      </View>
    </View>
  );
}
export function Sheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const closeButton = useRef<unknown>(null);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessibilityLabel={title}
      onShow={() => {
        const node = closeButton.current;
        if (
          node &&
          typeof node === "object" &&
          "focus" in node &&
          typeof node.focus === "function"
        )
          node.focus();
      }}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.25)",
        }}
      >
        <Pressable
          accessibilityLabel="Tutup panel"
          accessibilityRole="button"
          onPress={onClose}
          style={{ flex: 1 }}
        />
        <SafeAreaView
          edges={["bottom", "left", "right"]}
          style={{
            backgroundColor: c.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: "85%",
            width: "100%",
            maxWidth: 600,
            alignSelf: "center",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingLeft: 24,
              paddingRight: 12,
              minHeight: 64,
            }}
          >
            <Text
              accessibilityRole="header"
              variant="titleLarge"
              style={{ flex: 1 }}
            >
              {title}
            </Text>
            <TouchableRipple
              ref={(node) => {
                closeButton.current = node;
              }}
              accessibilityLabel="Tutup"
              accessibilityRole="button"
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={onClose}
            >
              <Icon name="close" />
            </TouchableRipple>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 24, paddingTop: 8, gap: 16 }}
          >
            {children}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
