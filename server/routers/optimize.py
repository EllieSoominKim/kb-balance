"""
POST /api/optimize/hrp
자산-부채 통합 HRP 배분 계산 엔드포인트
"""

from fastapi import APIRouter
from pydantic import BaseModel
import pandas as pd
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "models"))
from hrp_model import run_hrp

router = APIRouter()


class HrpOptimizeRequest(BaseModel):
    deposit_returns: list[float]       # 예금 수익률 시계열
    investment_returns: list[float]    # 투자자산 수익률 시계열
    loan_rate: float | None = None     # 연 대출금리, 대출 없으면 None
    hike_probability: float = 0.0      # GARCH-X 예측 인상확률
    rate_volatility: float | None = None  # GARCH-X 예측 변동성(%p)


class HrpOptimizeResponse(BaseModel):
    allocation: dict[str, float]
    loan_investment_correlation: float | None = None


@router.post("/", response_model=HrpOptimizeResponse)
def optimize_hrp(req: HrpOptimizeRequest):
    asset_returns = pd.DataFrame({
        "예금": req.deposit_returns,
        "투자자산": req.investment_returns,
    })

    rate_vol_scaled = (
        req.rate_volatility / 100 if req.rate_volatility is not None else None
    )

    result = run_hrp(
        asset_returns,
        loan_rate=req.loan_rate,
        hike_probability=req.hike_probability,
        rate_volatility=rate_vol_scaled,
    )

    return HrpOptimizeResponse(
        allocation=result["weights"],
        loan_investment_correlation=result["loan_investment_correlation"],
    )