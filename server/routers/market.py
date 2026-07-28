"""
GET /api/market/rates   ECOS 금리 시계열
GET /api/market/news    네이버 뉴스 감성 요약
"""

from fastapi import APIRouter
from pydantic import BaseModel
import sys, os

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "services"))
from market_data import fetch_rate_history, fetch_news_headlines
from news_sentiment import score_headlines, score_volume

router = APIRouter()


class RatesResponse(BaseModel):
    rate_history: list[float]


@router.get("/rates", response_model=RatesResponse)
def get_rates(months: int = 24):
    rates = fetch_rate_history(months=months)
    return RatesResponse(rate_history=rates)


class NewsResponse(BaseModel):
    news_sentiment: list[float]
    news_volume: list[float]
    headlines_sample: list[str]


@router.get("/news", response_model=NewsResponse)
def get_news(months: int = 24, query: str = "기준금리"):
    headlines = fetch_news_headlines(query=query, display=30)
    sentiment = score_headlines(headlines)
    avg_sentiment = sum(sentiment) / len(sentiment) if sentiment else 0.0
    monthly_sentiment = [avg_sentiment] * months
    monthly_volume = score_volume(headlines, months)

    return NewsResponse(
        news_sentiment=monthly_sentiment,
        news_volume=monthly_volume,
        headlines_sample=headlines[:5],
    )