import { View, Text, ScrollView, Animated, Easing } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Header } from "../components/Header";

const STEPS = ["예금 계좌 조회", "투자 계좌 조회", "대출 정보 조회", "소득 정보 조회"];

function Spinner() {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <Animated.View
      style={{
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: "#fbbf24",
        borderTopColor: "transparent",
        transform: [{ rotate }],
      }}
    />
  );
}

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
    const timer = setTimeout(() => setCompleted((c) => c + 1), 600);
    return () => clearTimeout(timer);
  }, [completed]);

  const progress = Math.min((completed / STEPS.length) * 100, 100);

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 64 }}>
        <Header />
      </View>

      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 8, textAlign: "center" }}>
          자산 정보를 불러오고 있어요
        </Text>
        <Text style={{ fontSize: 13, color: "#9ca3af", marginBottom: 32, textAlign: "center" }}>
          잠시만 기다려 주세요
        </Text>

        {STEPS.map((step, i) => {
          const isDone = i < completed;
          const isActive = i === completed;
          return (
            <View
              key={step}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: isDone ? "#fffbeb" : isActive ? "#fef3c7" : "#f9fafb",
                borderRadius: 12,
                padding: 14,
                marginBottom: 10,
              }}
            >
              <View style={{ width: 24, alignItems: "center", marginRight: 10 }}>
                {isDone ? (
                  <Text style={{ fontSize: 16, color: "#16a34a" }}>✓</Text>
                ) : isActive ? (
                  <Spinner />
                ) : (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#d1d5db" }} />
                )}
              </View>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: isActive ? "bold" : "normal",
                  color: isDone || isActive ? "#111827" : "#9ca3af",
                }}
              >
                {step}
              </Text>
            </View>
          );
        })}

        <View style={{ height: 8, backgroundColor: "#e5e7eb", borderRadius: 4, marginTop: 20, overflow: "hidden" }}>
          <View style={{ width: `${progress}%`, height: 8, backgroundColor: "#fbbf24", borderRadius: 4 }} />
        </View>
        <Text style={{ textAlign: "center", color: "#9ca3af", marginTop: 10, fontSize: 13 }}>
          진행 중 {Math.round(progress)}%
        </Text>
      </View>
    </View>
  );
}