// lib/api.ts
const API_BASE = "http://192.168.35.41:8000"; // 본인 IP로 확인 후 교체

export type RiskSummaryResponse = {
  total_variable_rate_borrowers: number;
  high_risk_count: number;
  high_risk_pct: number;
  stress_exceed_count: number;
  risk_distribution: { level: string; count: number }[];
  at_risk_customers: {
    id: string;
    risk_score: number;
    loan_amount: number;
    rate_type: string;
    payment_increase: number;
  }[];
};

export async function fetchRiskSummary(): Promise<RiskSummaryResponse> {
  const res = await fetch(`${API_BASE}/api/admin/risk-summary/`, { cache: "no-store" });
  if (!res.ok) throw new Error(`리스크 요약 조회 실패: ${res.status}`);
  return res.json();
}