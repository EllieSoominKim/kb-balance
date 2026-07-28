"""
POST /api/history       배분 계산 결과를 스냅샷으로 저장
GET  /api/history/{persona_id}   해당 페르소나의 저장된 이력 조회 (실제 DB 기록)
"""

from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from pydantic import BaseModel
import sys, os

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "db"))
from database import get_session
from models_db import AllocationSnapshot

router = APIRouter()


class SnapshotRequest(BaseModel):
    persona_id: str
    repayment_pct: float
    savings_pct: float
    investment_pct: float


class SnapshotItem(BaseModel):
    date: str
    repayment_pct: float
    savings_pct: float
    investment_pct: float


@router.post("/")
def save_snapshot(req: SnapshotRequest, session: Session = Depends(get_session)):
    snap = AllocationSnapshot(
        persona_id=req.persona_id,
        repayment_pct=req.repayment_pct,
        savings_pct=req.savings_pct,
        investment_pct=req.investment_pct,
    )
    session.add(snap)
    session.commit()
    return {"saved": True}


@router.get("/{persona_id}", response_model=list[SnapshotItem])
def get_history(persona_id: str, session: Session = Depends(get_session)):
    rows = session.exec(
        select(AllocationSnapshot)
        .where(AllocationSnapshot.persona_id == persona_id)
        .order_by(AllocationSnapshot.created_at)
    ).all()
    return [
        SnapshotItem(
            date=row.created_at.strftime("%Y.%m.%d %H:%M"),
            repayment_pct=row.repayment_pct,
            savings_pct=row.savings_pct,
            investment_pct=row.investment_pct,
        )
        for row in rows
    ]