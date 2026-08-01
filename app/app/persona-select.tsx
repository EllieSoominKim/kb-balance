import { View, Text, Pressable, ScrollView, Image } from "react-native";
import { useRouter } from "expo-router";
import { personas } from "../data/personas";
import { Header } from "../components/Header";

const PERSONA_ICONS: Record<string, any> = {
  "social-newbie": require("../assets/early-career.png"),
  newlywed: require("../assets/married.png"),
  "loan-holder": require("../assets/office-worker.png"),
  "pre-retirement": require("../assets/retreat.png"),
};

export default function PersonaSelectScreen() {
  const router = useRouter();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "white", paddingHorizontal: 20, paddingTop: 64 }}>
      <Header />

      <Pressable
        onPress={() => router.push("/")}
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

      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 15 }}>
        데모 페르소나를{"\n"}선택하세요
      </Text>

      <View style={{ backgroundColor: "#f3f4f6", borderRadius: 12, padding: 16, marginBottom: 15 }}>
        <Text style={{ color: "#6b7280", fontSize: 14, lineHeight: 20 }}>
          실제 서비스에서는 마이데이터 연동으로 자동 조회됩니다.{"\n"}
          데모 페르소나 중 하나를 선택해 체험해 보세요.
        </Text>
      </View>

      {personas.map((p) => (
        <Pressable
          key={p.id}
          style={{
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
          }}
          onPress={() => router.push({ pathname: "/connect", params: { personaId: p.id } })}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Image
              source={PERSONA_ICONS[p.id]}
              style={{ width: 44, height: 44, marginRight: 18 }}
              resizeMode="contain"
            />
            <View>
              <Text style={{ fontWeight: "bold", fontSize: 17, marginBottom: 4 }}>
                {p.name}
              </Text>
              <Text style={{ color: "#6b7280", fontSize: 14 }}>
                {p.ageGroup} · 월소득 {(p.monthlyIncome / 10000).toLocaleString()}만원
              </Text>
            </View>
          </View>
          <Text style={{ color: "#9ca3af", fontSize: 13 }}>{p.summary}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}