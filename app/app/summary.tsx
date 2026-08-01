import { View, Text, Pressable, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { personas } from "../data/personas";
import { Header } from "../components/Header";

export default function SummaryScreen() {
  const { personaId } = useLocalSearchParams<{ personaId: string }>();
  const router = useRouter();
  const persona = personas.find((p) => p.id === personaId);

  if (!persona) return null;

  return (
    <View style={{ flex: 1, backgroundColor: "white", paddingHorizontal: 20, paddingTop: 64 }}>
      <Header />

      <Pressable
        onPress={() => router.push({ pathname: "/connect", params: { personaId } })}
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

      <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <Image
            source={require("../assets/check.png")}
            style={{ width: 20, height: 20, marginRight: 8 }}
            resizeMode="contain"
          />
          <Text style={{ fontWeight: "bold", fontSize: 16 }}>
            {persona.name}님 계좌 연결 완료
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
          <Text style={{ color: "#6b7280" }}>월 소득</Text>
          <Text style={{ fontWeight: "bold" }}>{(persona.monthlyIncome / 10000).toLocaleString()}만원</Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
          <Text style={{ color: "#6b7280" }}>예금 + 투자</Text>
          <Text style={{ fontWeight: "bold" }}>
            {((persona.deposit + persona.investment) / 10000).toLocaleString()}만원
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: "#6b7280" }}>대출</Text>
          <Text style={{ fontWeight: "bold" }}>
            {persona.loanAmount > 0 ? `${(persona.loanAmount / 10000).toLocaleString()}만원` : "없음"}
          </Text>
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: "#f3f4f6", marginBottom: 24 }} />

      <Text style={{ fontSize: 16, color: "#374151", marginBottom: 24, lineHeight: 22 }}>
        * 간단한 진단을 완료하시면 나에게 맞는 리스크 진단과 배분 추천이 완성돼요
      </Text>

      <Pressable
        style={{ backgroundColor: "#fbbf24", borderRadius: 12, paddingVertical: 16, alignItems: "center" }}
        onPress={() => router.push({ pathname: "/onboarding/risk", params: { personaId } })}
      >
        <Text style={{ fontWeight: "bold", color: "#1f2937" }}>진단 시작하기</Text>
      </Pressable>
    </View>
  );
}