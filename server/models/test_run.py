import numpy as np
import pandas as pd
from garch_x_model import GarchXModel, build_exog_from_news
from hrp_model import run_hrp

np.random.seed(42)  # 재현 가능한 결과를 위해 고정

# 월별 금리 시계열 (더미)
dates = pd.date_range("2015-01-01", periods=120, freq="MS")  # 10년치 월별
rate = pd.Series(3.5 + np.cumsum(np.random.normal(0, 0.05, 120)), index=dates)

news = pd.DataFrame({
    "date": dates,
    "sentiment_score": np.random.normal(0, 1, 120),
    "volume": np.random.poisson(5, 120),
})
exog = build_exog_from_news(news)

garch = GarchXModel().fit(rate, exog)
hike_prob = garch.predict_hike_probability(threshold_bp=25, horizon=3)
print("금리 인상(0.25%p 이상) 확률:", hike_prob)

monthly_volatility = garch.predict_volatility(horizon=1)[0]
print("다음 달 예측 금리 변동성(%p):", round(monthly_volatility, 4))

# 자산 수익률도 동일하게 월별 120개로 맞춤
asset_returns = pd.DataFrame({
    "예금": np.random.normal(0.002, 0.001, 120),
    "투자자산": np.random.normal(0.005, 0.03, 120),
}, index=dates)

weights = run_hrp(
    asset_returns,
    loan_rate=0.042,
    hike_probability=hike_prob,
    rate_volatility=monthly_volatility / 100,  # %p 단위를 수익률 스케일(소수)로 환산
)
print("최종 배분:", weights)