# 💳 신용카드 혜택 비교 서비스

두 개의 신용카드를 선택하고 월 예상 소비를 입력하면, 카테고리별 혜택을 자동으로 계산하여 어떤 카드가 더 유리한지 비교해주는 웹 서비스입니다.

## 🌟 주요 기능

- ✅ 2개의 신용카드 동시 비교
- 💰 카테고리별 월 예상 소비 입력 (식비, 쇼핑, 카페, 교통, 통신 등)
- 📊 카드별 혜택 자동 계산 (할인 + 포인트)
- 🎯 실질적인 월간/연간 이득 금액 비교
- 📱 모바일 반응형 디자인
- 🔗 구글 시트 연동 지원 (카드 혜택 데이터 관리)

## 🚀 사용 방법

### 1. 로컬에서 실행

```bash
# 저장소 클론
git clone https://github.com/taekilKim/kbalda-namecard-generator.git
cd kbalda-namecard-generator

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

## 🔧 구글 시트 연동 설정

구글 시트를 사용하면 카드 혜택 데이터를 쉽게 관리하고 업데이트할 수 있습니다.

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

5. **서비스에서 사용**
   - 웹페이지에서 "구글 시트 연동" 선택
   - 복사한 URL을 입력하고 "불러오기" 클릭

## 📁 파일 구조

```
kbalda-namecard-generator/
├── index.html              # 메인 HTML 파일
├── styles.css              # CSS 스타일시트
├── app.js                  # JavaScript 로직
├── cards-data.json         # 로컬 샘플 카드 데이터
├── google-sheet-template.csv  # 구글 시트 템플릿
├── README.md               # 프로젝트 설명서
└── .gitignore             # Git 무시 파일 목록
```

## 💾 데이터 구조

### cards-data.json 구조

```json
{
  "cards": [
    {
      "id": "card1",
      "name": "카드명",
      "issuer": "발급사",
      "annualFee": 0,
      "benefits": [
        {
          "category": "식비",
          "type": "discount",
          "rate": 10,
          "maxMonthly": 10000,
          "description": "음식점 10% 할인"
        }
      ]
    }
  ],
  "categories": [
    {
      "id": "식비",
      "name": "식비",
      "icon": "🍴"
    }
  ]
}
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

- [GitHub Repository](https://github.com/taekilKim/kbalda-namecard-generator)
- [Live Demo](https://taekilkim.github.io/kbalda-namecard-generator)

## 📧 문의

프로젝트 관련 문의사항은 GitHub Issues를 통해 남겨주세요.

---

Made with ❤️ for better credit card choices
