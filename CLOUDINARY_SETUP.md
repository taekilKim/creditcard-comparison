# Cloudinary 이미지 업로드 설정 가이드

카드 이미지를 직접 업로드하려면 Cloudinary 계정 설정이 필요합니다.

## 1. Cloudinary 계정 생성

1. [Cloudinary 가입](https://cloudinary.com/users/register/free) 페이지로 이동
2. 무료 계정 생성 (이메일 또는 Google 계정으로 가입)
3. 대시보드로 이동

### 무료 티어 제공 용량:
- 월 25 크레딧 (약 25GB 저장공간 + 25GB 대역폭)
- 카드 이미지 약 10,000장 이상 저장 가능

## 2. Cloud Name 확인

1. Cloudinary 대시보드 접속
2. 상단에 **Cloud name** 표시됨
3. 예: `dxxxxxxxxxxxxxx`

## 3. Upload Preset 생성

Upload Preset은 이미지 업로드 설정을 미리 지정하는 것입니다.

### 단계:

1. **Settings** (톱니바퀴 아이콘) → **Upload** 클릭
2. 하단의 **Upload presets** 섹션 찾기
3. **Add upload preset** 클릭
4. 다음 설정 입력:
   - **Preset name**: `card_images` (원하는 이름)
   - **Signing Mode**: **Unsigned** ⭐ 중요!
   - **Folder**: `creditcard-comparison/cards` (선택사항)
   - **Allowed formats**: jpg, png, webp
5. **Save** 클릭

### ⚠️ 주의사항:
- **Signing Mode를 반드시 "Unsigned"로 설정**해야 합니다.
- Signed 모드는 API 키/시크릿이 필요하여 보안상 브라우저에서 사용 불가

## 4. admin.html 설정

`admin.html` 파일을 열고 다음 부분을 수정:

```javascript
// Cloudinary 설정 (604-605번째 줄)
const CLOUDINARY_CLOUD_NAME = 'dxxxxxxxxxxxxxx'; // 여기에 Cloud Name 입력
const CLOUDINARY_UPLOAD_PRESET = 'card_images';   // 여기에 Upload Preset 입력
```

### 예시:
```javascript
const CLOUDINARY_CLOUD_NAME = 'dk2z9s8qw';
const CLOUDINARY_UPLOAD_PRESET = 'card_images';
```

## 5. 사용 방법

1. 관리자 페이지(`/admin.html`) 접속
2. 카드 추가/수정 시 **"카드 이미지"** 섹션에서:
   - 파일 선택 버튼으로 이미지 선택
   - 미리보기 확인
   - **"📤 이미지 업로드"** 버튼 클릭
   - 업로드 성공 시 URL이 자동으로 입력됨

## 6. 권장 이미지 사양

- **형식**: PNG, JPG, WebP
- **크기**: 최대 10MB (권장: 500KB 이하)
- **해상도**: 가로 800px 이상 권장
- **비율**: 가로형 (예: 1.6:1, 카드 실제 비율)

## 7. 문제 해결

### "Cloudinary 설정이 필요합니다" 오류
- `admin.html`에서 `YOUR_CLOUD_NAME`과 `YOUR_UPLOAD_PRESET`을 실제 값으로 변경했는지 확인

### "업로드 실패" 오류
- Upload Preset의 **Signing Mode가 "Unsigned"**인지 확인
- 파일 크기가 10MB 이하인지 확인
- 브라우저 콘솔에서 상세 오류 확인

### CORS 오류
- Cloudinary는 기본적으로 모든 도메인에서 업로드 허용
- 특정 도메인만 허용하려면: Settings → Security → Allowed fetch domains 설정

## 8. 보안 고려사항

### Unsigned Upload는 안전한가?
- ✅ **안전합니다.** Unsigned 모드는 읽기 전용 업로드용으로 설계됨
- ✅ Upload Preset에서 업로드 가능한 파일 형식, 크기, 폴더를 제한 가능
- ✅ Cloudinary 대시보드에서 업로드된 이미지 관리 가능

### 악용 방지:
1. Upload Preset에서 **파일 크기 제한** 설정
2. **Auto-tagging & moderation** 활성화 (부적절한 이미지 자동 차단)
3. 필요 시 **Rate limiting** 설정

## 9. 대안: GitHub Repository 저장

Cloudinary 없이 사용하려면:

1. `/public/images/cards/` 폴더 생성
2. 이미지를 수동으로 업로드하고 git commit
3. URL 입력란에: `/images/cards/카드명.png`

단점: 자동 업로드 불가, 수동 작업 필요

## 참고 링크

- [Cloudinary 공식 문서](https://cloudinary.com/documentation)
- [Upload Presets 가이드](https://cloudinary.com/documentation/upload_presets)
- [Unsigned Upload 설명](https://cloudinary.com/documentation/upload_images#unsigned_upload)
