import { View, Text } from "react-native";

const LEVEL_LABELS = ["안전형", "안정추구형", "중립형", "성장추구형", "공격형"];

const LEVEL_COLORS = ["#fef3c7", "#fde68a", "#fcd34d", "#fbbf24", "#f59e0b"];
const LEVEL_HEIGHTS = [20, 24, 30, 36, 44];

export function RiskGauge({ level }: { level: number }) {
  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, marginBottom: 8 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: LEVEL_HEIGHTS[i - 1],
              borderRadius: 8,
              backgroundColor: i <= level ? LEVEL_COLORS[i - 1] : "#e5e7eb",
            }}
          />
        ))}
      </View>
      <Text style={{ fontWeight: "bold", fontSize: 18 }}>
        {LEVEL_LABELS[level - 1]} ({level}/5)
      </Text>
    </View>
  );
}