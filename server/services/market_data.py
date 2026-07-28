"""
ECOS(한국은행) 금리 데이터 + 네이버 뉴스 검색 결과를 가져오는 서비스.
매번 외부 API를 호출하면 느리고 쿼터 소진 위험이 있어, 인메모리 캐시로
하루 1회만 갱신한다 (스펙 6번 섹션 명시된 정책).
"""

import os
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

ECOS_API_KEY = os.getenv("ECOS_API_KEY")
NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID")
NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET")

_cache = {
    "rates": None,
    "rates_updated_at": None,
    "news": None,
    "news_updated_at": None,
}

CACHE_TTL = timedelta(hours=24)


def _is_cache_valid(key: str) -> bool:
    updated_at = _cache.get(f"{key}_updated_at")
    if updated_at is None:
        return False
    return datetime.now() - updated_at < CACHE_TTL


def fetch_rate_history(months: int = 24) -> list[float]:
    """
    ECOS에서 한국은행 기준금리 최근 N개월 시계열을 가져온다.
    통계표코드 722Y001(한국은행 기준금리 및 여수신금리), 항목코드 0101000(기준금리)
    """
    if _is_cache_valid("rates"):
        return _cache["rates"]

    end = datetime.now().strftime("%Y%m")
    start = (datetime.now() - timedelta(days=months * 31)).strftime("%Y%m")

    url = (
        f"https://ecos.bok.or.kr/api/StatisticSearch/{ECOS_API_KEY}/json/kr/"
        f"1/{months}/722Y001/M/{start}/{end}/0101000"
    )

    try:
        res = requests.get(url, timeout=10)
        data = res.json()
        rows = data["StatisticSearch"]["row"]
        rates = [float(row["DATA_VALUE"]) for row in rows]
    except (KeyError, requests.RequestException) as e:
        print(f"[ECOS 호출 실패, 더미 데이터로 대체] {e}")
        rates = [3.5] * months

    _cache["rates"] = rates
    _cache["rates_updated_at"] = datetime.now()
    return rates


def fetch_news_headlines(query: str = "기준금리", display: int = 30) -> list[str]:
    """네이버 뉴스 검색으로 최근 헤드라인 텍스트 목록을 가져온다."""
    if _is_cache_valid("news"):
        return _cache["news"]

    url = "https://openapi.naver.com/v1/search/news.json"
    headers = {
        "X-Naver-Client-Id": NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
    }
    params = {"query": query, "display": display, "sort": "date"}

    try:
        res = requests.get(url, headers=headers, params=params, timeout=10)
        data = res.json()
        # 제목에서 HTML 태그(<b>, </b> 등) 제거
        import re
        headlines = [re.sub(r"<[^>]+>", "", item["title"]) for item in data["items"]]
    except (KeyError, requests.RequestException) as e:
        print(f"[네이버뉴스 호출 실패, 더미 데이터로 대체] {e}")
        headlines = ["금리 관련 뉴스를 불러오지 못했습니다."] * display

    _cache["news"] = headlines
    _cache["news_updated_at"] = datetime.now()
    return headlines