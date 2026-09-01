# KB 밸런스 — 자산·부채 통합 AI 금융 라이프 에이전트

> **제8회 KB국민은행 Future Finance AI Challenge** 출품작  
> 현직자 Pick 주제 ⑤ 금융 라이프 에이전트

---

## 📺 데모 영상

[![KB 밸런스 데모 영상](https://img.shields.io/badge/Demo-Google%20Drive-blue?style=for-the-badge&logo=google-drive)](https://drive.google.com/file/d/1_Ma7fOGy3maKAL4xAcU-96eM1XNUeCOI/view?usp=sharing)

> 페르소나 선택 → 금융업권 연결 → 리스크 진단 → 대시보드 → 금리 스트레스 테스트 → 추천 자산배분 → KB 상품 매칭

---

## 소개

**KB 밸런스**는 자산·부채·소득을 하나의 순자산 최적화 문제로 통합하는 AI 기반 금융 라이프 에이전트입니다.

기존 자산관리 앱은 예금·투자만 다루고 부채는 최적화 계산 밖에 둡니다. KB 밸런스는 은행이 쓰는 **자산부채관리(ALM)** 개념을 개인에게 내려, 대출 상환을 "확정 수익률 투자"로 재정의하고 **상환·저축·투자를 동일한 잣대에서 한 번에 최적화**합니다.

```
청년층 변동금리 대출 비중 73%, 가계부채 GDP 대비 88.6% —
"남는 돈을 갚을까, 굴릴까"의 정답을 AI가 계산합니다.
```

---

## 핵심 기술

### 1. GARCH-X 금리 예측 엔진 (`server/models/garch_x_model.py`)

금리는 변동성이 뭉쳐서 나타나는 특성(Volatility Clustering)이 있습니다. GARCH 계열 모델에 **외생변수(X) = 네이버뉴스 감성 점수 + 뉴스 볼륨**을 추가해 시장 심리까지 반영합니다.

- **입력**: 한국은행 ECOS API 국고채(3년) 일별 시계열 (~500 거래일) + 네이버뉴스 API 실시간 감성
- **출력**: 다음 달 변동성 + 3개월 내 0.25%p 금리 인상 확률 (몬테카를로 5,000회)
- **24시간 인메모리 캐시**: 외부 API 쿼터 보호

```python
# GARCH → GARCH-X: 외생변수로 뉴스 감성 주입
model = arch_model(
    returns,
    x=exog.loc[returns.index],   # ← 뉴스 감성·볼륨
    vol="Garch", p=1, q=1,
)
# 몬테카를로 5,000회로 인상 확률 산출
prob = np.mean(cumulative_change >= threshold)
```

> **ECOS 데이터 소스**: 기준금리(722Y001, 정책금리 계단함수)가 아닌 **국고채 3년(817Y002)** 일별 시계열을 사용합니다. 기준금리는 변동성이 없는 날이 대부분이라 GARCH 분산 추정에 부적합하기 때문입니다.

### 2. HRP 자산배분 엔진 (`server/models/hrp_model.py`)

전통적 평균-분산 최적화(Markowitz)의 불안정성을 해결하는 **계층적 리스크 패리티(HRP, López de Prado 2016)**를 5단계 파이프라인으로 구현했습니다.

| 단계 | 설명 |
|---|---|
| 1. 수익률 매트릭스 | 예금·투자 수익률 + **대출 상환 = 음(-)의 수익률 자산**으로 편입 |
| 2. 상관 클러스터링 | `squareform` + `linkage("single")`으로 계층 구조 생성 |
| 3. 재귀적 리스크 배분 | `recursive_bisection()` — 분산 역가중 |
| 4. 금리 시나리오 보정 ★ | GARCH-X 인상확률이 높을수록 상환 비중 동적 상향 |
| 5. 워터필링 상·하한 | min 5% / max 70% — 쏠림 방지 |

```python
# 4단계: GARCH-X 인상확률 → 상환 비중 보정 (독창성 핵심)
boost = hike_probability * sensitivity   # sensitivity=0.5
adjusted["대출상환"] += boost
# 나머지 자산은 비례 축소 후 재정규화
```

### 3. 재무 기반 리스크 보정 (`server/services/risk_calibration.py`)

자기응답 성향을 3개 재무지표로 객관 보정합니다.

| 지표 | 하향 조건 |
|---|---|
| 고정지출비율 (fixed_expense_ratio) | ≥ 60% |
| DTI | ≥ 40% |
| 순자산 | < 0 |

상향 조건: 고정지출비율 ≤ 30% AND DTI ≤ 15% AND 순자산 > 0

> 예: 자기응답 **중립형(3/5)** → 재무 보정 후 **안정추구형(2/5)**

### 4. 실시간 시장 데이터 (`server/services/market_data.py`)

- `fetch_market_rate_history()`: ECOS 817Y002 국고채(3년) 일별 시계열 — 페이징 버그 수정 반영 (최신 N거래일을 정확히 pull)
- `fetch_news_headlines()`: 네이버뉴스 검색 API로 "기준금리" 관련 최신 헤드라인
- **24시간 인메모리 캐시** (`CACHE_TTL = timedelta(hours=24)`)
- API 실패 시 더미 데이터로 폴백

### 5. KB 상품 매칭 (`app/app/allocation.tsx`)

6개 축으로 실제 KB 금융 상품 12종에 자동 매칭, kbthink.com·kbsec.com 공개 URL 연결:

| 축 | 설명 |
|---|---|
| 나이 | 청년(20대~30대 초반) 여부 |
| 목표 | 내집마련·은퇴·목돈 마련 등 |
| 대출종류 | 주택담보 / 신용 |
| 리스크 | 보정된 리스크 등급 (1~5) |
| 상관계수 | 대출·투자 자산 간 상관계수 > 0.3 여부 |
| 투자여력 | 투자자산 ≥ 5천만원 여부 |

---

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                      FRONT-END                          │
│                                                         │
│  고객 앱 (Expo / React Native)                           │
│  expo ~54 · expo-router ~6 · react-native 0.81          │
│  iOS·Android 실기기 작동 확인 ✅                          │
│                                                         │
│  은행 관제 웹 (Next.js 16 + Recharts)                    │
│  리스크 등급 분포 차트 · 위험군 고객 리스트                  │
│  합성 데이터 1,284명 기반 ✅                              │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                      BACK-END                           │
│           FastAPI + Python 3.10                         │
│                                                         │
│  GARCH-X 금리예측 (arch 8.0) ✅                          │
│  HRP 자산배분 (numpy / scipy) ✅                          │
│  리스크 보정 룰 ✅                                        │
│  KB 상품 매칭 12종 ✅                                    │
│  배분 이력 DB (SQLite / SQLModel 0.0.39) ✅               │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                    DATA / API                           │
│                                                         │
│  한국은행 ECOS API (817Y002 국고채 3년 일별) ✅            │
│  네이버뉴스 검색 API ✅                                   │
│  (실서비스) 마이데이터 표준 API — 유일한 추가 연동           │
└─────────────────────────────────────────────────────────┘
```

---

## 5단계 AI 파이프라인

```
① 자동 조회 ─────── 마이데이터로 자산·부채·소득 수집
        │ 프로필
        ▼
② 리스크 진단 ────── 자기응답 + 재무지표 → 보정된 리스크 등급
        │ 리스크 등급          ③ 금리 예측 ── ECOS + 뉴스 → 인상확률(%)
        └──────────────────────────────────┘
                        ↓ 리스크 등급 + 인상확률
④ 최적 배분 ─────── HRP → 상환·저축·투자 비율(%)
                        ↓ 배분 비율
⑤ 상품 실행 ─────── KB 상품 12종 매칭 + kbthink.com 바로가기
```

② ③은 **병렬** 실행 후 ④에서 합류합니다.

---

## 프로젝트 구조

```
kb-balance/
├── app/                          # Expo (React Native) 고객 앱
│   ├── app/
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # 화면1: 인트로
│   │   ├── persona-select.tsx    # 화면2: 페르소나 선택 (데모)
│   │   ├── connect.tsx           # 화면3: 금융업권 연결
│   │   ├── loading.tsx           # 화면4: 조회 애니메이션
│   │   ├── summary.tsx           # 화면5: 계좌연결 완료
│   │   ├── result-check.tsx
│   │   ├── dashboard.tsx         # 화면8: 자산 대시보드
│   │   ├── simulation.tsx        # 화면9: 금리 스트레스 테스트
│   │   ├── allocation.tsx        # 화면10: 추천 자산배분 + KB 상품
│   │   └── onboarding/
│   │       ├── risk.tsx          # Q1: 투자 리스크 허용도
│   │       ├── goal.tsx          # Q2: 재무 목표
│   │       └── timeline.tsx      # Q3: 기한 / 재조정 주기
│   ├── components/
│   │   ├── Header.tsx            # KB 로고 공통 헤더
│   │   ├── NavBar.tsx            # 대시보드·시뮬레이션·추천배분 탭
│   │   ├── Card.tsx
│   │   ├── PrimaryButton.tsx
│   │   ├── ProgressDots.tsx      # 온보딩 진행 도트
│   │   ├── RiskGauge.tsx         # 5단계 계단식 게이지
│   │   ├── PieChart.tsx          # 배분 파이차트 (SVG)
│   │   ├── LineChart.tsx         # 시뮬레이션 두 선 차트
│   │   └── SingleLineChart.tsx   # 금리 추이 단일 선 차트
│   ├── constants/
│   │   └── theme.ts
│   ├── data/
│   │   └── personas.ts           # 4개 데모 페르소나 + 더미 시계열
│   └── lib/
│       └── api.ts                # FastAPI 호출 함수 전체
│
├── server/                       # FastAPI 백엔드
│   ├── main.py                   # 앱 + CORS + 라우터 등록
│   ├── requirements.txt
│   ├── models/
│   │   ├── garch_x_model.py      # GARCH-X 금리 예측
│   │   ├── hrp_model.py          # HRP 자산배분 (5단계)
│   │   └── test_run.py
│   ├── routers/
│   │   ├── predict.py            # POST /api/predict/garch/
│   │   ├── optimize.py           # POST /api/optimize/hrp/
│   │   ├── profile.py            # POST /api/profile/
│   │   ├── simulate.py           # POST /api/simulate/stress/
│   │   ├── history.py            # GET·POST /api/history/
│   │   ├── market.py             # GET /api/market/rates|news
│   │   ├── admin.py              # GET /api/admin/risk-summary/
│   │   └── report.py
│   ├── services/
│   │   ├── risk_calibration.py   # 리스크 보정 (DTI·고정지출·순자산)
│   │   ├── news_sentiment.py     # 키워드 기반 감성 스코어
│   │   └── market_data.py        # ECOS·네이버 API + 캐시
│   └── db/
│       ├── database.py           # SQLite 초기화
│       ├── models_db.py          # AllocationSnapshot 테이블
│       └── seed_personas.py
│
└── admin-web/                    # Next.js 은행 관제 웹
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx              # 리스크 관제 대시보드 (Recharts)
    │   └── globals.css
    └── lib/
        └── api.ts                # GET /api/admin/risk-summary/
```

---

## 실행 방법

### 사전 준비

```bash
# 환경변수 설정 (server/ 폴더에 .env 파일 생성)
ECOS_API_KEY=한국은행_ECOS_API_키
NAVER_CLIENT_ID=네이버_클라이언트_ID
NAVER_CLIENT_SECRET=네이버_클라이언트_시크릿
```

### 1. 서버 실행

```bash
cd kb-balance/server
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

> ⚠️ 반드시 `python -m uvicorn`으로 실행 (전역 Python 충돌 방지)  
> API 문서: `http://localhost:8000/docs`

### 2. 고객 앱 실행

```bash
cd kb-balance/app
npm install
npx expo start
# 실기기 연결 안 될 때:
npx expo start --tunnel
# 캐시 초기화:
npx expo start --clear
```

**IP 설정**: `app/lib/api.ts`의 `API_BASE`를 서버 IP로 수정:
```typescript
const API_BASE = "http://본인IP:8000";
```

### 3. 은행 관제 웹 실행

```bash
cd kb-balance/admin-web
npm install
npm run dev
# http://localhost:3000
```

> 서버(8000번)가 먼저 켜져 있어야 합니다.

---

## API 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|---|---|---|
| `/` | GET | 헬스체크 |
| `/api/predict/garch/` | POST | GARCH-X 금리 예측 + 인상 확률 |
| `/api/optimize/hrp/` | POST | HRP 자산배분 계산 |
| `/api/profile/` | POST | 리스크 보정 |
| `/api/simulate/stress/` | POST | 금리 스트레스 테스트 (몬테카를로) |
| `/api/market/rates` | GET | ECOS 국고채(3년) 일별 시계열 |
| `/api/market/news` | GET | 네이버뉴스 감성 점수 + 헤드라인 샘플 |
| `/api/history/` | POST | 배분 스냅샷 저장 |
| `/api/history/{persona_id}` | GET | 배분 이력 조회 |
| `/api/admin/risk-summary/` | GET | 은행 관제 리스크 요약 |

---

## 데모 페르소나

| 페르소나 | 나이 | 월소득 | 대출 | 특징 |
|---|---|---|---|---|
| 사회초년생 | 20대 후반 | 280만원 | 신용 1,200만원 (5.9%, 고정) | 소액 신용대출 |
| 신혼부부 | 30대 초반 | 550만원 | 없음 | 내집마련 목표 |
| 대출보유 직장인 | 30대 후반 | 480만원 | 주담대 2.4억 (4.2%, 변동) | 상환 vs 투자 결정 |
| 은퇴준비 중년 | 50대 초반 | 600만원 | 없음 | 자산 2억+, 은퇴 준비 |

---

## 기술 스택

| 영역 | 기술 |
|---|---|
| 고객 앱 | Expo ~54, Expo Router ~6, React Native 0.81 |
| 은행 관제 웹 | Next.js 16, Recharts 3, Tailwind CSS 4 |
| 백엔드 | FastAPI 0.140, Python 3.10, Uvicorn 0.51 |
| AI 엔진 | arch 8.0 (GARCH-X), numpy 2.2, scipy 1.15 |
| ML | scikit-learn 1.7 |
| DB | SQLite, SQLModel 0.0.39, SQLAlchemy 2.0 |
| 외부 API | 한국은행 ECOS (817Y002), 네이버뉴스 검색 |
| 통계 | statsmodels 0.14, pandas 2.3 |

---

## GitHub

```
https://github.com/EllieSoominKim/kb-balance
```
