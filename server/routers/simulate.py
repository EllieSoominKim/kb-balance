"""
POST /api/simulate/stress
금리 상승 시나리오에 따른 월 상환부담·순자산 스트레스 테스트 (몬테카를로)
"""

from fastapi import APIRouter
from pydantic import BaseModel
import numpy as np

router = APIRouter()


class StressTestRequest(BaseModel):
    loan_amount: float
    loan_rate: float          # 현재 연 금리 (예: 0.042)
    loan_years_left: int      # 잔여 대출기간(년)
    rate_shock_pp: float      # 금리 상승 시나리오 (%p, 예: 1.0 = +1%p)
    current_net_asset: float  # 현재 순자산
    monthly_savings: float    # 월 저축·투자 여력
    months: int = 24          # 시뮬레이션 기간
    n_sims: int = 1000


class StressTestResponse(BaseModel):
    current_monthly_payment: float
    stressed_monthly_payment: float
    monthly_payment_delta: float
    net_asset_after_months_base: float
    net_asset_after_months_stressed: float
    net_asset_delta: float
    simulation_paths: list[list[float]]  # 시각화용 순자산 경로 샘플 (n_sims 중 일부만)


def monthly_payment(principal: float, annual_rate: float, years: int) -> float:
    """원리금균등상환 월 납입액 계산"""
    if principal <= 0 or years <= 0:
        return 0.0
    r = annual_rate / 12
    n = years * 12
    if r == 0:
        return principal / n
    return principal * r * (1 + r) ** n / ((1 + r) ** n - 1)


@router.post("/", response_model=StressTestResponse)
def simulate_stress(req: StressTestRequest):
    current_payment = monthly_payment(req.loan_amount, req.loan_rate, req.loan_years_left)
    stressed_rate = req.loan_rate + req.rate_shock_pp / 100
    stressed_payment = monthly_payment(req.loan_amount, stressed_rate, req.loan_years_left)

    # 몬테카를로: 매월 저축여력에 소폭 변동성(불확실성)을 부여해 경로 시뮬레이션
    rng = np.random.default_rng(42)
    monthly_vol = abs(req.monthly_savings) * 0.15 if req.monthly_savings != 0 else 10000

    def simulate(extra_monthly_cost: float, n_sims: int) -> np.ndarray:
        shocks = rng.normal(0, monthly_vol, size=(n_sims, req.months))
        monthly_deltas = (req.monthly_savings - extra_monthly_cost) + shocks
        cumulative = np.cumsum(monthly_deltas, axis=1)
        return req.current_net_asset + cumulative

    base_paths = simulate(0, req.n_sims)
    stressed_paths = simulate(stressed_payment - current_payment, req.n_sims)

    net_asset_base = float(np.mean(base_paths[:, -1]))
    net_asset_stressed = float(np.mean(stressed_paths[:, -1]))

    # 시각화용으로 스트레스 시나리오 경로 몇 개만 샘플링 (평균 경로 1개 + 신뢰구간용 상하단)
    mean_path = stressed_paths.mean(axis=0)
    upper_path = np.percentile(stressed_paths, 75, axis=0)
    lower_path = np.percentile(stressed_paths, 25, axis=0)
    base_mean_path = base_paths.mean(axis=0)

    return StressTestResponse(
        current_monthly_payment=round(current_payment, 0),
        stressed_monthly_payment=round(stressed_payment, 0),
        monthly_payment_delta=round(stressed_payment - current_payment, 0),
        net_asset_after_months_base=round(net_asset_base, 0),
        net_asset_after_months_stressed=round(net_asset_stressed, 0),
        net_asset_delta=round(net_asset_stressed - net_asset_base, 0),
        simulation_paths=[
            base_mean_path.round(0).tolist(),
            mean_path.round(0).tolist(),
            upper_path.round(0).tolist(),
            lower_path.round(0).tolist(),
        ],
    )