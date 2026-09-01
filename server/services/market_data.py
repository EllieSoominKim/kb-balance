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
    "market_rate": None,
    "market_rate_updated_at": None,
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
    [DEPRECATED / SUPERSEDED] 월별 기준금리(722Y001) 기반 fetch — regime-rader의
    daily-frequency GARCH-X 어댑테이션 이후로는 fetch_market_rate_history()를
    사용한다. 기준금리는 BOK 통화정책회의 시점에만 계단식으로 바뀌는 정책금리라
    일별 변동성 추정에는 부적합(대부분의 날이 무변동 → 분산 추정 왜곡)하다고
    판단되어 대체됨. 비교/참고용으로 코드는 남겨두되 새 경로에서는 호출하지 않음.

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


def fetch_market_rate_history(days: int = 500) -> list[float]:
    """
    ECOS 시장금리(일별) 테이블에서 국고채(3년) 최근 N영업일 시계열을 가져온다.
    통계표코드 817Y002(1.3.2.1. 시장금리(일별)), 항목코드 010200000(국고채 3년),
    주기 D(일별). 1998-11-13부터 데이터 존재 (27년+ 히스토리).

    regime-rader 설계문서의 daily-frequency GARCH-X 어댑테이션용으로 신설
    (기존 fetch_rate_history()의 24개월 룩백을 ~500 거래일로 재파라미터화한 것에
    대응). fetch_rate_history()가 pull하던 722Y001/0101000(기준금리)은 정책금리
    계단함수라 일별 변동성 추정에 부적합 — 시장에서 매일 호가되는 국고채(3년)
    수익률로 데이터 소스 자체를 교체함.

    [2026-08 페이징 버그 수정] ECOS의 `{요청시작건수}/{요청종료건수}` 파라미터는
    쿼리된 날짜범위([start,end]) 내에서 TIME 오름차순(과거→최근)으로 매겨진
    1-indexed 행 번호 범위다. 이전 구현은 항상 `1/{days}`로 요청했는데, 이는
    날짜범위 내 "가장 오래된 {days}건"이지 "가장 최근 {days}건"이 아니었다.
    버퍼 캘린더 일수(`days*1.6+30`)가 항상 {days}거래일보다 넓게 잡혀 있어서
    (예: days=500 조회 시 날짜범위 내 실제 거래일이 553건인데 앞쪽 500건만
    반환 → 최근 53거래일 누락), end를 매일 오늘 날짜로 갱신해도 반환되는
    구간이 항상 지금보다 ~수개월 뒤처진 채로 고정되는 문제가 있었다
    (walk-forward 첫 실전 검증에서 발견, regime-rader 세션 기록 참고).
    매일 갱신되어야 하는 라이브 서비스(design doc "국면 확률: 매일 갱신")에서
    치명적이므로, list_total_count를 먼저 조회해 정확히 뒤쪽 {days}건만
    요청하도록 수정.
    """
    if _is_cache_valid("market_rate"):
        return _cache["market_rate"]

    end = datetime.now().strftime("%Y%m%d")
    # 주말/공휴일을 감안해 `days`거래일을 확보할 수 있도록 캘린더 일수를 넉넉히 잡음
    start = (datetime.now() - timedelta(days=int(days * 1.6) + 30)).strftime("%Y%m%d")

    def _url(start_row: int, end_row: int) -> str:
        return (
            f"https://ecos.bok.or.kr/api/StatisticSearch/{ECOS_API_KEY}/json/kr/"
            f"{start_row}/{end_row}/817Y002/D/{start}/{end}/010200000"
        )

    try:
        # Step 1: minimal request purely to read list_total_count for this
        # date range/stat/item -- the number of trading days actually
        # available, independent of the pagination window requested.
        count_res = requests.get(_url(1, 1), timeout=10)
        count_res.raise_for_status()
        total_count = int(count_res.json()["StatisticSearch"]["list_total_count"])

        # Step 2: request exactly the most recent `days` rows (fewer if the
        # date range doesn't contain that many trading days yet).
        n = min(days, total_count)
        start_row = total_count - n + 1
        data_res = requests.get(_url(start_row, total_count), timeout=10)
        data_res.raise_for_status()
        rows = data_res.json()["StatisticSearch"]["row"]
        rates = [float(row["DATA_VALUE"]) for row in rows]
    except (KeyError, requests.RequestException) as e:
        print(f"[ECOS 호출 실패, 더미 데이터로 대체] {e}")
        rates = [3.0] * days

    _cache["market_rate"] = rates
    _cache["market_rate_updated_at"] = datetime.now()
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