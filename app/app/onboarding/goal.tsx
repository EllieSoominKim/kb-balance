import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Header } from "../../components/Header";

const GOALS = [
  { key: "home", label: "내집마련", desc: "주택 구입을 위한 자금을 모아요" },
  { key: "retirement", label: "은퇴 준비", desc: "은퇴 후를 위한 자산을 쌓아요" },
  { key: "education", label: "자녀 교육", desc: "교육비 목표 금액을 준비해요" },
  { key: "fund", label: "목돈 마련", desc: "특정 금액을 모으는 게 목표예요" },
  {
    key: "optimize",
    label: "여유자금 상환·투자 최적화",
    desc: "매달 남는 돈을 상환/저축/투자 중 어디에 쓸지 바로 추천받고 싶어요",
  },
];

export default function GoalScreen() {
  const { personaId, risk } = useLocalSearchParams<{ personaId: string; risk: string }>();
  const router = useRouter();
  const [selected, setSelected] = useState("optimize");

  return (
    <View style={{ flex: 1, backgroundColor: "white", paddingHorizontal: 20, paddingTop: 64 }}>
      <Header />

      <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
        <Text style={{ color: "#6b7280" }}>← 뒤로</Text>
      </Pressable>

      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "#fbbf24", alignItems: "center", justifyContent: "center", marginRight: 8 }}>
          <Text style={{ fontWeight: "bold", fontSize: 12 }}>2</Text>
        </View>
        <Text style={{ color: "#9ca3af" }}>목표</Text>
      </View>

      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 24 }}>
        가장 중요한 재무 목표를{"\n"}골라주세요
      </Text>

      {GOALS.map((g) => (
        <Pressable
          key={g.key}
          onPress={() => setSelected(g.key)}
          style={{
            borderWidth: 1.5,
            borderColor: selected === g.key ? "#fbbf24" : "#e5e7eb",
            backgroundColor: selected === g.key ? "#fffbeb" : "white",
            borderRadius: 12,
            padding: 14,
            marginBottom: 10,
          }}
        >
          <Text style={{ fontWeight: "bold", fontSize: 15 }}>{g.label}</Text>
          <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>{g.desc}</Text>
        </Pressable>
      ))}

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 24, marginBottom: 40 }}>
        <Pressable
          style={{ backgroundColor: "#f3f4f6", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24 }}
          onPress={() => router.back()}
        >
          <Text style={{ fontWeight: "bold" }}>이전</Text>
        </Pressable>
        <Pressable
          style={{ backgroundColor: "#fbbf24", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 }}
          onPress={() => {
            const selectedLabel = GOALS.find((g) => g.key === selected)?.label ?? selected;
            router.push({
              pathname: "/onboarding/timeline",
              params: { personaId, risk, goal: selectedLabel },
            });
          }}
        >
          <Text style={{ fontWeight: "bold", color: "#1f2937" }}>다음</Text>
        </Pressable>
      </View>
    </View>
  );
}