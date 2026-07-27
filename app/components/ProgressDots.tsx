import { View } from "react-native";
import { colors } from "../constants/theme";

export default function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginVertical: 24 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i === current ? colors.primary : colors.border,
          }}
        />
      ))}
    </View>
  );
}