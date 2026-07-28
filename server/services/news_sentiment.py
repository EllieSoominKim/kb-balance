"""
뉴스 헤드라인 리스트를 감성 점수(-1~1)와 볼륨으로 변환.
지금은 키워드 기반 경량 스코어링. 추후 FinBERT로 교체 가능하도록
반환 형태(리스트[float])는 GARCH-X 입력 규격과 동일하게 유지.
"""

POSITIVE_WORDS = ["안정", "하락", "완화", "인하", "호조", "개선", "긍정"]
NEGATIVE_WORDS = ["상승", "인상", "우려", "부담", "긴축", "불안", "급등"]


def score_headline(text: str) -> float:
    pos = sum(1 for w in POSITIVE_WORDS if w in text)
    neg = sum(1 for w in NEGATIVE_WORDS if w in text)
    if pos == 0 and neg == 0:
        return 0.0
    return round((pos - neg) / (pos + neg), 3)


def score_headlines(headlines: list[str]) -> list[float]:
    return [score_headline(h) for h in headlines]


def score_volume(headlines: list[str], months: int) -> list[float]:
    """월별 뉴스 볼륨(단순화: 전체 개수를 기간에 균등 분배)"""
    avg = len(headlines) / months if months > 0 else 0
    return [avg] * months