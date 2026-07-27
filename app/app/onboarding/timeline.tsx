import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Slider from "@react-native-community/slider";
import { useState } from "react";

const FREQUENCIES = ["여유자금 생길 때마다", "매달", "분기마다"];

export default function TimelineScreen() {
  const { personaId, risk, goal } = useLocalSearchParams<{ personaId: string; risk: string; goal: string }>();
  const router = useRouter();
  const isOptimizeGoal = goal === "optimize";

  const [years, setYears] = useState(10);
  const [frequency, setFrequency] = useState(FREQUENCIES[0]);

  const yearsLabel = years >= 30 ? "30년+" : years === 0 ? "즉시" : `${years}년`;

  const finish = () => {
    router.push({
      pathname: "/dashboard",
      params: {
        personaId,
        risk,
        goal,
        horizonOrFrequency: isOptimizeGoal ? frequency : yearsLabel,
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white", paddingHorizontal: 20, paddingTop: 64 }}>
      <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
        <Text style={{ color: "#6b7280" }}>← 뒤로</Text>
      </Pressable>

      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "#fbbf24", alignItems: "center", justifyContent: "center", marginRight: 8 }}>
          <Text style={{ fontWeight: "bold", fontSize: 12 }}>3</Text>
        </View>
        <Text style={{ color: "#9ca3af" }}>{isOptimizeGoal ? "재조정 주기" : "목표 기한"}</Text>
      </View>

      {isOptimizeGoal ? (
        <>
          <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 24 }}>
            이런 결정을 얼마나 자주{"\n"}하고 싶으신가요?
          </Text>
          <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, marginBottom: 24 }}>
            {FREQUENCIES.map((f, i) => (
              <Pressable
                key={f}
                onPress={() => setFrequency(f)}
                style={{
                  padding: 16,
                  borderBottomWidth: i < FREQUENCIES.length - 1 ? 1 : 0,
                  borderBottomColor: "#f3f4f6",
                  backgroundColor: frequency === f ? "#fffbeb" : "white",
                }}
              >
                <Text style={{ fontWeight: frequency === f ? "bold" : "normal" }}>{f}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={{ color: "#6b7280", fontSize: 13, lineHeight: 20 }}>
            재조정 주기가 짧을수록 금리 변동에 더 민감하게 반응해 배분을 업데이트해요.
          </Text>
        </>
      ) : (
        <>
          <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 24 }}>
            목표를 언제까지{"\n"}달성하고 싶으신가요?
          </Text>
          <View style={{ backgroundColor: "#f9fafb", borderRadius: 16, padding: 24, marginBottom: 24 }}>
            <Text style={{ textAlign: "center", fontSize: 24, fontWeight: "bold", marginBottom: 16, color: "#fbbf24" }}>
              {yearsLabel}
            </Text>
            <Slider
              minimumValue={0}
              maximumValue={30}
              step={1}
              value={years}
              minimumTrackTintColor="#fbbf24"
              onValueChange={setYears}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
              <Text style={{ fontSize: 11, color: "#9ca3af" }}>즉시</Text>
              <Text style={{ fontSize: 11, color: "#9ca3af" }}>10년</Text>
              <Text style={{ fontSize: 11, color: "#9ca3af" }}>20년</Text>
              <Text style={{ fontSize: 11, color: "#9ca3af" }}>30년+</Text>
            </View>
          </View>
          <Text style={{ color: "#6b7280", fontSize: 13, lineHeight: 20 }}>
            기한이 짧으면 안전한 저축 중심으로, 길면 복리 효과를 살린 투자 중심으로 배분해요.
          </Text>
        </>
      )}

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 32, marginBottom: 40 }}>
        <Pressable
          style={{ backgroundColor: "#f3f4f6", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24 }}
          onPress={() => router.back()}
        >
          <Text style={{ fontWeight: "bold" }}>이전</Text>
        </Pressable>
        <Pressable
          style={{ backgroundColor: "#fbbf24", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 }}
          onPress={finish}
        >
          <Text style={{ fontWeight: "bold", color: "#1f2937" }}>완료</Text>
        </Pressable>
      </View>
    </View>
  );
}