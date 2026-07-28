import { View, Text, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { predictGarch, optimizeHrp } from "../lib/api";

const LABEL_MAP: Record<string, string> = {
  대출상환: "상환",
  예금: "저축",
  투자자산: "투자",
};

// Figma 최종본 색감에 맞춤: 상환=짙은 금색, 저축=남색, 투자=옅은 청회색
const COLOR_MAP: Record<string, string> = {
  대출상환: "#c99a3b",
  예금: "#1e2a44",
  투자자산: "#6b7f78",
};

const PRODUCT_MAP: Record<string, { name: string; reason: string }> = {
  대출상환: { name: "KB 든든 중도상환 서비스", reason: "변동금리 대출이라 금리 상승기엔 상환이 유리해요." },
  예금: { name: "KB 마이핏 정기예금", reason: "안정추구형 성향에 맞는 원금보장 상품이에요." },
  투자자산: { name: "KB 우량채권형 펀드", reason: "주식 비중이 이미 높으니 채권으로 분산해요." },
};

export default function AllocationScreen() {
  const { personaId } = useLocalSearchParams<{ personaId: string }>();
  const router = useRouter();
  const persona = personas.find((p) => p.id === personaId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allocation, setAllocation] = useState<Record<string, number> | null>(null);
  const [hikeProb, setHikeProb] = useState(0);
  const monthlySpare = persona ? Math.max(persona.monthlyIncome - persona.monthlyFixedExpense, 100000) : 0;

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

        const hrpResult = await optimizeHrp({
          deposit_returns: dummyDepositReturns,
          investment_returns: dummyInvestmentReturns,
          loan_rate: persona!.loanRate,
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
    .map(([key, value]) => ({ key, x: LABEL_MAP[key] ?? key, y: Math.round(value * 100), color: COLOR_MAP[key] ?? "#9ca3af" }));

  const hasLoan = persona.loanAmount > 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "white", paddingHorizontal: 20, paddingTop: 64 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 4 }}>추천 자산 배분</Text>
      <Text style={{ color: "#6b7280", marginBottom: 24 }}>
        {persona.name}님께 맞춘 상환·저축·투자 비율이에요
      </Text>

      <View style={{ backgroundColor: "#f9fafb", borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <Text style={{ color: "#6b7280", marginBottom: 4 }}>이번 달 여유자금</Text>
        <Text style={{ fontSize: 24, fontWeight: "bold" }}>{(monthlySpare / 10000).toLocaleString()}만원</Text>
      </View>

      <View style={{ alignItems: "center", marginBottom: 16 }}>
        <PieChart data={chartData.map((d) => ({ label: d.x, value: d.y, color: d.color }))} size={220} />
      </View>

      {chartData.map((d) => (
        <View key={d.key} style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: d.color, marginRight: 8 }} />
          <Text style={{ fontSize: 16 }}>{d.x}</Text>
          <Text style={{ marginLeft: "auto", fontWeight: "bold", fontSize: 16 }}>
            {d.y}% · {Math.round((monthlySpare * d.y) / 100 / 10000)}만원
          </Text>
        </View>
      ))}

      {/* ① 왜 이렇게 배분했나요 */}
      <Text style={{ fontWeight: "bold", fontSize: 16, marginTop: 24, marginBottom: 12 }}>
        ① 왜 이렇게 배분했나요
      </Text>

      {hasLoan && (
        <View style={{ backgroundColor: "#f9fafb", borderRadius: 16, padding: 18, marginBottom: 12 }}>
          <Text style={{ fontWeight: "bold", marginBottom: 8 }}>🔗 상관관계 분석</Text>
          <Text style={{ color: "#374151", lineHeight: 20 }}>
            보유하신 대출({(persona.loanRate! * 100).toFixed(1)}%, {persona.loanType})과 투자자산은 금리
            상승기에 함께 나빠지는 경향이 있어요.{"\n"}→ 같은 위험 그룹으로 묶여 분산 효과가 낮다고 판단
          </Text>
        </View>
      )}

      <View style={{ backgroundColor: "#f9fafb", borderRadius: 16, padding: 18, marginBottom: 12 }}>
        <Text style={{ fontWeight: "bold", marginBottom: 8 }}>📊 금리신호 반영</Text>
        <Text style={{ color: "#374151", lineHeight: 20 }}>
          GARCH-X 모델이 3개월 내 추가 금리 인상 가능성을 {(hikeProb * 100).toFixed(0)}%로 예측했어요.{"\n"}
          {hasLoan
            ? "→ 변동금리 대출의 상환 부담이 커질 가능성이 높아, 상환 비중을 상향했어요."
            : "→ 예·적금·채권형 상품의 기대수익이 높아질 가능성을 반영했어요."}
        </Text>
      </View>

      <View style={{ backgroundColor: "#f9fafb", borderRadius: 16, padding: 18, marginBottom: 24 }}>
        <Text style={{ fontWeight: "bold", marginBottom: 8 }}>⚖️ 최종 판단</Text>
        <Text style={{ color: "#374151", lineHeight: 20 }}>
          {hasLoan
            ? "대출과 상관관계 높은 자산에 투자를 늘리는 대신, 금리 리스크를 먼저 줄이는 쪽이 기대손실 대비 안전해요."
            : "보유 중인 대출이 없어, 리스크 성향에 맞춘 저축·투자 중심으로 배분했어요."}
        </Text>
      </View>

      {/* ② KB 상품 연계 */}
      <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 12 }}>
        ② 이 배분, KB 상품으로 실행하면
      </Text>

      {chartData.map((d) => {
        const product = PRODUCT_MAP[d.key];
        if (!product) return null;
        return (
          <View key={d.key} style={{ backgroundColor: "#fffbeb", borderRadius: 16, padding: 18, marginBottom: 12 }}>
            <Text style={{ color: "#92400e", fontWeight: "bold", marginBottom: 4 }}>
              ● {d.x} · {Math.round((monthlySpare * d.y) / 100 / 10000)}만원
            </Text>
            <Text style={{ fontWeight: "bold", fontSize: 15, marginBottom: 4 }}>{product.name}</Text>
            <Text style={{ color: "#6b7280", fontSize: 13, marginBottom: 10 }}>{product.reason}</Text>
            <Text style={{ color: "#b45309", fontSize: 13, fontWeight: "bold", textAlign: "right" }}>알아보기 →</Text>
          </View>
        );
      })}

      {/* 최근 배분 변화 이력 (데모용 합성 데이터) */}
      <View style={{ backgroundColor: "#f9fafb", borderRadius: 16, padding: 18, marginTop: 12, marginBottom: 20 }}>
        <Text style={{ fontWeight: "bold", marginBottom: 10 }}>최근 배분 변화 이력</Text>
        <Text style={{ color: "#6b7280", fontSize: 13, marginBottom: 4 }}>2026.03  상환 40% · 저축 35% · 투자 25%</Text>
        <Text style={{ color: "#6b7280", fontSize: 13 }}>2026.06  상환 55% · 저축 25% · 투자 20% (현재)</Text>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 40 }}>
        <Pressable style={{ backgroundColor: "#f3f4f6", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24 }} onPress={() => router.back()}>
          <Text style={{ fontWeight: "bold" }}>이전</Text>
        </Pressable>
        <Pressable style={{ backgroundColor: "#f3f4f6", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24 }} onPress={() => router.push("/")}>
          <Text style={{ fontWeight: "bold" }}>처음부터 다시</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}