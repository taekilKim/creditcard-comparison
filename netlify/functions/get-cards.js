// Netlify Serverless Function
// 환경 변수에서 구글 시트 URL을 읽어와 데이터를 프록시합니다

exports.handler = async (event, context) => {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // 환경 변수에서 구글 시트 URL 가져오기
    const sheetUrl = process.env.GOOGLE_SHEET_URL;

    if (!sheetUrl) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Google Sheet URL not configured',
          useLocal: true
        }),
      };
    }

    // 구글 시트 ID 추출
    const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Invalid Google Sheet URL',
          useLocal: true
        }),
      };
    }

    const sheetId = match[1];
    const apiUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;

    // 구글 시트 데이터 가져오기
    const response = await fetch(apiUrl);
    const text = await response.text();

    // Google Visualization API 응답 파싱
    const jsonData = JSON.parse(text.substring(47, text.length - 2));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(jsonData),
    };
  } catch (error) {
    console.error('Error fetching Google Sheet:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch data',
        message: error.message,
        useLocal: true
      }),
    };
  }
};
