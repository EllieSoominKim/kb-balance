"""
자산-부채 통합 HRP (Hierarchical Risk Parity)
알고리즘 5단계 (스펙 2.2절):
1. 수익률 매트릭스 구성 (부채=음의 수익률 자산으로 편입)
2. 상관관계 계층 클러스터링
3. 재귀적 리스크 배분
4. 금리 시나리오 보정 (GARCH-X 예측 반영) ★ 독창성 핵심
5. 최종 배분 산출
"""

import numpy as np
import pandas as pd
from scipy.spatial.distance import squareform
from scipy.cluster.hierarchy import linkage, dendrogram


def build_return_matrix(
    asset_returns: pd.DataFrame,
    loan_rate: float = None,
    rate_volatility: float = None,
) -> pd.DataFrame:
    """
    1단계: 자산 수익률 + 대출 상환을 단일 매트릭스로 결합
    loan_rate: 연 대출금리(예: 0.042). 대출이 없으면 None
    rate_volatility: GARCH-X가 예측한 월별 금리 변동성. 변동금리 대출의 상환 효과가
                      금리 변동에 따라 흔들리는 정도를 반영 (없으면 예금 수준의 기본값 사용)
    """
    matrix = asset_returns.copy()
    if loan_rate is not None:
        n = len(matrix)
        base = -loan_rate / 12
        # rate_volatility가 없으면 예금과 비슷한 스케일의 기본 노이즈 사용 (데모/고정금리 대출용)
        noise_std = rate_volatility if rate_volatility is not None else 0.0015
        noise = np.random.normal(0, noise_std, n)
        matrix["대출상환"] = base + noise
    return matrix


def _correlation_distance(corr: pd.DataFrame) -> pd.DataFrame:
    return np.sqrt(0.5 * (1 - corr))


def cluster_assets(return_matrix: pd.DataFrame):
    """2단계: 상관관계 계층 클러스터링"""
    corr = return_matrix.corr()
    dist = _correlation_distance(corr)
    condensed = squareform(dist.values, checks=False)  # 정사각형 -> 압축형 변환
    link = linkage(condensed, method="single")
    return corr, link


def _get_quasi_diag(link) -> list:
    """linkage 결과를 트리 순서(quasi-diagonal order)로 정렬"""
    link = link.astype(int)
    sort_ix = pd.Series([link[-1, 0], link[-1, 1]])
    num_items = link[-1, 3]
    while sort_ix.max() >= num_items:
        sort_ix.index = range(0, sort_ix.shape[0] * 2, 2)
        df0 = sort_ix[sort_ix >= num_items]
        i = df0.index
        j = df0.values - num_items
        sort_ix[i] = link[j, 0]
        df1 = pd.Series(link[j, 1], index=i + 1)
        sort_ix = pd.concat([sort_ix, df1])
        sort_ix = sort_ix.sort_index()
        sort_ix.index = range(sort_ix.shape[0])
    return sort_ix.tolist()


def _get_cluster_var(cov: pd.DataFrame, items: list) -> float:
    sub_cov = cov.loc[items, items]
    weights = 1 / np.diag(sub_cov)
    weights /= weights.sum()
    return float(weights @ sub_cov.values @ weights)


def recursive_bisection(cov: pd.DataFrame, sort_ix: list) -> pd.Series:
    """3단계: 재귀적 리스크 배분 (분산 역가중)"""
    weights = pd.Series(1.0, index=sort_ix)
    clusters = [sort_ix]

    while len(clusters) > 0:
        clusters = [
            c[start:end]
            for c in clusters
            for start, end in ((0, len(c) // 2), (len(c) // 2, len(c)))
            if len(c) > 1
        ]
        for i in range(0, len(clusters), 2):
            if i + 1 >= len(clusters):
                continue
            left, right = clusters[i], clusters[i + 1]
            var_left = _get_cluster_var(cov, left)
            var_right = _get_cluster_var(cov, right)
            alpha = 1 - var_left / (var_left + var_right)
            weights[left] *= alpha
            weights[right] *= 1 - alpha

    return weights / weights.sum()


def adjust_for_rate_scenario(
    weights: pd.Series,
    hike_probability: float,
    loan_key: str = "대출상환",
    sensitivity: float = 0.5,
) -> pd.Series:
    """
    4단계 ★ 독창성 핵심: GARCH-X의 금리 인상 확률로 가중치 보정
    hike_probability가 높을수록 상환(loan_key) 비중을 끌어올림
    """
    if loan_key not in weights.index:
        return weights  # 대출이 없는 페르소나는 보정 스킵

    adjusted = weights.copy()
    boost = hike_probability * sensitivity
    adjusted[loan_key] += boost

    # 나머지 자산에서 비례 차감 후 정규화
    others = adjusted.index.difference([loan_key])
    if adjusted[others].sum() > 0:
        scale = (1 - adjusted[loan_key]) / adjusted[others].sum()
        adjusted[others] *= scale

    adjusted = adjusted.clip(lower=0)
    return adjusted / adjusted.sum()


def apply_allocation_bounds(
    weights: dict,
    min_weight: float = 0.05,
    max_weight: float = 0.7,
) -> dict:
    """
    각 자산군에 최소/최대 비중 캡을 적용해 극단적 쏠림을 방지.
    HRP는 수학적으로 저분산 자산에 쏠리기 쉬운데, 실사용자 화면에서는
    한 자산군이 0%나 100%에 가깝게 나오면 부자연스럽고 서비스 신뢰도를 해치므로
    실무적 제약조건(상하한선)을 둔다.
    """
    adjusted = {k: max(min(v, max_weight), min_weight) for k, v in weights.items()}
    total = sum(adjusted.values())
    return {k: round(v / total, 4) for k, v in adjusted.items()}


def run_hrp(
    asset_returns: pd.DataFrame,
    loan_rate: float = None,
    hike_probability: float = 0.0,
    rate_volatility: float = None,
) -> dict:
    """5단계 전체 파이프라인 실행, 최종 배분(dict) 반환"""
    return_matrix = build_return_matrix(asset_returns, loan_rate, rate_volatility)
    corr, link = cluster_assets(return_matrix)
    sort_ix = _get_quasi_diag(link)
    sorted_labels = corr.index[sort_ix].tolist()

    cov = return_matrix.cov()
    raw_weights = recursive_bisection(cov, sorted_labels)
    final_weights = adjust_for_rate_scenario(raw_weights, hike_probability)

    final_weights_dict = final_weights.round(4).to_dict()
    return apply_allocation_bounds(final_weights_dict)