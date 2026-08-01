import { View, Text, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { Header } from "../components/Header";

const features = [
  { title: "자산·부채 자동 조회", desc: "한 번에 불러오는 자산·부채 현황", icon: require("../assets/my.png"), iconSize: 40 },
  { title: "맞춤 리스크 진단", desc: "내 재무 상태에 맞춘 리스크 진단", icon: require("../assets/risk.png"), iconSize: 28, iconOffset: 8, textOffset: 5 },
  { title: "상환 vs 투자", desc: "상환과 투자, 최적 비율 추천", icon: require("../assets/rate.png"), iconSize: 40 },
];

export default function IntroScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: "white", paddingHorizontal: 20, paddingTop: 64 }}>
      <Header />

      <View style={{ backgroundColor: "#f3f4f6", borderRadius: 16, padding: 24, alignItems: "center" }}>
        <Image
          source={require("../assets/character.png")}
          style={{ width: "100%", height: 220, borderRadius: 12, marginBottom: 0 }}
          resizeMode="contain"
        />

        <Text style={{ fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 12 }}>
          계좌를 연결하고 시작하세요
        </Text>
        <Text style={{ color: "#6b7280", textAlign: "center", marginBottom: 24, fontSize: 17 }}>
          자산·부채·소득을 한 번에 불러와{"\n"}맞춤 리스크 진단을 시작합니다
        </Text>

        {features.map((f) => (
          <View
            key={f.title}
            style={{
              flexDirection: "row",
              alignItems: "center",
              width: "100%",
              backgroundColor: "white",
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <Image
              source={f.icon}
              style={{
                width: f.iconSize,
                height: f.iconSize,
                marginRight: 14,
                marginLeft: f.iconOffset ?? 0,
              }}
              resizeMode="contain"
            />
            <View style={{ flex: 1, marginLeft: f.textOffset ?? 0 }}>
              <Text style={{ fontWeight: "bold", color: "#1f2937" }}>{f.title}</Text>
              <Text style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <Pressable
        style={{ backgroundColor: "#fbbf24", borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 24 }}
        onPress={() => router.push("/persona-select")}
      >
        <Text style={{ fontWeight: "bold", color: "#1f2937" }}>KB계좌 연결하기</Text>
      </Pressable>
    </View>
  );
}