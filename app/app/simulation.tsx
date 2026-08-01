import { View, Text, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Slider from "@react-native-community/slider";
import { useEffect, useState } from "react";
import { personas } from "../data/personas";
import { simulateStress, StressTestResponse } from "../lib/api";
import { LineChart } from "../components/LineChart";

export default function SimulationScreen() {
  const { personaId, goal } = useLocalSearchParams<{ personaId: string; goal?: string }>();
  const router = useRouter();
  const persona = personas.find((p) => p.id === personaId);

  const [rateShock, setRateShock] = useState(1.0);
  const [result, setResult] = useState<StressTestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentNetAsset = persona
    ? persona.deposit + persona.investment - persona.loanAmount
    : 0;

  useEffect(() => {
    if (!persona) return;
    runSimulation(rateShock);
  }, [personaId]);

  async function runSimulation(shock: number) {
    if (!persona) return;
    setLoading(true);
    setError(null);
    try {
      const netAsset = persona.deposit + persona.investment - persona.loanAmount;
      const monthlySavings = Math.max(
        persona.monthlyIncome - persona.monthlyFixedExpense,
        100000
      );
      const res = await simulateStress({
        loan_amount: persona.loanAmount,
        loan_rate: persona.loanRate ?? 0.04,
        loan_years_left: 25,
        rate_shock_pp: shock,
        current_net_asset: netAsset,
        monthly_savings: monthlySavings,
        months: 24,
        n_sims: 1000,
      });
      setResult(res);
    } catch (e) {
      console.error(e);
      setError("시뮬레이션에 실패했어요. 서버 연결을 확인해주세요.");
    } finally {
      setLoading(false);
    }
  }

  if (!persona) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>페르소나를 찾을 수 없어요.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "white", paddingHorizontal: 20, paddingTop: 64 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 4 }}>금리 스트레스 테스트</Text>
      <Text style={{ color: "#6b7280", marginBottom: 24 }}>
        기준금리가 상승할 경우 부담 변화를 확인해 보세요.
      </Text>

      <View style={{ backgroundColor: "#f9fafb", borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
          <Text style={{ color: "#6b7280" }}>금리 상승 시나리오</Text>
          <Text style={{ fontWeight: "bold", color: "#f97316" }}>+{rateShock.toFixed(1)}%p</Text>
        </View>
        <Slider
          minimumValue={0.5}
          maximumValue={2}
          step={0.5}
          value={rateShock}
          minimumTrackTintColor="#fbbf24"
          onSlidingComplete={(v) => {
            setRateShock(v);
            runSimulation(v);
          }}
        />
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
          <Text style={{ fontSize: 12, color: "#9ca3af" }}>+0.5%p</Text>
          <Text style={{ fontSize: 12, color: "#9ca3af" }}>+2%p</Text>
        </View>
      </View>

      {loading && (
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <ActivityIndicator size="large" />
        </View>
      )}

      {error && <Text style={{ color: "#ef4444", marginBottom: 16 }}>{error}</Text>}

      {!loading && result && (
        <>
          <View style={{ backgroundColor: "#f9fafb", borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <Text style={{ color: "#6b7280", marginBottom: 4 }}>월 상환부담 변화</Text>
            <Text style={{ fontSize: 24, fontWeight: "bold" }}>
              {Math.round(result.stressed_monthly_payment / 10000).toLocaleString()}만원{" "}
              <Text style={{ color: "#ef4444", fontSize: 16 }}>
                (+{Math.round(result.monthly_payment_delta / 10000).toLocaleString()}만원)
              </Text>
            </Text>
            <Text style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>
              기존 {Math.round(result.current_monthly_payment / 10000).toLocaleString()}만원 → 변경 후 예상
            </Text>
          </View>

          <View style={{ backgroundColor: "#f9fafb", borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <Text style={{ color: "#6b7280", marginBottom: 4 }}>24개월 후 순자산 변화</Text>
            <Text style={{ fontSize: 15, color: "#9ca3af", marginBottom: 4 }}>
              현재 {currentNetAsset < 0 ? "-" : ""}
              {Math.abs(Math.round(currentNetAsset / 10000)).toLocaleString()}만원 →
            </Text>
            <Text style={{ fontSize: 24, fontWeight: "bold" }}>
              {Math.round(result.net_asset_after_months_stressed / 10000).toLocaleString()}만원
            </Text>
            <Text style={{ fontSize: 13, color: "#3b82f6", marginTop: 4 }}>
              스트레스 시나리오 미적용 대비 {Math.round(result.net_asset_delta / 10000).toLocaleString()}만원
            </Text>
          </View>

          <View style={{ backgroundColor: "#f9fafb", borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <Text style={{ color: "#6b7280", marginBottom: 12 }}>순자산 시뮬레이션 (몬테카를로, 24개월)</Text>
            <View style={{ alignItems: "center" }}>
              <LineChart basePath={result.simulation_paths[0]} stressedPath={result.simulation_paths[1]} />
            </View>
            <View style={{ flexDirection: "row", marginTop: 12, gap: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 16, height: 2, backgroundColor: "#1f2937", marginRight: 6 }} />
                <Text style={{ fontSize: 12, color: "#6b7280" }}>기본 전망</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 16, height: 2, backgroundColor: "#f97316", marginRight: 6 }} />
                <Text style={{ fontSize: 12, color: "#6b7280" }}>스트레스 시나리오</Text>
              </View>
            </View>
          </View>

          <Pressable
            style={{ backgroundColor: "#fbbf24", borderRadius: 12, paddingVertical: 16, alignItems: "center", marginBottom: 40 }}
            onPress={() => router.push({ pathname: "/allocation", params: { personaId, goal } })}
          >
            <Text style={{ fontWeight: "bold", color: "#1f2937" }}>추천 배분 보기</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}