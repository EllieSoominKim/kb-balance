import { View, Text, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { SingleLineChart } from "../components/SingleLineChart";
import { Header } from "../components/Header";
import { NavBar } from "../components/NavBar";
import {
  personas,
  dummyRateHistory,
  dummyNewsSentiment,
  dummyNewsVolume,
} from "../data/personas";
import {
  fetchRateHistory,
  fetchNewsSentiment,
  submitProfile,
  predictGarch,
  ProfileResponse,
  GarchResponse,
} from "../lib/api";
import { RiskGauge } from "../components/RiskGauge";

function summarizeSentiment(scores: number[]) {
  const positive = scores.filter((s) => s > 0.15).length;
  const negative = scores.filter((s) => s < -0.15).length;
  const neutral = scores.length - positive - negative;
  const total = scores.length || 1;
  const mean = scores.reduce((a, b) => a + b, 0) / total;
  const variance = scores.reduce((a, b) => a + (b - mean) ** 2, 0) / total;
  const std = Math.sqrt(variance);
  const disagreement = std > 0.25 ? "높음" : std > 0.12 ? "보통" : "낮음";
  return {
    positivePct: Math.round((positive / total) * 100),
    neutralPct: Math.round((neutral / total) * 100),
    negativePct: Math.round((negative / total) * 100),
    disagreement,
  };
}

export default function DashboardScreen() {
  const { personaId, risk, goal } = useLocalSearchParams<{
    personaId: string;
    risk?: string;
    goal?: string;
  }>();
  const router = useRouter();
  const persona = personas.find((p) => p.id === personaId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [garch, setGarch] = useState<GarchResponse | null>(null);
  const [rateHistory, setRateHistory] = useState<number[]>(dummyRateHistory);
  const [newsSentimentReal, setNewsSentimentReal] = useState<number[]>(dummyNewsSentiment);

  useEffect(() => {
    if (!persona) return;

    async function loadData() {
      try {
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
        setRateHistory(rates);
        setNewsSentimentReal(sentiment);

        const [profileResult, garchResult] = await Promise.all([
          submitProfile({
            persona_id: persona.id,
            monthly_income: persona.monthlyIncome,
            monthly_fixed_expense: persona.monthlyFixedExpense,
            deposit: persona.deposit,
            investment: persona.investment,
            loan_amount: persona.loanAmount,
            loan_rate: persona.loanRate,
            loan_type: persona.loanType,
            self_reported_risk: risk ? Number(risk) : persona.selfReportedRisk,
            goal: goal ?? "여유자금 상환·투자 최적화",
            rebalance_frequency: "여유자금 생길 때마다",
          }),
          predictGarch({
            rate_history: rates,
            news_sentiment: sentiment,
            news_volume: volume,
            horizon: 3,
            threshold_bp: 25,
          }),
        ]);
        setProfile(profileResult);
        setGarch(garchResult);
      } catch (e) {
        console.error(e);
        setError("데이터를 불러오지 못했어요. 서버 연결을 확인해주세요");
      } finally {
        setLoading(false);
      }
    }

    loadData();
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
        <Text style={{ marginTop: 12, color: "#6b7280" }}>자산 정보를 불러오는 중이에요</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ color: "#ef4444" }}>{error}</Text>
      </View>
    );
  }

  const netAsset = persona.deposit + persona.investment - persona.loanAmount;
  const totalAsset = persona.deposit + persona.investment;
  const totalForBar = totalAsset + persona.loanAmount || 1;
  const assetBarPct = (totalAsset / totalForBar) * 100;
  const loanBarPct = (persona.loanAmount / totalForBar) * 100;
  const sentiment = summarizeSentiment(newsSentimentReal);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "white", paddingHorizontal: 20, paddingTop: 64 }}>
      <Header />
      <NavBar active="dashboard" personaId={personaId} goal={goal} onBack={() => router.push({ pathname: "/onboarding/timeline", params: { personaId, risk, goal } })} />

      <Text style={{ color: "#6b7280", marginBottom: 4 }}>{persona.name}님, 오늘의 자산 현황이에요</Text>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 15 }}>자산 대시보드</Text>

      <View style={{ backgroundColor: "#f9fafb", borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <Text style={{ color: "#6b7280", marginBottom: 4 }}>순자산 (자산 - 부채)</Text>
        <Text style={{ fontSize: 28, fontWeight: "bold", color: netAsset < 0 ? "#ef4444" : "#111827", marginBottom: 16 }}>
          {netAsset < 0 ? "-" : ""}{Math.abs(Math.round(netAsset / 10000)).toLocaleString()}만원
        </Text>

        <Text style={{ color: "#6b7280", fontSize: 13, marginBottom: 4 }}>자산</Text>
        <View style={{ height: 10, backgroundColor: "#e5e7eb", borderRadius: 5, marginBottom: 12 }}>
          <View style={{ width: `${assetBarPct}%`, height: 10, backgroundColor: "#fbbf24", borderRadius: 5 }} />
        </View>

        <Text style={{ color: "#6b7280", fontSize: 13, marginBottom: 4 }}>부채</Text>
        <View style={{ height: 10, backgroundColor: "#e5e7eb", borderRadius: 5 }}>
          <View style={{ width: `${loanBarPct}%`, height: 10, backgroundColor: "#f97316", borderRadius: 5 }} />
        </View>
      </View>

      <View style={{ backgroundColor: "#f9fafb", borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <Text style={{ color: "#6b7280", marginBottom: 12 }}>리스크 스코어</Text>
        <RiskGauge level={profile!.calibrated_risk} />

        {profile!.adjusted ? (
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontSize: 13, color: "#6b7280" }}>
              자기 응답: {profile!.self_reported_risk}/5
            </Text>
            <Text style={{ fontSize: 13, fontWeight: "bold", marginTop: 2 }}>
              재무 데이터 기반 보정: {profile!.calibrated_risk}/5
            </Text>
            <View style={{ backgroundColor: "#fef3c7", borderRadius: 8, padding: 10, marginTop: 8 }}>
              <Text style={{ fontSize: 13, color: "#78350f" }}>{profile!.calibration_reason}</Text>
            </View>
          </View>
        ) : (
          <View style={{ backgroundColor: "#f3f4f6", borderRadius: 8, padding: 10, marginTop: 12 }}>
            <Text style={{ fontSize: 13, color: "#6b7280" }}>
              재무 데이터를 검토했지만 자기 응답과 일치해, 보정 없이 그대로 반영했어요
            </Text>
          </View>
        )}
      </View>

      <View style={{ backgroundColor: "#f9fafb", borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <Text style={{ color: "#6b7280", marginBottom: 8 }}>실시간 금리 신호 (ECOS · GARCH-X)</Text>
        <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 8 }}>
          변동성 {garch!.next_month_volatility.toFixed(3)}
        </Text>

        <View style={{ alignItems: "center", marginVertical: 12 }}>
          <SingleLineChart data={rateHistory} width={280} height={100} />
        </View>

        <View style={{ backgroundColor: "#fef3c7", borderRadius: 8, padding: 12 }}>
          <Text style={{ fontSize: 13, color: "#78350f" }}>
            3개월 내 0.25%p 추가 인상 가능성 {(garch!.hike_probability * 100).toFixed(0)}%로 예측됩니다
          </Text>
        </View>
        {persona.loanAmount > 0 ? (
          <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 8 }}>
            * 변동금리 대출 상환부담이 커질 수 있어요
          </Text>
        ) : (
          <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 8 }}>
            * 예·적금·채권형 상품 기대수익이 높아질 수 있어요
          </Text>
        )}
      </View>

      <View style={{ backgroundColor: "#f9fafb", borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <Text style={{ color: "#6b7280", marginBottom: 8 }}>뉴스 감성 요약 (최근 7일)</Text>
        <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 12 }}>
          긍정 {sentiment.positivePct}% · 중립 {sentiment.neutralPct}% · 부정 {sentiment.negativePct}%
        </Text>
        <View style={{ flexDirection: "row", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
          <View style={{ flex: sentiment.positivePct || 1, backgroundColor: "#22c55e" }} />
          <View style={{ flex: sentiment.neutralPct || 1, backgroundColor: "#d1d5db" }} />
          <View style={{ flex: sentiment.negativePct || 1, backgroundColor: "#ef4444" }} />
        </View>
        <View style={{ backgroundColor: "#f3f4f6", borderRadius: 8, padding: 12 }}>
          <Text style={{ fontSize: 13, color: "#4b5563" }}>
            불일치도: <Text style={{ fontWeight: "bold" }}>{sentiment.disagreement}</Text> — 뉴스 논조 표준편차 기반으로 산출한 값이에요
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 40 }}>
        <Pressable
          style={{ backgroundColor: "#f3f4f6", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28 }}
          onPress={() => router.push({ pathname: "/simulation", params: { personaId, goal } })}
        >
          <Text style={{ fontWeight: "bold", color: "#1f2937" }}>시뮬레이션 ▶</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}