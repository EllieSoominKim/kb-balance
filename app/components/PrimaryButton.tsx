// components/PrimaryButton.tsx
import { Pressable, Text, PressableProps } from "react-native";
import { colors, spacing, radius } from "../constants/theme";

type Props = PressableProps & {
  label: string;
  variant?: "primary" | "secondary";
};

export default function PrimaryButton({ label, variant = "primary", style, ...rest }: Props) {
  const isPrimary = variant === "primary";
  return (
    <Pressable
      style={[
        {
          backgroundColor: isPrimary ? colors.primary : "#F3F4F6",
          borderRadius: radius.md,
          paddingVertical: spacing.md,
          alignItems: "center",
        },
        style as any,
      ]}
      {...rest}
    >
      <Text
        style={{
          fontWeight: "bold",
          color: isPrimary ? colors.textPrimary : colors.textSecondary,
          fontSize: 16,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}