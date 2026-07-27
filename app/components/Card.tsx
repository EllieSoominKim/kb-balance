// components/Card.tsx
import { View, ViewProps } from "react-native";
import { colors, spacing, radius } from "../constants/theme";

export default function Card({ style, children, ...rest }: ViewProps) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.cardBg,
          borderRadius: radius.lg,
          padding: spacing.lg,
          marginBottom: spacing.md,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}