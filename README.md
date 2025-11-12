# 💳 신용카드 혜택 비교 서비스

두 개의 신용카드를 선택하고 월 예상 소비를 입력하면, 카테고리별 혜택을 자동으로 계산하여 어떤 카드가 더 유리한지 비교해주는 웹 서비스입니다.

## 🌟 주요 기능

### 사용자 기능
- ✅ 2개의 신용카드 동시 비교
- 💰 카테고리별 월 예상 소비 입력 (식비, 쇼핑, 카페, 교통, 통신 등)
- 📊 카드별 혜택 자동 계산 (할인 + 포인트)
- 🎯 실질적인 월간/연간 이득 금액 비교
- 📱 모바일 반응형 디자인
- 🔍 제휴처 정보 명확 표시 (전체/주요프랜차이즈/특정브랜드)

### 관리자 기능
- 🔐 비밀번호 보호 관리자 페이지 (`/admin.html`)
- ➕ 카드 추가/수정/삭제 UI
- 🏪 제휴처 표준화 시스템 (자동 제안, 브랜드 태그)
- 💾 구글 시트 자동 동기화
- 📊 전월실적 구간별 혜택 설정 지원
- 💳 다중 연회비 옵션 지원 (국내/해외, 브랜드별)

## 🗺️ MVP 로드맵

### ✅ Phase 1: 기본 비교 시스템 (완료)
- 카드 선택 및 소비 입력
- 혜택 계산 및 비교
- 로컬 데이터 지원

### ✅ Phase 2: 관리자 백오피스 (완료)
- 관리자 페이지 구현
- 구글 시트 연동
- 제휴처 표준화 시스템

### 🔄 Phase 3: 검색 및 필터링 (MVP 후반 계획)
- 키워드로 카드 검색 (예: "스타벅스" 검색)
- 브랜드별 카드 필터링
- 검색 결과를 비교1, 비교2에 자동 배치
- 제휴처별/카테고리별 그룹화 표시

### 📅 Phase 4: 고급 기능 (향후 계획)
- 사용자별 맞춤 추천
- 실제 사용 패턴 분석
- 월별 혜택 트렌드 분석
- 카드 조합 추천

## 🚀 사용 방법

### 1. 로컬에서 실행

```bash
# 저장소 클론
git clone https://github.com/taekilKim/creditcard-comparison.git
cd creditcard-comparison

# 로컬 서버 실행 (Python 3)
python -m http.server 8000

# 또는 Node.js http-server
npx http-server
```

브라우저에서 `http://localhost:8000` 접속

### 2. GitHub Pages 배포

1. GitHub 저장소의 Settings > Pages로 이동
2. Source를 `main` 브랜치로 설정
3. `https://yourusername.github.io/repository-name` 에서 접속

## 📖 사용 가이드

### 기본 사용법

1. **데이터 소스 선택**
   - "로컬 데이터 사용": 내장된 샘플 카드 데이터 사용
   - "구글 시트 연동": 본인이 관리하는 구글 시트 데이터 사용

2. **카드 선택**
   - 드롭다운에서 비교할 카드 2개를 선택합니다
   - 선택하면 카드의 상세 혜택 정보가 표시됩니다

3. **월 예상 소비 입력**
   - 각 카테고리별로 월 예상 소비 금액을 입력합니다
   - 실시간으로 총 예상 소비가 계산됩니다

4. **혜택 계산**
   - "혜택 계산하기" 버튼을 클릭합니다
   - 각 카드의 총 혜택, 연회비, 실질 이득이 표시됩니다
   - 어떤 카드가 얼마나 더 유리한지 한눈에 확인할 수 있습니다

## 🔐 관리자 페이지

이 프로젝트는 카드 혜택을 웹 UI에서 직접 추가/수정/삭제할 수 있는 관리자 페이지를 제공합니다.

- **URL**: `/admin.html`
- **비밀번호**: `admin1234` (코드에서 변경 가능)
- **기능**: 카드 추가, 연회비 옵션 설정, 혜택 관리, 카드 수정/삭제

관리자 페이지에서 저장한 카드 데이터는 구글 시트에 자동으로 저장되며, 모든 브라우저에서 실시간으로 동기화됩니다.

## 🔧 구글 시트 연동 설정 (관리자용 - 보안 처리됨)

카드 혜택 데이터를 구글 시트로 관리하면 코드 수정 없이 데이터를 쉽게 업데이트할 수 있습니다. Netlify Functions를 사용하여 구글 시트 URL을 안전하게 숨길 수 있습니다.

### 구글 시트 생성 및 설정

1. **새 구글 시트 생성**
   - [Google Sheets](https://sheets.google.com) 접속
   - 새 스프레드시트 생성

2. **템플릿 복사**
   - `google-sheet-template.csv` 파일을 열어서 내용 복사
   - 구글 시트에 붙여넣기
   - 또는 아래 형식에 맞춰 직접 입력

3. **구글 시트 컬럼 구조**

| 카드ID | 카드명 | 발급사 | 연회비 | 카테고리 | 혜택타입 | 할인율 | 월최대한도 | 설명 |
|--------|--------|--------|--------|----------|----------|--------|------------|------|
| card1  | KB국민 우리동네GS 카드 | KB국민카드 | 0 | 식비 | discount | 10 | 10000 | 음식점·배달앱 10% 할인 |
| card1  | KB국민 우리동네GS 카드 | KB국민카드 | 0 | 쇼핑 | discount | 5 | 5000 | 온라인쇼핑 5% 할인 |

**중요 필드 설명:**
- `카드ID`: 동일한 카드의 여러 혜택을 그룹화하는 고유 ID
- `혜택타입`: `discount` (할인) 또는 `point` (포인트 적립)
- `할인율`: 퍼센트 단위 (예: 10 = 10%)
- `월최대한도`: 월간 최대 혜택 금액 (원)

4. **웹에 게시 설정**
   - 파일 > 공유 > 웹에 게시
   - "전체 문서" 선택
   - "게시" 버튼 클릭
   - 생성된 URL 복사

### 보안 설정 (Netlify 사용 - 권장)

5. **Netlify 배포 및 환경 변수 설정**

   a. **Netlify에 배포**
   - [Netlify](https://app.netlify.com) 접속 및 로그인
   - "New site from Git" 클릭
   - GitHub 저장소 연결
   - 빌드 설정은 기본값 사용 (정적 사이트)
   - "Deploy site" 클릭

   b. **환경 변수 설정**
   - Netlify 대시보드에서 배포된 사이트 선택
   - Site settings > Environment variables 이동
   - "Add a variable" 클릭
   - 다음 환경 변수 추가:
     - Key: `GOOGLE_SHEET_URL`
     - Value: 복사한 구글 시트 URL
   - "Save" 클릭

   c. **config.js 파일 수정**
   - 프로젝트의 `config.js` 파일을 엽니다
   - `DATA_SOURCE`를 `'api'`로 변경:
   ```javascript
   const DATA_SOURCE = 'api';  // 'local'에서 'api'로 변경
   ```
   - 파일 저장 후 커밋 & 푸시
   - Netlify가 자동으로 재배포합니다

6. **보안 확인**
   - 이제 구글 시트 URL은 Netlify 서버에만 저장됨
   - 사용자가 개발자 도구로 확인해도 실제 URL은 보이지 않음
   - API 엔드포인트(`/.netlify/functions/get-cards`)만 노출됨

7. **데이터 업데이트**
   - 구글 시트에서 카드 정보를 수정하면
   - 웹사이트를 새로고침할 때 자동으로 최신 데이터가 반영됩니다
   - 코드 수정이나 재배포 불필요!

### 간단한 설정 (보안 없음 - 비권장)

보안이 필요 없다면 `config.js`에서 직접 설정할 수도 있습니다:
```javascript
// 주의: 이 방법은 구글 시트 URL이 외부에 노출됩니다
const DATA_SOURCE = 'local';  // 로컬 데이터만 사용
```

## 🔑 관리자 페이지용 Google Service Account 설정

관리자 페이지에서 구글 시트에 카드를 직접 추가/수정/삭제하려면 Google Service Account 인증이 필요합니다.

### 1. Google Cloud Console 설정

1. **Google Cloud Console 접속**
   - [Google Cloud Console](https://console.cloud.google.com) 접속
   - 새 프로젝트 생성 또는 기존 프로젝트 선택

2. **Google Sheets API 활성화**
   - 좌측 메뉴 > "APIs & Services" > "Library"
   - "Google Sheets API" 검색
   - "Enable" 클릭

3. **Service Account 생성**
   - 좌측 메뉴 > "APIs & Services" > "Credentials"
   - "Create Credentials" > "Service Account" 선택
   - Service Account 이름 입력 (예: `card-manager`)
   - "Create and Continue" 클릭
   - Role 선택: "Editor" 권한 부여
   - "Done" 클릭

4. **Service Account Key 생성**
   - 생성된 Service Account 클릭
   - "Keys" 탭 이동
   - "Add Key" > "Create new key" 클릭
   - Key type: "JSON" 선택
   - "Create" 클릭
   - JSON 파일이 자동으로 다운로드됨

### 2. 구글 시트 공유 설정

1. **구글 시트 열기**
   - 카드 데이터를 저장할 구글 시트 열기

2. **Service Account에 권한 부여**
   - "공유" 버튼 클릭
   - 다운로드한 JSON 파일에서 `client_email` 값 복사 (예: `card-manager@project-name.iam.gserviceaccount.com`)
   - 구글 시트 공유 창에 `client_email` 붙여넣기
   - "편집자" 권한 부여
   - "보내기" 클릭

### 3. 구글 시트 컬럼 구조 (업데이트됨)

관리자 페이지는 다음과 같은 **13개 컬럼** 구조를 사용합니다:

| 카드ID | 카드명 | 발급사 | 연회비타입 | 연회비브랜드 | 연회비 | 카테고리 | 혜택타입 | 할인율 | 월최대한도 | 제휴처범위 | 제휴처 | 설명 |
|--------|--------|--------|-----------|-------------|--------|----------|----------|--------|------------|----------|--------|------|
| card1  | KB국민 My WE:SH | KB국민카드 | 국내전용 | VISA | 15000 | 카페 | discount | 20 | 6000 | specific | 스타벅스,이디야,투썸플레이스 | 스타벅스·이디야·투썸플레이스 |
| card2  | 신한 Deep Dream | 신한카드 | 국내전용 | | 10000 | 카페 | discount | 20 | 10000 | all | ALL | 전체 카페/디저트 |
| card3  | 삼성 taptap O | 삼성카드 | 해외겸용 | Mastercard | 18000 | 편의점 | discount | 10 | 5000 | major | MAJOR | 주요 편의점 프랜차이즈 |

**주요 변경사항:**
- `연회비타입`: 국내전용 / 해외겸용
- `연회비브랜드`: VISA, Mastercard, AMEX, JCB, UnionPay (선택 안함 시 빈칸)
- **`제휴처범위` (NEW)**: 혜택 적용 범위 표준화
  - `all`: 카테고리 내 모든 가맹점
  - `major`: 주요 프랜차이즈만
  - `specific`: 특정 브랜드만
- **`제휴처` (NEW)**: 실제 제휴처 정보
  - `ALL`: 전체 가맹점
  - `MAJOR`: 주요 프랜차이즈
  - `스타벅스,이디야,투썸`: 쉼표로 구분된 브랜드 리스트
- 동일한 카드ID로 여러 연회비 옵션 및 혜택을 등록할 수 있음

**제휴처 표준화의 장점:**
- 사용자가 정확히 어디서 혜택을 받을 수 있는지 명확히 알 수 있음
- 향후 브랜드별 검색 기능 구현 가능 (MVP 후반 계획)
- 혜택 비교 시 오해 최소화

**지원되는 카테고리:**
- 전체 (모든 업종에 적용되는 혜택)
- 식비, 쇼핑, 카페, 교통, 통신, 편의점, OTT, 온라인쇼핑, 배달, 영화, 병원, 뷰티

**전월실적 구간별 혜택 (선택사항):**
- 관리자 페이지에서 "전월실적 구간별 혜택 사용" 체크박스 활성화 시 사용
- 예: 40만원 이상 1만원, 80만원 이상 2만원 할인

### 4. Netlify 환경 변수 설정

1. **Netlify 대시보드 접속**
   - 배포된 사이트 선택
   - "Site settings" > "Environment variables" 이동

2. **환경 변수 추가**

   a. `GOOGLE_SHEET_URL`
   - Key: `GOOGLE_SHEET_URL`
   - Value: 구글 시트 URL (예: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit`)

   b. `GOOGLE_SERVICE_ACCOUNT_KEY`
   - Key: `GOOGLE_SERVICE_ACCOUNT_KEY`
   - Value: 다운로드한 JSON 파일의 **전체 내용**을 복사하여 붙여넣기
   ```json
   {
     "type": "service_account",
     "project_id": "your-project-id",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
     "client_email": "card-manager@project-name.iam.gserviceaccount.com",
     "client_id": "...",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token",
     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
     "client_x509_cert_url": "..."
   }
   ```

3. **저장 및 재배포**
   - "Save" 클릭
   - Netlify가 자동으로 사이트를 재배포합니다

### 5. 테스트

1. `/admin.html` 접속
2. 비밀번호 입력 (`admin1234`)
3. 카드 추가 테스트
4. 구글 시트에서 데이터 확인
5. 카드 관리 탭에서 수정/삭제 테스트

### 문제 해결

**오류: "GOOGLE_SERVICE_ACCOUNT_KEY가 설정되지 않았습니다"**
- Netlify 환경 변수에 `GOOGLE_SERVICE_ACCOUNT_KEY`가 올바르게 설정되었는지 확인
- JSON 파일 전체 내용이 복사되었는지 확인

**오류: "Access token 획득 실패"**
- Service Account JSON 파일이 올바른지 확인
- `private_key` 필드에 개행문자(`\n`)가 포함되어 있는지 확인

**오류: "카드 추가 실패"**
- 구글 시트가 Service Account와 공유되어 있는지 확인 (편집자 권한)
- 구글 시트 URL이 올바른지 확인

## 📁 파일 구조

```
creditcard-comparison/
├── index.html                    # 메인 HTML 파일
├── admin.html                    # 관리자 페이지 (카드 추가/수정/삭제)
├── styles.css                    # CSS 스타일시트
├── app.js                        # JavaScript 로직
├── config.js                     # 데이터 소스 설정 파일
├── cards-data.json               # 로컬 샘플 카드 데이터 (백업용)
├── google-sheet-template.csv    # 구글 시트 템플릿
├── netlify.toml                  # Netlify 배포 설정
├── netlify/
│   └── functions/
│       ├── get-cards.js          # 서버리스 함수 (구글 시트 읽기)
│       └── manage-cards.js       # 서버리스 함수 (구글 시트 쓰기/수정/삭제)
├── .env.example                  # 환경 변수 예시
├── .gitignore                    # Git 무시 파일 목록
└── README.md                     # 프로젝트 설명서
```

## 💾 데이터 구조

### cards-data.json 구조 (업데이트됨)

```json
{
  "cards": [
    {
      "id": "card1",
      "name": "카드명",
      "issuer": "발급사",
      "annualFee": {
        "options": [
          { "type": "국내전용", "brand": "VISA", "fee": 10000 },
          { "type": "해외겸용", "brand": "VISA", "fee": 13000 },
          { "type": "해외겸용", "brand": "Mastercard", "fee": 13000 }
        ]
      },
      "benefits": [
        {
          "category": "카페",
          "type": "discount",
          "rate": 20,
          "maxMonthly": 6000,
          "scope": "specific",
          "affiliates": "스타벅스,이디야,투썸플레이스",
          "description": "스타벅스·이디야·투썸플레이스"
        },
        {
          "category": "편의점",
          "type": "discount",
          "rate": 10,
          "maxMonthly": 5000,
          "scope": "all",
          "affiliates": "ALL",
          "description": "전체 편의점"
        },
        {
          "category": "식비",
          "type": "discount",
          "scope": "all",
          "affiliates": "ALL",
          "description": "전월실적 구간별 혜택",
          "tiers": [
            { "minPreviousMonth": 0, "rate": 5, "maxMonthly": 3000 },
            { "minPreviousMonth": 400000, "rate": 10, "maxMonthly": 5000 },
            { "minPreviousMonth": 800000, "rate": 15, "maxMonthly": 8000 }
          ]
        }
      ]
    }
  ],
  "categories": [
    { "id": "전체", "name": "전체 (모든 업종)", "icon": "💳" },
    { "id": "식비", "name": "식비", "icon": "🍴" },
    { "id": "쇼핑", "name": "쇼핑", "icon": "🛍️" }
  ]
}
```

**주요 필드 설명:**

- `annualFee.options`: 연회비 옵션 배열 (국내/해외, 브랜드별)
- `benefits[].scope`: 제휴처 범위 (`all`, `major`, `specific`)
- `benefits[].affiliates`: 제휴처 정보 (`ALL`, `MAJOR`, 또는 브랜드 리스트)
- `benefits[].tiers`: 전월실적 구간별 혜택 (선택사항)
- `benefits[].rate`: 단일 혜택인 경우 할인율/적립률
- `benefits[].maxMonthly`: 월 최대 한도
- `benefits[].description`: 자동 생성된 혜택 설명

## 🔐 보안 기능

### 구글 시트 URL 보호

이 프로젝트는 Netlify Functions를 사용하여 구글 시트 URL을 안전하게 숨깁니다:

- **서버리스 프록시**: 구글 시트 URL은 Netlify 환경 변수에만 저장
- **API 엔드포인트**: 프론트엔드는 `/.netlify/functions/get-cards` 엔드포인트만 호출
- **외부 노출 차단**: 사용자가 개발자 도구로 확인해도 실제 구글 시트 URL은 보이지 않음
- **자동 폴백**: API 로드 실패 시 자동으로 로컬 데이터 사용

### 작동 방식

```
사용자 브라우저 → Netlify Function → Google Sheets → 데이터 반환
                     ↓ (실패 시)
                  로컬 JSON 데이터
```

## 🎨 커스터마이징

### 카테고리 추가/수정

`cards-data.json`의 `categories` 배열에서 카테고리를 추가하거나 수정할 수 있습니다:

```json
{
  "id": "새카테고리",
  "name": "새 카테고리",
  "icon": "🎁"
}
```

### 카드 데이터 추가

`cards-data.json`의 `cards` 배열에 새로운 카드 정보를 추가할 수 있습니다.

### 스타일 변경

`styles.css`의 CSS 변수를 수정하여 색상 테마를 변경할 수 있습니다:

```css
:root {
    --primary-color: #4f46e5;  /* 메인 색상 */
    --secondary-color: #10b981; /* 보조 색상 */
    /* ... */
}
```

## 🔍 계산 로직

### 혜택 계산 방식

1. **카테고리별 혜택 계산**
   - 혜택 금액 = 소비 금액 × (할인율 / 100)
   - 월 최대 한도 적용

2. **총 혜택 합계**
   - 모든 카테고리의 혜택을 합산

3. **실질 이득 계산**
   - 실질 이득 = 총 혜택 - (연회비 / 12)

4. **카드 비교**
   - 두 카드의 실질 이득을 비교하여 우위 판단

## 🛠️ 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Data Source**: JSON / Google Sheets API
- **Deployment**: GitHub Pages (정적 호스팅)

## 📝 주의사항

- 실제 카드 혜택은 카드사의 정책에 따라 달라질 수 있습니다
- 본 서비스는 참고용이며, 실제 카드 선택 시 카드사의 공식 정보를 확인하세요
- 구글 시트 연동 시 "웹에 게시" 설정이 필요합니다 (공개 URL)
- CORS 정책으로 인해 로컬 파일 시스템에서는 동작하지 않을 수 있습니다 (로컬 서버 사용 권장)

## 🤝 기여

버그 리포트, 기능 제안, 풀 리퀘스트 모두 환영합니다!

## 📄 라이선스

MIT License

## 🔗 링크

- [GitHub Repository](https://github.com/taekilKim/creditcard-comparison)
- [Live Demo](https://taekilkim.github.io/creditcard-comparison)

## 📧 문의

프로젝트 관련 문의사항은 GitHub Issues를 통해 남겨주세요.

---

Made with ❤️ for better credit card choices
