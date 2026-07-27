const API_BASE = "http://192.168.35.41:8000";

export type ProfileRequest = {
  persona_id: string;
  monthly_income: number;
  monthly_fixed_expense: number;
  deposit: number;
  investment: number;
  loan_amount: number;
  loan_rate?: number | null;
  loan_type?: string | null;
  self_reported_risk: number;
  goal: string;
  goal_horizon_years?: number | null;
  rebalance_frequency?: string | null;
};

export type ProfileResponse = {
  profile_id: number;
  self_reported_risk: number;
  calibrated_risk: number;
  adjusted: boolean;
  calibration_reason: string | null;
};

export async function submitProfile(payload: ProfileRequest): Promise<ProfileResponse> {
  const res = await fetch(`${API_BASE}/api/profile/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`프로필 저장 실패: ${res.status}`);
  return res.json();
}

export type GarchRequest = {
  rate_history: number[];
  news_sentiment: number[];
  news_volume: number[];
  horizon?: number;
  threshold_bp?: number;
};

export type GarchResponse = {
  hike_probability: number;
  next_month_volatility: number;
};

export async function predictGarch(payload: GarchRequest): Promise<GarchResponse> {
  const res = await fetch(`${API_BASE}/api/predict/garch/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`GARCH 예측 실패: ${res.status}`);
  return res.json();
}

export type HrpRequest = {
  deposit_returns: number[];
  investment_returns: number[];
  loan_rate?: number | null;
  hike_probability: number;
  rate_volatility?: number | null;
};

export type HrpResponse = {
  allocation: Record<string, number>;
};

export async function optimizeHrp(payload: HrpRequest): Promise<HrpResponse> {
  const res = await fetch(`${API_BASE}/api/optimize/hrp/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HRP 최적화 실패: ${res.status}`);
  return res.json();
}

export type StressTestRequest = {
  loan_amount: number;
  loan_rate: number;
  loan_years_left: number;
  rate_shock_pp: number;
  current_net_asset: number;
  monthly_savings: number;
  months?: number;
  n_sims?: number;
};

export type StressTestResponse = {
  current_monthly_payment: number;
  stressed_monthly_payment: number;
  monthly_payment_delta: number;
  net_asset_after_months_base: number;
  net_asset_after_months_stressed: number;
  net_asset_delta: number;
  simulation_paths: number[][];
};

export async function simulateStress(payload: StressTestRequest): Promise<StressTestResponse> {
  const res = await fetch(`${API_BASE}/api/simulate/stress/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`스트레스 테스트 실패: ${res.status}`);
  return res.json();
}