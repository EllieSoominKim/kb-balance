"""SQLModel 테이블 정의"""

from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class UserProfile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    persona_id: str
    monthly_income: float
    monthly_fixed_expense: float
    deposit: float
    investment: float
    loan_amount: float = 0
    loan_rate: Optional[float] = None
    loan_type: Optional[str] = None  # "고정" / "변동"
    self_reported_risk: int
    calibrated_risk: int
    goal: str
    goal_horizon_years: Optional[int] = None
    rebalance_frequency: Optional[str] = None  # 여유자금 목표용

class AllocationSnapshot(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    persona_id: str
    repayment_pct: float
    savings_pct: float
    investment_pct: float
    created_at: datetime = Field(default_factory=datetime.utcnow)