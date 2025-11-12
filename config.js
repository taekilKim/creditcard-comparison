// 데이터 소스 설정
// 'local': 로컬 JSON 파일 사용
// 'api': Netlify Function을 통해 구글 시트 데이터 로드 (보안 처리됨)
const DATA_SOURCE = 'api';

// Netlify Function 엔드포인트
// manage-cards는 Service Account 인증을 사용하여 비공개 시트에 접근 가능
const API_ENDPOINT = '/.netlify/functions/manage-cards';
