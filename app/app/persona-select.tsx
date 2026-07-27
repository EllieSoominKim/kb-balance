import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { personas } from "../data/personas";

export default function PersonaSelectScreen() {
  const router = useRouter();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "white", paddingHorizontal: 20, paddingTop: 64 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 8 }}>
        데모 페르소나를 선택하세요
      </Text>
      <Text style={{ color: "#6b7280", marginBottom: 24 }}>
        실제 서비스에서는 마이데이터 연동으로 자동 조회됩니다.
      </Text>

      {personas.map((p) => (
        <Pressable
          key={p.id}
          style={{
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
          }}
          onPress={() => router.push({ pathname: "/dashboard", params: { personaId: p.id } })}
        >
          <Text style={{ fontWeight: "bold", fontSize: 16 }}>{p.name}</Text>
          <Text style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>
            {p.ageGroup} · 월소득 {(p.monthlyIncome / 10000).toLocaleString()}만원
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}