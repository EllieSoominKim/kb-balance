"""
GARCH-X 금리 변동성 예측 모델
- 기준: 국고채/기준금리 시계열
- 외생변수(X): 뉴스 감성 점수, 뉴스 볼륨 (FinBERT 파이프라인 출력) 
"""

import numpy as np
import pandas as pd
from arch import arch_model


class GarchXModel:
    def __init__(self, p: int = 1, q: int = 1):
        self.p = p
        self.q = q
        self.fitted_model = None
        self.rate_series = None

    def fit(self, rate_series: pd.Series, exog: pd.DataFrame = None):
        """
        rate_series: 금리(또는 금리 변화율) 시계열, index는 날짜
        exog: 외생변수 DataFrame (예: news_sentiment, news_volume), rate_series와 같은 index
        """
        self.rate_series = rate_series
        returns = rate_series.diff().dropna() * 100  # 변화율 스케일링 (arch 라이브러리 안정성용)

        model = arch_model(
            returns,
            x=exog.loc[returns.index] if exog is not None else None,
            vol="Garch",
            p=self.p,
            q=self.q,
            dist="normal",
        )
        self.fitted_model = model.fit(disp="off")
        return self

    def predict_volatility(self, horizon: int = 3):
        """향후 horizon 기간(예: 개월)의 변동성 예측치를 반환"""
        if self.fitted_model is None:
            raise RuntimeError("먼저 fit()을 호출하세요.")

        forecast = self.fitted_model.forecast(horizon=horizon, reindex=False)
        variance = forecast.variance.values[-1]  # 마지막 시점 기준 horizon개 분산 예측
        volatility = np.sqrt(variance) / 100  # 원래 스케일로 복원
        return volatility  # numpy array, shape (horizon,)

    def predict_hike_probability(self, threshold_bp: float = 25, horizon: int = 3, n_sims: int = 5000):
        """
        몬테카를로 시뮬레이션으로 'horizon 기간 내 threshold_bp(bp) 이상 금리 인상' 확률 추정
        threshold_bp: 25bp = 0.25%p
        """
        if self.fitted_model is None:
            raise RuntimeError("먼저 fit()을 호출하세요.")

        sim = self.fitted_model.forecast(
            horizon=horizon, method="simulation", simulations=n_sims, reindex=False
        )
        # sim.simulations.values shape: (1, n_sims, horizon) — 변화율(%) 누적합으로 총 변화 계산
        paths = sim.simulations.values[-1] / 100  # 원 스케일 복원
        cumulative_change = paths.sum(axis=1)  # 각 시뮬레이션 경로의 horizon 누적 변화

        threshold = threshold_bp / 100  # bp -> %p
        prob = float(np.mean(cumulative_change >= threshold))
        return round(prob, 4)


def build_exog_from_news(news_df: pd.DataFrame) -> pd.DataFrame:
    """
    news_df: columns=['date', 'sentiment_score', 'volume']
    FinBERT 파이프라인(services/news_sentiment.py) 출력을 GARCH-X 입력 형태로 변환
    """
    exog = news_df.set_index("date")[["sentiment_score", "volume"]]
    exog.columns = ["news_sentiment", "news_volume"]
    return exog