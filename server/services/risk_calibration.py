"""
자기응답(설문) 리스크 등급을 재무 데이터(DTI, 고정지출비율)로 보정
스펙 3.2절 카드0 로직
"""

from dataclasses import dataclass


@dataclass
class RiskCalibrationResult:
    self_reported: int
    calibrated: int
    adjusted: bool
    reason: str | None


def calibrate_risk(
    self_reported_grade: int,
    monthly_income: float,
    monthly_fixed_expense: float,
    monthly_loan_payment: float = 0,
) -> RiskCalibrationResult:
    """
    self_reported_grade: 1~5 (안전형~공격형)
    """
    fixed_expense_ratio = monthly_fixed_expense / monthly_income if monthly_income > 0 else 0
    dti = monthly_loan_payment / monthly_income if monthly_income > 0 else 0

    if fixed_expense_ratio >= 0.6 or dti >= 0.4:
        calibrated = max(1, self_reported_grade - 1)
        reason = (
            f"월 고정지출이 소득의 {fixed_expense_ratio*100:.0f}%로 평균보다 높아, "
            f"실제 감당 가능한 손실 여력을 반영해 한 단계 조정했어요."
        )
    elif fixed_expense_ratio <= 0.3 and dti <= 0.15:
        calibrated = min(5, self_reported_grade + 1)
        reason = (
            f"고정지출 비율이 {fixed_expense_ratio*100:.0f}%로 낮고 여유 자금이 충분해, "
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