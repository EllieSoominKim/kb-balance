"""
자기응답(설문) 리스크 등급을 재무 데이터(DTI, 고정지출비율, 순자산)로 보정
스펙 3.2절 카드0 로직
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class RiskCalibrationResult:
    self_reported: int
    calibrated: int
    adjusted: bool
    reason: Optional[str]


def calibrate_risk(
    self_reported_grade: int,
    monthly_income: float,
    monthly_fixed_expense: float,
    monthly_loan_payment: float = 0,
    net_asset: float = 0,
) -> RiskCalibrationResult:
    """
    self_reported_grade: 1~5 (안전형~공격형)
    net_asset: 자산 - 부채. 마이너스면 상향 조정을 막고, 다른 하향 조건과 함께
               (또는 단독으로) 등급을 낮추는 근거로 삼는다.
    """
    fixed_expense_ratio = monthly_fixed_expense / monthly_income if monthly_income > 0 else 0
    dti = monthly_loan_payment / monthly_income if monthly_income > 0 else 0

    reasons = []
    should_downgrade = False

    if fixed_expense_ratio >= 0.6:
        should_downgrade = True
        reasons.append(f"월 고정지출이 소득의 {fixed_expense_ratio*100:.0f}%로 평균보다 높아요")
    if dti >= 0.4:
        should_downgrade = True
        reasons.append(f"총부채상환비율(DTI)이 {dti*100:.0f}%로 높아요")
    if net_asset < 0:
        should_downgrade = True
        reasons.append("현재 순자산이 마이너스 상태예요")

    if should_downgrade:
        calibrated = max(1, self_reported_grade - 1)
        reason = (
            " · ".join(reasons)
            + ". 실제 감당 가능한 손실 여력을 반영해 한 단계 보수적으로 조정했어요."
        )
    elif fixed_expense_ratio <= 0.3 and dti <= 0.15 and net_asset > 0:
        calibrated = min(5, self_reported_grade + 1)
        reason = (
            f"고정지출 비율이 {fixed_expense_ratio*100:.0f}%로 낮고 순자산 여력도 충분해, "
            f"한 단계 상향 조정할 수 있어요."
        )
    else:
        calibrated = self_reported_grade
        reason = None

    return RiskCalibrationResult(
        self_reported=self_reported_grade,
        calibrated=calibrated,
        adjusted=(calibrated != self_reported_grade),
        reason=reason,
    )