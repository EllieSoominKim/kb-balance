import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { PieChart } from "../components/PieChart";
import {
  personas,
  dummyRateHistory,
  dummyNewsSentiment,
  dummyNewsVolume,
  dummyDepositReturns,
  dummyInvestmentReturns,
} from "../data/personas";
import { predictGarch, optimizeHrp, HrpResponse } from "../lib/api";

const LABEL_MAP: Record<string, string> = {
  대출상환: "상환",
  예금: "저축",
  투자자산: "투자",
};

const COLOR_MAP: Record<string, string> = {
  대출상환: "#f97316",
  예금: "#3b82f6",
  투자자산: "#8b5cf6",
};

export default function AllocationScreen() {
  const { personaId } = useLocalSearchParams<{ personaId: string }>();
  const persona = personas.find((p) => p.id === personaId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allocation, setAllocation] = useState<Record<string, number> | null>(null);
  const [hikeProb, setHikeProb] = useState(0);

  useEffect(() => {
    if (!persona) return;

    async function loadAllocation() {
      try {
        const garchResult = await predictGarch({
          rate_history: dummyRateHistory,
          news_sentiment: dummyNewsSentiment,
          news_volume: dummyNewsVolume,
          horizon: 3,
          threshold_bp: 25,
        });
        setHikeProb(garchResult.hike_probability);

        const hrpResult: HrpResponse = await optimizeHrp({
          deposit_returns: dummyDepositReturns,
          investment_returns: dummyInvestmentReturns,
          loan_rate: persona.loanRate,
          hike_probability: garchResult.hike_probability,
          rate_volatility: garchResult.next_month_volatility * 100,
        });
        setAllocation(hrpResult.allocation);
      } catch (e) {
        console.error(e);
        setError("배분 계산에 실패했어요. 서버 연결을 확인해주세요.");
      } finally {
        setLoading(false);
      }
    }

    loadAllocation();
  }, [personaId]);

  if (!persona) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>페르소나를 찾을 수 없어요.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12, color: "#6b7280" }}>최적 배분을 계산하는 중이에요</Text>
      </View>
    );
  }

  if (error || !allocation) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ color: "#ef4444" }}>{error}</Text>
      </View>
    );
  }

  const chartData = Object.entries(allocation)
    .filter(([key]) => key !== "대출상환" || persona.loanAmount > 0)
    .map(([key, value]) => ({
      x: LABEL_MAP[key] ?? key,
      y: Math.round(value * 100),
      color: COLOR_MAP[key] ?? "#9ca3af",
    }));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "white", paddingHorizontal: 20, paddingTop: 64 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 4 }}>추천 자산 배분</Text>
      <Text style={{ color: "#6b7280", marginBottom: 24 }}>
        {persona.name}님께 맞춘 상환·저축·투자 비율이에요
      </Text>

      <View style={{ alignItems: "center", marginBottom: 24 }}>
        <PieChart
          data={chartData.map((d) => ({ label: d.x, value: d.y, color: d.color }))}
          size={240}
        />
      </View>

      {chartData.map((d) => (
        <View
          key={d.x}
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}
        >
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: d.color, marginRight: 8 }} />
          <Text style={{ fontSize: 16 }}>{d.x}</Text>
          <Text style={{ marginLeft: "auto", fontWeight: "bold", fontSize: 16 }}>{d.y}%</Text>
        </View>
      ))}

      <View style={{ backgroundColor: "#f9fafb", borderRadius: 16, padding: 20, marginTop: 16, marginBottom: 40 }}>
        <Text style={{ fontWeight: "bold", marginBottom: 8 }}>왜 이렇게 배분했나요</Text>
        <Text style={{ color: "#374151", lineHeight: 20 }}>
          {persona.loanAmount > 0
            ? `GARCH-X 모델이 3개월 내 금리 인상 가능성을 ${(hikeProb * 100).toFixed(0)}%로 예측했어요. 변동금리 대출의 상환 부담이 커질 가능성이 높아 상환 비중을 높였어요.`
            : "보유 중인 대출이 없어, 리스크 성향에 맞춘 저축·투자 중심으로 배분했어요."}
        </Text>
      </View>
    </ScrollView>
  );
}