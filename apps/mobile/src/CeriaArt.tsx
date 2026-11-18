import React from "react";
import { Image, View, type StyleProp, type ViewStyle } from "react-native";
import { SvgXml } from "react-native-svg";
import services from "../../../assets/ceria/services.json";

// Decorative artwork; interface icons use the shared 24 dp Icon component.
export function ServiceArt({
  name,
  size = 48,
}: {
  name: string;
  size?: number;
}) {
  const xml = (services as Record<string, string>)[name];
  return xml ? (
    <SvgXml
      xml={xml}
      width={size}
      height={size}
      testID={`service-art-${name}`}
      accessible={false}
      aria-hidden
      pointerEvents="none"
    />
  ) : null;
}

export function RoleArt({
  role,
  style,
}: {
  role: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      style={style}
    >
      <Image
        source={
          role === "worker"
            ? require("../../../assets/ceria/job-hunt.png")
            : require("../../../assets/ceria/hiring.png")
        }
        resizeMode="contain"
        style={{ width: "100%", height: "100%" }}
      />
    </View>
  );
}
