// Google Sheets API를 통한 카드 데이터 관리
// 추가, 수정, 삭제 기능 제공
// Node.js 18+ 내장 fetch 사용

// CORS 헤더
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const sheetUrl = process.env.GOOGLE_SHEET_URL;
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    if (!sheetUrl) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'GOOGLE_SHEET_URL이 설정되지 않았습니다.' })
      };
    }

    if (!serviceAccountKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'GOOGLE_SERVICE_ACCOUNT_KEY가 설정되지 않았습니다.',
          note: 'Service Account 설정이 필요합니다. README를 참고하세요.'
        })
      };
    }

    // Sheet ID 추출
    const sheetIdMatch = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '잘못된 Google Sheet URL입니다.' })
      };
    }
    const spreadsheetId = sheetIdMatch[1];

    // Service Account 파싱
    let credentials;
    try {
      credentials = JSON.parse(serviceAccountKey);
    } catch (e) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'GOOGLE_SERVICE_ACCOUNT_KEY 파싱 실패. JSON 형식을 확인하세요.' })
      };
    }

    // Google OAuth2 토큰 획득
    const token = await getAccessToken(credentials);

    // 요청 메서드에 따라 처리
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};

    switch (method) {
      case 'GET':
        // 카드 목록 조회 (기존 get-cards.js와 동일)
        return await getCards(spreadsheetId, token);

      case 'POST':
        // 새 카드 추가
        return await addCard(spreadsheetId, token, body);

      case 'PUT':
        // 카드 수정
        return await updateCard(spreadsheetId, token, body);

      case 'DELETE':
        // 카드 삭제
        return await deleteCard(spreadsheetId, token, body);

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: '지원하지 않는 메서드입니다.' })
        };
    }

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: '서버 오류가 발생했습니다.',
        details: error.message
      })
    };
  }
};

// Google OAuth2 Access Token 획득
async function getAccessToken(credentials) {
  const jwtHeader = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');

  const now = Math.floor(Date.now() / 1000);
  const jwtClaimSet = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const jwtClaimSetEncoded = Buffer.from(JSON.stringify(jwtClaimSet)).toString('base64url');
  const signatureInput = `${jwtHeader}.${jwtClaimSetEncoded}`;

  // RS256 서명 생성
  const crypto = require('crypto');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signatureInput);
  const signature = sign.sign(credentials.private_key, 'base64url');

  const jwt = `${signatureInput}.${signature}`;

  // 토큰 요청
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  const tokenData = await tokenResponse.json();

  if (!tokenData.access_token) {
    throw new Error('Access token 획득 실패: ' + JSON.stringify(tokenData));
  }

  return tokenData.access_token;
}

// 카드 목록 조회
async function getCards(spreadsheetId, token) {
  const range = 'Sheet1!A:K'; // 11개 컬럼
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await response.json();

  if (!data.values) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ cards: [], categories: [] })
    };
  }

  // 데이터 파싱
  const cards = parseSheetData(data.values);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(cards)
  };
}

// 시트 데이터 파싱
function parseSheetData(rows) {
  const cardsMap = new Map();
  const categoriesSet = new Set();

  // 첫 번째 행은 헤더
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 6) continue;

    const cardId = row[0] || '';
    const cardName = row[1] || '';
    const issuer = row[2] || '';
    const feeType = row[3] || '국내전용';
    const feeBrand = row[4] || null;
    const annualFee = parseInt(row[5]) || 0;
    const category = row[6] || '';
    const benefitType = row[7] || 'point';
    const rate = parseFloat(row[8]) || 0;
    const maxMonthly = parseInt(row[9]) || 0;
    const description = row[10] || '';

    if (!cardsMap.has(cardId)) {
      cardsMap.set(cardId, {
        id: cardId,
        name: cardName,
        issuer: issuer,
        annualFee: { options: [] },
        benefits: []
      });
    }

    const card = cardsMap.get(cardId);

    // 연회비 옵션 추가
    const existingFee = card.annualFee.options.find(
      opt => opt.type === feeType && opt.brand === feeBrand
    );
    if (!existingFee) {
      card.annualFee.options.push({ type: feeType, brand: feeBrand, fee: annualFee });
    }

    // 혜택 추가
    if (category) {
      card.benefits.push({
        category,
        type: benefitType,
        rate,
        maxMonthly,
        description
      });
      categoriesSet.add(category);
    }
  }

  const categoryIcons = {
    '전체': '💳', '식비': '🍴', '쇼핑': '🛍️', '카페': '☕',
    '교통': '🚗', '통신': '📱', '편의점': '🏪', 'OTT': '📺',
    '온라인쇼핑': '🖥️', '배달': '🛵', '영화': '🎬', '병원': '🏥', '뷰티': '💅'
  };

  const categories = Array.from(categoriesSet).map(cat => ({
    id: cat,
    name: cat,
    icon: categoryIcons[cat] || '💰'
  }));

  return {
    cards: Array.from(cardsMap.values()),
    categories
  };
}

// 새 카드 추가
async function addCard(spreadsheetId, token, cardData) {
  // 카드 데이터를 시트 행으로 변환
  const rows = cardToRows(cardData);

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A:K:append?valueInputOption=RAW`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: rows
    })
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error('카드 추가 실패: ' + JSON.stringify(result));
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, message: '카드가 추가되었습니다.' })
  };
}

// 카드 수정
async function updateCard(spreadsheetId, token, { cardId, cardData }) {
  // 1. 기존 카드 행 찾기 및 삭제
  await deleteCard(spreadsheetId, token, { cardId });

  // 2. 새 데이터 추가
  return await addCard(spreadsheetId, token, cardData);
}

// 카드 삭제
async function deleteCard(spreadsheetId, token, { cardId }) {
  // 1. 전체 데이터 조회
  const range = 'Sheet1!A:K';
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

  const getResponse = await fetch(getUrl, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await getResponse.json();

  if (!data.values) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: '카드를 찾을 수 없습니다.' })
    };
  }

  // 2. 삭제할 행 찾기
  const rowsToDelete = [];
  for (let i = 1; i < data.values.length; i++) {
    if (data.values[i][0] === cardId) {
      rowsToDelete.push(i + 1); // 시트는 1부터 시작
    }
  }

  if (rowsToDelete.length === 0) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: '카드를 찾을 수 없습니다.' })
    };
  }

  // 3. 행 삭제 (역순으로 삭제해야 인덱스가 안 꼬임)
  for (let i = rowsToDelete.length - 1; i >= 0; i--) {
    const rowIndex = rowsToDelete[i];
    const deleteUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;

    await fetch(deleteUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [{
          deleteDimension: {
            range: {
              sheetId: 0,
              dimension: 'ROWS',
              startIndex: rowIndex - 1,
              endIndex: rowIndex
            }
          }
        }]
      })
    });
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, message: '카드가 삭제되었습니다.' })
  };
}

// 카드 데이터를 시트 행으로 변환
function cardToRows(cardData) {
  const rows = [];

  // 카드ID,카드명,발급사,연회비타입,연회비브랜드,연회비,카테고리,혜택타입,할인율,월최대한도,설명

  // 연회비 옵션과 혜택을 조합하여 행 생성
  const feeOptions = cardData.annualFee?.options || [{ type: '국내전용', brand: null, fee: 0 }];
  const benefits = cardData.benefits || [];

  if (benefits.length === 0) {
    // 혜택이 없는 경우, 연회비만 있는 행 생성
    feeOptions.forEach(fee => {
      rows.push([
        cardData.id,
        cardData.name,
        cardData.issuer,
        fee.type,
        fee.brand || '',
        fee.fee,
        '',
        '',
        '',
        '',
        ''
      ]);
    });
  } else {
    // 혜택이 있는 경우
    feeOptions.forEach(fee => {
      benefits.forEach(benefit => {
        // tiers가 있는 경우 각 구간을 별도 행으로 (간단히 하기 위해 일단 단일 혜택만 지원)
        const rate = benefit.rate || 0;
        const maxMonthly = benefit.maxMonthly || 0;

        rows.push([
          cardData.id,
          cardData.name,
          cardData.issuer,
          fee.type,
          fee.brand || '',
          fee.fee,
          benefit.category,
          benefit.type,
          rate,
          maxMonthly,
          benefit.description || ''
        ]);
      });
    });
  }

  return rows;
}
