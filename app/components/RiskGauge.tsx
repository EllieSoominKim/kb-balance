import { View, Text } from "react-native";

const LEVEL_LABELS = ["안전형", "안정추구형", "중립형", "성장추구형", "공격형"];

export function RiskGauge({ level }: { level: number }) {
  return (
    <View>
      <View style={{ flexDirection: "row", gap: 6, marginBottom: 8 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 24,
              borderRadius: 6,
              backgroundColor: i <= level ? "#fbbf24" : "#e5e7eb",
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