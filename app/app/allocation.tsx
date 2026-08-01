import { View, Text, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { NavBar } from "../components/NavBar";
import { PieChart } from "../components/PieChart";
import { Header } from "../components/Header";
import {
  personas,
  dummyRateHistory,
  dummyNewsSentiment,
  dummyNewsVolume,
  dummyDepositReturns,
  dummyInvestmentReturns,
} from "../data/personas";
import {
  fetchRateHistory,
  fetchNewsSentiment,
  predictGarch,
  optimizeHrp,
  saveAllocationSnapshot,
  fetchAllocationHistory,
  submitProfile,
} from "../lib/api";

const LABEL_MAP: Record<string, string> = {
  대출상환: "상환",
  예금: "저축",
  투자자산: "투자",
};

const COLOR_MAP: Record<string, string> = {
  대출상환: "#c99a3b",
  예금: "#1e2a44",
  투자자산: "#6b7f78",
};

function isYouth(ageGroup: string): boolean {
  return ageGroup.includes("20대") || ageGroup === "30대 초반";
}

function isLargeLoan(loanAmount: number): boolean {
  return loanAmount >= 100_000_000;
}

function matchProduct(
  category: string,
  context: {
    loanType: string | null;
    loanAmount: number;
    calibratedRisk: number;
    correlation: number | null;
    ageGroup: string;
    goal: string;
    investment: number;
  }
): { name: string; reason: string } {
  const { loanType, loanAmount, calibratedRisk, correlation, ageGroup, goal, investment } = context;

  if (category === "대출상환") {
    if (isLargeLoan(loanAmount)) {
      if (loanType === "변동") {
        return {
          name: "KB 주택담보대출 갈아타기",
          reason: "규모가 큰 변동금리 대출이라, 혼합금리형으로 전환하면 상승기 부담을 줄일 수 있어요.",
        };
      }
      return {
        name: "KB 주택담보대출 조기상환",
        reason: "규모가 큰 고정금리 대출이라, 여유자금으로 원금을 앞당겨 갚으면 총 이자비용을 줄일 수 있어요.",
      };
    }
    if (loanType === "변동") {
      return {
        name: "KB 대출금상환 서비스",
        reason: "변동금리 대출이라 금리 상승기엔 중도상환으로 부담을 줄이는 게 유리해요.",
      };
    }
    return {
      name: "KB 대출 갈아타기(대환대출)",
      reason: "고정금리라 상환 급박도는 낮지만, 더 낮은 금리 상품으로 갈아탈 수 있는지 비교해봐요.",
    };
  }

  if (category === "예금") {
    if (isYouth(ageGroup) && goal.includes("내집")) {
      return {
        name: "청년 주택드림 청약통장",
        reason: "만 19~34세 청년의 내집마련 목표에 맞춘 청약통장으로, 비과세 혜택도 받을 수 있어요.",
      };
    }
    if (isYouth(ageGroup)) {
      return {
        name: "KB청년미래적금",
        reason: "만 19~34세 청년 대상 정책형 적금으로, 정부기여금과 이자소득세 비과세 혜택이 있어요.",
      };
    }
    if (goal.includes("목돈")) {
      return {
        name: "KB내맘대로적금",
        reason: "목돈 마련 목표에 맞춰 자유롭게 납입액을 조절할 수 있는 적금이에요.",
      };
    }
    if (investment >= 50_000_000 && calibratedRisk >= 3) {
      return {
        name: "KB글로벌 외화투자통장",
        reason: "이미 투자자산 규모가 있는 편이라, 외화 분산으로 환테크 기회도 함께 노려볼 수 있어요.",
      };
    }
    if (calibratedRisk <= 2) {
      return {
        name: "KB Star 정기예금",
        reason: "안정추구형 성향에 맞는 KB 대표 정기예금 상품이에요.",
      };
    }
    if (calibratedRisk === 3) {
      return {
        name: "KB내맘대로적금",
        reason: "중립형 성향에 맞춰 자유롭게 납입하며 목돈을 모을 수 있어요.",
      };
    }
    return {
      name: "KB WELCOME통장",
      reason: "성장추구형 성향이라, 입출금이 자유로운 통장에 대기자금을 두고 투자 기회를 노려볼 수 있어요.",
    };
  }

  if (category === "투자자산") {
    if (goal.includes("은퇴")) {
      return {
        name: "KB 연금저축펀드",
        reason: "은퇴 준비 목표에 맞춰 세제혜택이 있는 장기 연금상품으로 투자해요.",
      };
    }
    if (correlation !== null && correlation > 0.3) {
      return {
        name: "KB 추천펀드(채권형)",
        reason: "기존 자산과 상관관계가 높아, 채권형 펀드로 분산해 리스크를 낮춰요. (이달의 추천펀드는 매월 갱신돼요)",
      };
    }
    if (calibratedRisk >= 4) {
      return {
        name: "KB ISA(투자중개형)",
        reason: "성장추구형 성향이라, 세제혜택과 함께 다양한 상품을 한 계좌에서 운용할 수 있는 ISA가 잘 맞아요.",
      };
    }
    return {
      name: "KB 추천펀드(글로벌 자산배분형)",
      reason: "기존 자산과 상관관계가 낮아, 지역·자산군을 넓힌 자산배분형 펀드로 분산 효과를 극대화해요. (이달의 추천펀드는 매월 갱신돼요)",
    };
  }

  return { name: "KB 상품 상담", reason: "맞춤 상품을 안내받아보세요." };
}

export default function AllocationScreen() {
  const { personaId, goal } = useLocalSearchParams<{ personaId: string; goal?: string }>();
  const router = useRouter();
  const persona = personas.find((p) => p.id === personaId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allocation, setAllocation] = useState<Record<string, number> | null>(null);
  const [hikeProb, setHikeProb] = useState(0);
  const [correlation, setCorrelation] = useState<number | null>(null);
  const [calibratedRisk, setCalibratedRisk] = useState(3);
  const [history, setHistory] = useState<
    { date: string; repayment_pct: number; savings_pct: number; investment_pct: number }[]
  >([]);

  const monthlySpare = persona ? Math.max(persona.monthlyIncome - persona.monthlyFixedExpense, 100000) : 0;

  useEffect(() => {
    if (!persona) return;

    async function loadAllocation() {
      try {
        const profileResult = await submitProfile({
          persona_id: persona!.id,
          monthly_income: persona!.monthlyIncome,
          monthly_fixed_expense: persona!.monthlyFixedExpense,
          deposit: persona!.deposit,
          investment: persona!.investment,
          loan_amount: persona!.loanAmount,
          loan_rate: persona!.loanRate,
          loan_type: persona!.loanType,
          self_reported_risk: persona!.selfReportedRisk,
          goal: goal ?? "여유자금 상환·투자 최적화",
          rebalance_frequency: "여유자금 생길 때마다",
        });
        setCalibratedRisk(profileResult.calibrated_risk);

        let rates = dummyRateHistory;
        let sentiment = dummyNewsSentiment;
        let volume = dummyNewsVolume;
        try {
          const ratesResult = await fetchRateHistory(24);
          rates = ratesResult.rate_history;
          const newsResult = await fetchNewsSentiment(24);
          sentiment = newsResult.news_sentiment;
          volume = newsResult.news_volume;
        } catch (e) {
          console.warn("실시간 시장 데이터 조회 실패, 더미로 대체:", e);
        }

        const garchResult = await predictGarch({
          rate_history: rates,
          news_sentiment: sentiment,
          news_volume: volume,
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
        setCorrelation(hrpResult.loan_investment_correlation);

        const repaymentPct = Math.round((hrpResult.allocation["대출상환"] ?? 0) * 100);
        const savingsPct = Math.round((hrpResult.allocation["예금"] ?? 0) * 100);
        const investmentPct = Math.round((hrpResult.allocation["투자자산"] ?? 0) * 100);
        await saveAllocationSnapshot({
          persona_id: persona!.id,
          repayment_pct: repaymentPct,
          savings_pct: savingsPct,
          investment_pct: investmentPct,
        });
        const historyResult = await fetchAllocationHistory(persona!.id);
        setHistory(historyResult);
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
      key,
      x: LABEL_MAP[key] ?? key,
      y: Math.round(value * 100),
      color: COLOR_MAP[key] ?? "#9ca3af",
    }));

  const hasLoan = persona.loanAmount > 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "white", paddingHorizontal: 20, paddingTop: 64 }}>
      <Header />
      <NavBar active="allocation" personaId={personaId} goal={goal} onBack={() => router.push({ pathname: "/simulation", params: { personaId, goal } })} />

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

      <Text style={{ fontWeight: "bold", fontSize: 16, marginTop: 24, marginBottom: 12 }}>
        ① 왜 이렇게 배분했나요
      </Text>

      {hasLoan && (
        <View style={{ backgroundColor: "#f9fafb", borderRadius: 16, padding: 18, marginBottom: 12 }}>
          <Text style={{ fontWeight: "bold", marginBottom: 8 }}>🔗 상관관계 분석</Text>
          <Text style={{ color: "#374151", lineHeight: 20 }}>
            보유하신 대출({(persona.loanRate! * 100).toFixed(1)}%, {persona.loanType})과 투자자산은{" "}
            {correlation !== null && correlation > 0.3
              ? "금리 상승기에 함께 나빠지는 경향이 있어요"
              : "상관관계가 낮아 분산 효과가 있는 편이에요"}
            {correlation !== null ? ` (상관계수 ${correlation})` : ""}
            {"\n"}→{" "}
            {correlation !== null && correlation > 0.3
              ? "같은 위험 그룹으로 묶여 분산 효과가 낮다고 판단"
              : "서로 다른 위험 그룹으로 분리되어 분산 효과가 있다고 판단"}
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

      <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 12 }}>
        ② 이 배분, KB 상품으로 실행하면
      </Text>

      {chartData.map((d) => {
        const product = matchProduct(d.key, {
          loanType: persona.loanType,
          loanAmount: persona.loanAmount,
          calibratedRisk,
          correlation,
          ageGroup: persona.ageGroup,
          goal: goal ?? "여유자금 상환·투자 최적화",
          investment: persona.investment,
        });
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

      <View style={{ backgroundColor: "#f9fafb", borderRadius: 16, padding: 18, marginTop: 12, marginBottom: 20 }}>
        <Text style={{ fontWeight: "bold", marginBottom: 10 }}>최근 배분 변화 이력</Text>
        {history.length <= 1 ? (
          <Text style={{ color: "#9ca3af", fontSize: 13 }}>
            아직 이력이 충분하지 않아요. 계산할 때마다 자동으로 기록되니, 다시 방문하면 변화 추이를 볼 수 있어요.
          </Text>
        ) : (
          history.map((h, i) => (
            <Text key={i} style={{ color: "#6b7280", fontSize: 13, marginBottom: 4 }}>
              {h.date}  상환 {h.repayment_pct}% · 저축 {h.savings_pct}% · 투자 {h.investment_pct}%
              {i === history.length - 1 ? " (현재)" : ""}
            </Text>
          ))
        )}
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 40 }}>
        <Pressable
          style={{ backgroundColor: "#f3f4f6", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24 }}
          onPress={() => router.back()}
        >
          <Text style={{ fontWeight: "bold" }}>이전</Text>
        </Pressable>
        <Pressable
          style={{ backgroundColor: "#f3f4f6", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24 }}
          onPress={() => router.push("/")}
        >
          <Text style={{ fontWeight: "bold" }}>처음부터 다시</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}