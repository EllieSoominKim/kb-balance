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
    rate_volatility: GARCH-X가 예측한 월별 금리 변동성.
    """
    matrix = asset_returns.copy()
    if loan_rate is not None:
        n = len(matrix)
        base = -loan_rate / 12
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
    condensed = squareform(dist.values, checks=False)
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
    """
    if loan_key not in weights.index:
        return weights

    adjusted = weights.copy()
    boost = hike_probability * sensitivity
    adjusted[loan_key] += boost

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
    각 자산군에 최소/최대 비중 캡을 적용. 단순 clip+재정규화는 한 자산이 캡에
    걸려도 나머지 비중이 그대로 남아 여전히 쏠릴 수 있으므로, 캡 초과분을
    다른 자산에 반복적으로(iterative water-filling) 재분배한다.
    """
    keys = list(weights.keys())
    vals = dict(weights)
    fixed: dict = {}
    free = set(keys)

    for _ in range(len(keys)):
        remaining = 1 - sum(fixed.values())
        free_keys = list(free)
        if not free_keys:
            break

        free_sum = sum(vals[k] for k in free_keys)
        if free_sum == 0:
            for k in free_keys:
                vals[k] = remaining / len(free_keys)
        else:
            for k in free_keys:
                vals[k] = vals[k] / free_sum * remaining

        violated = False
        for k in list(free):
            if vals[k] > max_weight:
                vals[k] = max_weight
                fixed[k] = max_weight
                free.remove(k)
                violated = True
            elif vals[k] < min_weight:
                vals[k] = min_weight
                fixed[k] = min_weight
                free.remove(k)
                violated = True

        if not violated:
            break

    result = {**fixed, **{k: vals[k] for k in free}}
    return {k: round(result[k], 4) for k in keys}


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