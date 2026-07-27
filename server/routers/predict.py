"""
POST /api/predict/garch
GARCH-X 금리 변동성/인상확률 예측 엔드포인트
"""

from fastapi import APIRouter
from pydantic import BaseModel
import numpy as np
import pandas as pd
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "models"))
from garch_x_model import GarchXModel, build_exog_from_news

router = APIRouter()


class GarchPredictRequest(BaseModel):
    rate_history: list[float]       # 최근 금리 시계열 (오래된 순)
    news_sentiment: list[float]     # 같은 기간 뉴스 감성점수
    news_volume: list[float]        # 같은 기간 뉴스 볼륨
    horizon: int = 3                # 예측 기간(개월)
    threshold_bp: float = 25        # 인상 확률 판단 임계값(bp)


class GarchPredictResponse(BaseModel):
    hike_probability: float
    next_month_volatility: float


@router.post("/", response_model=GarchPredictResponse)
def predict_garch(req: GarchPredictRequest):
    n = len(req.rate_history)
    dates = pd.date_range(end=pd.Timestamp.today(), periods=n, freq="MS")

    rate = pd.Series(req.rate_history, index=dates)
    news = pd.DataFrame({
        "date": dates,
        "sentiment_score": req.news_sentiment,
        "volume": req.news_volume,
    })
    exog = build_exog_from_news(news)

    garch = GarchXModel().fit(rate, exog)
    hike_prob = garch.predict_hike_probability(
        threshold_bp=req.threshold_bp, horizon=req.horizon
    )
    volatility = garch.predict_volatility(horizon=1)[0]

    return GarchPredictResponse(
        hike_probability=hike_prob,
        next_month_volatility=round(float(volatility), 4),
    )