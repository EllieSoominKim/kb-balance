import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Slider from "@react-native-community/slider";
import { useState } from "react";
import { Header } from "../../components/Header";

const FREQUENCIES = ["여유자금 생길 때마다", "매달", "분기마다"];

export default function TimelineScreen() {
  const { personaId, risk, goal } = useLocalSearchParams<{ personaId: string; risk: string; goal: string }>();
  const router = useRouter();
  const isOptimizeGoal = goal === "여유자금 상환·투자 최적화";

  const [years, setYears] = useState(10);
  const [frequency, setFrequency] = useState<string | null>(null);

  const yearsLabel = years >= 30 ? "30년+" : years === 0 ? "즉시" : `${years}년`;
  const canProceed = isOptimizeGoal ? frequency !== null : true;

  const finish = () => {
    if (!canProceed) return;
    router.push({
      pathname: "/dashboard",
      params: {
        personaId,
        risk,
        goal,
        horizonOrFrequency: isOptimizeGoal ? frequency! : yearsLabel,
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white", paddingHorizontal: 20, paddingTop: 64 }}>
      <Header />

      <Pressable
        onPress={() => router.push({ pathname: "/onboarding/goal", params: { personaId, risk } })}
        style={{
          backgroundColor: "#fef3c7",
          borderRadius: 999,
          paddingVertical: 10,
          paddingHorizontal: 20,
          alignSelf: "flex-start",
          marginBottom: 16,
        }}
      >
        <Text style={{ fontWeight: "bold", fontSize: 15 }}>뒤로</Text>
      </Pressable>

      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "#fbbf24", alignItems: "center", justifyContent: "center", marginRight: 8 }}>
          <Text style={{ fontWeight: "bold", fontSize: 12 }}>3</Text>
        </View>
        <Text style={{ color: "#000000" }}>{isOptimizeGoal ? "재조정 주기" : "목표 기한"}</Text>
      </View>

      {isOptimizeGoal ? (
        <>
          <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 15 }}>
            이런 결정을 얼마나 자주{"\n"}하고 싶으신가요?
          </Text>

          {FREQUENCIES.map((f) => (
            <Pressable
              key={f}
              onPress={() => setFrequency(f)}
              style={{
                backgroundColor: "white",
                borderWidth: 1.5,
                borderColor: frequency === f ? "#fbbf24" : "#e5e7eb",
                borderRadius: 12,
                padding: 16,
                marginBottom: 10,
              }}
            >
              <Text style={{ fontWeight: frequency === f ? "bold" : "normal", fontSize: 15 }}>{f}</Text>
            </Pressable>
          ))}

          <Text style={{ color: "#6b7280", fontSize: 14, lineHeight: 22, marginTop: 8 }}>
            <Text style={{ color: "#6b7280" }}>* </Text>
            재조정 주기가 짧을수록 금리 변동에 더 민감하게 반응해 배분을 업데이트해요
          </Text>
        </>
      ) : (
        <>
          <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 15 }}>
            목표를 언제까지{"\n"}달성하고 싶으신가요?
          </Text>
          <View style={{ backgroundColor: "white", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 16, padding: 24, marginBottom: 24 }}>
            <Text style={{ textAlign: "center", fontSize: 22, fontWeight: "bold", marginBottom: 16, color: "#fbbf24" }}>
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
          <Text style={{ color: "#6b7280", fontSize: 14, lineHeight: 22 }}>
            <Text style={{ color: "#6b7280" }}>* </Text>
            목표 기한이 짧을수록 유동성 높은 저축 중심으로, 길수록 복리 효과를 누리는 투자 비중을 늘려요

          </Text>
        </>
      )}

      <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 24, marginBottom: 24 }}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i === 2 ? "#1f2937" : "#e5e7eb",
              marginHorizontal: 4,
            }}
          />
        ))}
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 40 }}>
        <Pressable
          style={{ backgroundColor: "#f3f4f6", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24 }}
          onPress={() => router.push({ pathname: "/onboarding/goal", params: { personaId, risk } })}
        >
          <Text style={{ fontWeight: "bold" }}>이전</Text>
        </Pressable>
        <Pressable
          disabled={!canProceed}
          style={{
            backgroundColor: canProceed ? "#fbbf24" : "#e5e7eb",
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 32,
          }}
          onPress={finish}
        >
          <Text style={{ fontWeight: "bold", color: canProceed ? "#1f2937" : "#9ca3af" }}>완료</Text>
        </Pressable>
      </View>
    </View>
  );
}