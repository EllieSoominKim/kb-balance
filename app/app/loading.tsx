import { View, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

const STEPS = ["예금 계좌 조회", "투자 계좌 조회", "대출 정보 조회", "소득 정보 조회"];

export default function LoadingScreen() {
  const { personaId } = useLocalSearchParams<{ personaId: string }>();
  const router = useRouter();
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    if (completed >= STEPS.length) {
      const timer = setTimeout(() => {
        router.replace({ pathname: "/summary", params: { personaId } });
      }, 400);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setCompleted((c) => c + 1), 500);
    return () => clearTimeout(timer);
  }, [completed]);

  const progress = Math.min((completed / STEPS.length) * 100, 100);

  return (
    <View style={{ flex: 1, backgroundColor: "white", paddingHorizontal: 20, justifyContent: "center" }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 32, textAlign: "center" }}>
        자산 정보를 불러오고 있어요
      </Text>

      {STEPS.map((step, i) => (
        <View key={step} style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <Text style={{ width: 24, fontSize: 16 }}>
            {i < completed ? "✓" : i === completed ? "⟳" : "○"}
          </Text>
          <Text style={{ fontSize: 16, color: i <= completed ? "#111827" : "#9ca3af" }}>{step}</Text>
        </View>
      ))}

      <View style={{ height: 6, backgroundColor: "#e5e7eb", borderRadius: 3, marginTop: 24 }}>
        <View style={{ width: `${progress}%`, height: 6, backgroundColor: "#fbbf24", borderRadius: 3 }} />
      </View>
      <Text style={{ textAlign: "center", color: "#9ca3af", marginTop: 8, fontSize: 13 }}>
        진행 중 {Math.round(progress)}%
      </Text>
    </View>
  );
}