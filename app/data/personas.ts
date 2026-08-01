export type Persona = {
  id: string;
  name: string;
  ageGroup: string;
  summary: string;
  monthlyIncome: number;
  monthlyFixedExpense: number;
  deposit: number;
  investment: number;
  loanAmount: number;
  loanRate: number | null;
  loanType: "고정" | "변동" | null;
  selfReportedRisk: number;
  isMainDemo: boolean;
};

export const personas: Persona[] = [
  {
    id: "social-newbie",
    name: "사회초년생",
    ageGroup: "20대 후반",
    summary: "예금 800만원 · 학자금 대출 보유",
    monthlyIncome: 2_800_000,
    monthlyFixedExpense: 1_200_000,
    deposit: 8_000_000,
    investment: 3_000_000,
    loanAmount: 12_000_000,
    loanRate: 0.039,
    loanType: "고정",
    selfReportedRisk: 3,
    isMainDemo: false,
  },
  {
    id: "newlywed",
    name: "신혼부부",
    ageGroup: "30대 초반",
    summary: "맞벌이 · 대출 없음 · 내 집 마련 준비",
    monthlyIncome: 5_500_000,
    monthlyFixedExpense: 2_200_000,
    deposit: 30_000_000,
    investment: 12_000_000,
    loanAmount: 0,
    loanRate: null,
    loanType: null,
    selfReportedRisk: 3,
    isMainDemo: false,
  },
  {
    id: "loan-holder",
    name: "대출보유 직장인",
    ageGroup: "30대 후반",
    summary: "변동 금리 주담대 2억 4000만원 · 상환 vs 투자 결정",
    monthlyIncome: 4_800_000,
    monthlyFixedExpense: 2_500_000,
    deposit: 15_000_000,
    investment: 25_000_000,
    loanAmount: 240_000_000,
    loanRate: 0.042,
    loanType: "변동",
    selfReportedRisk: 2,
    isMainDemo: true,
  },
  {
    id: "pre-retirement",
    name: "은퇴준비 중년",
    ageGroup: "50대 초반",
    summary: "대출 없음 · 자산 2억원 이상 · 은퇴 10년 준비",
    monthlyIncome: 6_000_000,
    monthlyFixedExpense: 2_800_000,
    deposit: 80_000_000,
    investment: 120_000_000,
    loanAmount: 0,
    loanRate: null,
    loanType: null,
    selfReportedRisk: 3,
    isMainDemo: false,
  },
];

// GARCH-X 테스트용 더미 금리·뉴스 시계열 (추후 ECOS/네이버뉴스 API로 교체)
export const dummyRateHistory = [
  3.50, 3.51, 3.49, 3.52, 3.53, 3.55, 3.54, 3.56, 3.58, 3.57,
  3.59, 3.60, 3.62, 3.61, 3.63, 3.65, 3.64, 3.66, 3.68, 3.70,
];
export const dummyNewsSentiment = [
  0.1, -0.2, 0.3, 0.0, -0.1, 0.2, 0.4, -0.3, 0.1, 0.0,
  0.2, -0.1, 0.3, 0.1, -0.2, 0.4, 0.0, 0.1, -0.1, 0.2,
];
export const dummyNewsVolume = [5, 3, 7, 4, 6, 8, 5, 3, 6, 7, 4, 5, 8, 6, 3, 7, 5, 4, 6, 5];
export const dummyDepositReturns = [
  0.002, 0.0018, 0.0021, 0.0019, 0.002, 0.0022, 0.0019, 0.002, 0.0021, 0.002,
  0.0019, 0.0021, 0.002, 0.0018, 0.0022, 0.002, 0.0019, 0.0021, 0.002, 0.0019,
];
export const dummyInvestmentReturns = [
  0.01, -0.02, 0.03, 0.015, -0.01, 0.025, -0.03, 0.02, 0.01, -0.015,
  0.02, -0.025, 0.03, 0.015, -0.02, 0.01, 0.025, -0.01, 0.02, -0.015,
];