"""
POST /api/profile
재무 프로필 저장 + 리스크 스코어 계산(보정 로직 포함)
"""

from fastapi import APIRouter, Depends
from sqlmodel import Session
from pydantic import BaseModel
from typing import Optional
import sys, os

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "services"))
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "db"))
from risk_calibration import calibrate_risk
from database import get_session
from models_db import UserProfile

router = APIRouter()


class ProfileRequest(BaseModel):
    persona_id: str
    monthly_income: float
    monthly_fixed_expense: float
    deposit: float
    investment: float
    loan_amount: float = 0
    loan_rate: Optional[float] = None
    loan_type: Optional[str] = None
    self_reported_risk: int
    goal: str
    goal_horizon_years: Optional[int] = None
    rebalance_frequency: Optional[str] = None


class ProfileResponse(BaseModel):
    profile_id: int
    self_reported_risk: int
    calibrated_risk: int
    adjusted: bool
    calibration_reason: Optional[str]


@router.post("/", response_model=ProfileResponse)
def create_profile(req: ProfileRequest, session: Session = Depends(get_session)):
    monthly_loan_payment = 0
    if req.loan_amount > 0 and req.loan_rate:
        # 단순화된 월 상환액 추정 (원리금균등 근사 대신 이자만 반영한 러프 추정)
        monthly_loan_payment = req.loan_amount * (req.loan_rate / 12)

    result = calibrate_risk(
        self_reported_grade=req.self_reported_risk,
        monthly_income=req.monthly_income,
        monthly_fixed_expense=req.monthly_fixed_expense,
        monthly_loan_payment=monthly_loan_payment,
    )

    profile = UserProfile(
        persona_id=req.persona_id,
        monthly_income=req.monthly_income,
        monthly_fixed_expense=req.monthly_fixed_expense,
        deposit=req.deposit,
        investment=req.investment,
        loan_amount=req.loan_amount,
        loan_rate=req.loan_rate,
        loan_type=req.loan_type,
        self_reported_risk=result.self_reported,
        calibrated_risk=result.calibrated,
        goal=req.goal,
        goal_horizon_years=req.goal_horizon_years,
        rebalance_frequency=req.rebalance_frequency,
    )
    session.add(profile)
    session.commit()
    session.refresh(profile)

    return ProfileResponse(
        profile_id=profile.id,
        self_reported_risk=result.self_reported,
        calibrated_risk=result.calibrated,
        adjusted=result.adjusted,
        calibration_reason=result.reason,
    )