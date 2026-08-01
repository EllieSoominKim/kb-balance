import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Slider from "@react-native-community/slider";
import { useState } from "react";
import { Header } from "../../components/Header";

const LABELS = ["안전형", "안정추구형", "중립형", "성장추구형", "공격형"];

export default function RiskScreen() {
  const { personaId } = useLocalSearchParams<{ personaId: string }>();
  const router = useRouter();
  const [level, setLevel] = useState(3);

  return (
    <View style={{ flex: 1, backgroundColor: "white", paddingHorizontal: 20, paddingTop: 64 }}>
      <Header />

      <Pressable
        onPress={() => router.push({ pathname: "/summary", params: { personaId } })}
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
          <Text style={{ fontWeight: "bold", fontSize: 12 }}>1</Text>
        </View>
        <Text style={{ color: "#000000" }}>투자 리스크 허용도</Text>
      </View>

      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 15 }}>
        손실 가능성을 어느 정도까지{"\n"}감수할 수 있나요?
      </Text>

      <View style={{ backgroundColor: "white", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <Text style={{ textAlign: "center", fontSize: 22, fontWeight: "bold", marginBottom: 20 }}>
          {LABELS[level - 1]}
        </Text>
        <Slider
          minimumValue={1}
          maximumValue={5}
          step={1}
          value={level}
          minimumTrackTintColor="#fbbf24"
          onValueChange={setLevel}
        />
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
          {LABELS.map((l, i) => (
            <Text
              key={l}
              style={{
                fontSize: 11,
                color: i + 1 === level ? "#1f2937" : "#9ca3af",
                fontWeight: i + 1 === level ? "bold" : "normal",
                width: 60,
                textAlign: "center",
              }}
            >
              {l}
            </Text>
          ))}
        </View>
      </View>

      <View style={{ marginBottom: 8 }}>
        <Text style={{ color: "#6b7280", fontSize: 14, lineHeight: 22 }}>
          <Text style={{ color: "#6b7280" }}>* </Text>
          리스크 허용도는 추천 포트폴리오의 상환·저축·투자 비중을 정하는 핵심 기준이에요
        </Text>
      </View>
      <Text style={{ color: "#6b7280", fontSize: 14, lineHeight: 22, marginBottom: 32 }}>
        <Text style={{ color: "#6b7280" }}>* </Text>
        손실을 감수할 수 있는 정도에 따라 안정형은 저축 중심, 공격형은 투자 비중이 높아집니다
      </Text>

      <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 24 }}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i === 0 ? "#1f2937" : "#e5e7eb",
              marginHorizontal: 4,
            }}
          />
        ))}
      </View>

      <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
        <Pressable
          style={{ backgroundColor: "#fbbf24", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 }}
          onPress={() =>
            router.push({ pathname: "/onboarding/goal", params: { personaId, risk: String(level) } })
          }
        >
          <Text style={{ fontWeight: "bold", color: "#1f2937" }}>다음</Text>
        </Pressable>
      </View>
    </View>
  );
}