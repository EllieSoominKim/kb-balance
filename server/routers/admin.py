"""
GET /api/admin/risk-summary
은행 리스크 관제 대시보드용 고객 리스크 집계
현재는 페르소나 4종을 시드로 삼아 가상의 대출자 N명을 합성 생성 (데모용)
"""

from fastapi import APIRouter
from pydantic import BaseModel
import numpy as np

router = APIRouter()

LEVEL_LABELS = ["안정형", "안정추구형", "중립형", "성장추구형", "공격형"]


class AtRiskCustomer(BaseModel):
    id: str
    risk_score: int
    loan_amount: float
    rate_type: str
    payment_increase: float


class RiskDistributionItem(BaseModel):
    level: str
    count: int


class RiskSummaryResponse(BaseModel):
    total_variable_rate_borrowers: int
    high_risk_count: int
    high_risk_pct: float
    stress_exceed_count: int
    risk_distribution: list[RiskDistributionItem]
    at_risk_customers: list[AtRiskCustomer]


@router.get("/", response_model=RiskSummaryResponse)
def get_risk_summary():
    rng = np.random.default_rng(7)
    n = 1284  # 변동금리 대출자 총원 (데모용 고정값)

    # 리스크 등급 분포 합성 (정규분포 형태로 5단계에 배분)
    risk_scores = rng.normal(3, 1, n).clip(1, 5).round().astype(int)
    distribution = [
        RiskDistributionItem(level=LEVEL_LABELS[i - 1], count=int(np.sum(risk_scores == i)))
        for i in range(1, 6)
    ]

    high_risk_mask = risk_scores <= 2  # 안정형/안정추구형 = 금리 민감도가 높은 그룹으로 간주
    high_risk_count = int(np.sum(high_risk_mask))

    loan_amounts = rng.normal(220_000_000, 60_000_000, n).clip(50_000_000, None)
    payment_increase = loan_amounts * 0.01 / 12  # 금리 +1%p 시 월 상환부담 증가 근사치
    stress_exceed_count = int(np.sum((payment_increase > 150_000) & high_risk_mask))

    # 위험군 고객 리스트 상위 10명만 (익명 ID)
    at_risk_idx = np.argsort(-payment_increase * high_risk_mask)[:10]
    at_risk_customers = [
        AtRiskCustomer(
            id=f"KB-{2000 + i}",
            risk_score=int(risk_scores[i]),
            loan_amount=round(float(loan_amounts[i]), -4),
            rate_type="변동",
            payment_increase=round(float(payment_increase[i]), -4),
        )
        for i in at_risk_idx
    ]

    return RiskSummaryResponse(
        total_variable_rate_borrowers=n,
        high_risk_count=high_risk_count,
        high_risk_pct=round(high_risk_count / n * 100, 1),
        stress_exceed_count=stress_exceed_count,
        risk_distribution=distribution,
        at_risk_customers=at_risk_customers,
    )