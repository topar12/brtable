# 🐾 [반려식탁] 통합 최종 기획서 (MVP)

## 0. 한 줄 정의
한국형 반려동물(강아지/고양이) 품종·개체 데이터와 사료 성분 데이터를 결합하여, **맞춤 급여량 계산 → 알러지 제외 추천/비교 → 가격 위치(역사적 범위 대비 현재 수준) 안내**를 제공하는 영양 관리 중심 서비스.

> **핵심 가치:** "쇼핑 플랫폼"이 아닌, 보호자의 영양 의사결정을 돕는 **"계산/추천/기록/케어 도구"**

---

## 1. 목표 및 핵심 가치

### 목표
* **사용자:** 복잡한 계산 없이 우리 아이에게 딱 맞는 사료와 급여량 확인
* **운영:** 한국 시장에 최적화된 품종 및 사료 DB의 신속한 구축과 유지
* **서비스:** 단순 최저가가 아닌 가격의 맥락(싸다/비싸다)을 알려주는 지표 제공

### 핵심 가치 (Value Proposition)
1.  **맞춤 사료 찾기:** 알러지 제외 및 영양 프로필 기반 추천
2.  **정확한 권장 급여량:** RER/DER 기반 및 사료별 칼로리(kcal) 정밀 적용
3.  **가격 위치 안내:** 기간 내 가격 범위 대비 현재가의 백분위 위치 제공

---

## 2. 디자인 및 제품 컨셉
* **Style:** Apple & Toss 스타일 (간결함, 넉넉한 여백, 카드 UI, Step-by-step)
* **Platform:** Remix 기반 모바일 퍼스트 웹앱
* **UX 원칙:** "복잡한 계산 과정은 숨기고, 결과는 명확하게"
    * 결과는 **한 문장 + 숫자 카드** 형태
    * 상세 근거는 **'자세히 보기(Disclosure)'**를 통해서만 노출

---

## 3. 권한 및 사용자 시스템

| 구분 | 주요 권한 및 기능 |
| :--- | :--- |
| **Guest (비회원)** | 사료 성분/가격 위치 조회, 급여량 계산기 체험 (저장 불가), 예시 수준의 추천 |
| **User (회원)** | 소셜 로그인, 반려동물 프로필 저장(종/나이/체중/중성화/활동량/알러지), 맞춤 리포트 및 급여 기록 저장 |
| **Operator (운영자)** | 품종/사료/가격 데이터 CRUD, 외부 구매 링크 및 SKU 관리, 가격 스냅샷 갱신 |
| **Master (마스터)** | 운영 권한 부여, 서비스 지표(가입, 리텐션, 추천 클릭 등) 관리 |

---

## 4. MVP 범위

### ✅ 포함 사항 (Must-have)
* **DB 구축:** 강아지/고양이 주요 품종 + 사료 성분 + SKU별 가격 히스토리
* **영양 관리 엔진:** * 사료 칼로리 산출 (공시값 사용 또는 Modified Atwater 추정)
    * 개체별 RER/DER 산출 및 일일 권장 급여량(g) 계산
* **추천/비교:** 알러지 필터링 + 가성비/영양 프로필 기반 추천 및 근거 제시
* **가격 위치:** 최근 기간 내 최저/최고가 대비 현재가 위치(0~100) 시각화
* **혼합 급여 계산:** 슬라이더를 이용한 실시간 배분 계산 (A g + B g)

### ❌ 제외 사항 (Non-goals)
* 자체 결제 및 주문 배송 시스템 (쇼핑몰 기능)
* 실시간 가격 크롤링 자동화 (Phase 2 예정)
* 의료/치료 목적의 질병 진단 기능

---

## 5. 데이터베이스 구축

### 5.1 품종 DB (초기)
* **대상:** 강아지 인기 20여 종, 고양이 인기 10~15종 (코숏 포함)
* **필수 데이터:** 종(Species), 품종명, 사이즈, 평균 몸무게 범위, 활동 경향 키워드

### 5.2 사료 DB (초기)
* **데이터:** 브랜드, 제품명, 5대 성분 라벨, 원재료 리스트, kcal/kg (공시/추정)
* **관리 단위:** SKU(용량)별 가격, 구매 링크, 가격 히스토리 스냅샷

---

## 6. 영양 관리 엔진 명세

### 6.1 사료 칼로리(kcal/kg) 추정 로직
1.  **탄수화물(NFE) 계산:**
    $$NFE = 100 - (조단백 + 조지방 + 조섬유 + 조회분 + 수분)$$
    *(방어 로직: NFE가 0보다 작으면 0으로 처리, 합계 비정상 시 운영자 경고)*
2.  **Modified Atwater 적용 (100g당 kcal):**
    $$kcal/100g = (protein \times 3.5) + (fat \times 8.5) + (NFE \times 3.5)$$
3.  **최종 변환:** $kcal/kg = (kcal/100g) \times 10$

### 6.2 개체 칼로리 요구량 (RER/DER)
* **RER(기초대사량):** $70 \times (체중)^{0.75}$
* **DER(일일요구량):** $RER \times 계수$
    * 활동량(1~5단계) 및 중성화 여부에 따른 고정 계수 테이블 적용

---

## 7. 혼합 급여(Mixing) 계산
* **로직:** 사용자가 설정한 비율(ratio)에 따라 목표 칼로리를 배분하여 각 사료의 무게(g) 산출
    * $Target\,kcal_A = DER \times ratio_A$
    * $Gram_A = Target\,kcal_A / (kcalPerKg_A / 1000)$
* **UX:** 토스 스타일의 슬라이더로 실시간 결과 반영

---

## 8. 추천 및 가격 정의

### 8.1 알러지 필터
* 사용자: 고정된 알러지 태그 리스트(체크박스)에서 선택
* 운영자: 사료별 원재료 정보를 기반으로 태그 매핑

### 8.2 가격 위치(Price Position) 정의
* 최근 일정 기간(30/90일)의 데이터를 기준으로 현재 가격의 위치 산출
    $$Position(\%) = \frac{Current - Min}{Max - Min} \times 100$$
* **UI 예시:** "최근 90일 기준 상위 20% 수준(비싼 편)", "최저가 근처"

---

## 9. UI/UX 구조

1.  **온보딩:** Step-by-step 카드 (종→이름→품종→체중→중성화→활동량→알러지)
2.  **홈:** 오늘 권장 급여량 카드 + 빠른 액션 버튼(사료 변경, 비율 조절 등)
3.  **상세:** 성분 5대 지표 차트, 원재료 정보, 알러지 위험 태그
4.  **어드민:** 성분 입력 시 NFE/칼로리 자동 계산 및 SKU/가격 스냅샷 관리

---

## 10. 기술 스택 및 데이터 구조 (Prisma Schema)

```prisma
enum Role { MASTER, OPERATOR, USER }
enum Species { DOG, CAT }
enum KcalSource { OFFICIAL, ESTIMATED }

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  role      Role     @default(USER)
  provider  String
  pets      Pet[]
}

model Pet {
  id            String      @id @default(cuid())
  userId        String
  user          User        @relation(fields: [userId], references: [id])
  name          String
  species       Species
  breedId       String
  breed         Breed       @relation(fields: [breedId], references: [id])
  weight        Float
  isNeutered    Boolean     @default(false)
  activityLevel Int         @default(3)
  allergies     AllergyTag[]
  feedingPlan   FeedingPlan?
}

model Product {
  id          String      @id @default(cuid())
  species     Species
  brand       String
  name        String      @unique
  protein     Float
  fat         Float
  fiber       Float
  ash         Float
  moisture    Float
  kcalPerKg   Float?
  kcalSource  KcalSource  @default(ESTIMATED)
  ingredients String[]
  skus        ProductSku[]
}

model ProductSku {
  id             String          @id @default(cuid())
  productId      String
  product        Product         @relation(fields: [productId], references: [id])
  sizeKg         Float
  currentPrice   Int?
  priceSnapshots PriceSnapshot[]
}