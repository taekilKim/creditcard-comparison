// script.js
// PDF-lib + opentype.js + fontkit 환경에서 텍스트를 path로 아웃라인 처리

// 기본 유틸
const mm2pt = mm => mm * 2.8346;
const COLOR_404C = PDFLib.cmyk(0, 0.10, 0.20, 0.65);

// 폰트 로드 유틸
async function loadFont(url, key) {
  console.log(`📦 ${key} 로딩: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`[${key}] fetch 실패: HTTP ${res.status}`);
  const buffer = await res.arrayBuffer();
  const font = opentype.parse(buffer);
  if (!font || !font.unitsPerEm || !font.glyphs.length) {
    throw new Error(`[${key}] 폰트 파싱 실패`);
  }
  console.log(`✅ ${key} 로드 완료, unitsPerEm: ${font.unitsPerEm}`);
  return font;
}

// 텍스트 → Path → PDF 그리기
function drawTextPath(page, cfg, text, key) {
  console.group(`▶ drawTextPath [${key}]`);
  console.log(`텍스트: "${text}"`);
  if (!text) {
    console.warn('  (빈 문자열, 스킵)');
    console.groupEnd(); return;
  }
  const glyphs = cfg.font.stringToGlyphs(text);
  if (!glyphs.length) {
    console.error('  (glyph 없음)');
    console.groupEnd(); return;
  }

  let cursorX = mm2pt(cfg.x);
  const y = page.getHeight() - mm2pt(cfg.y);
  let pathData = '';

  glyphs.forEach((g, i) => {
    const p = g.getPath(cursorX, y, cfg.size);
    console.log(`  [${key}] glyph ${i} path 길이:`, p.commands.length);
    pathData += p.toPathData(2);
    cursorX += g.advanceWidth * (cfg.size / cfg.font.unitsPerEm) + (cfg.em || 0) * cfg.size;
  });

  if (!pathData) {
    console.error('  pathData 없음 ❌');
    console.groupEnd(); return;
  }

  // 빨간 사각형 디버깅용
  const boxPath = `M ${cursorX} ${y} h 10 v -10 h -10 z`;
  page.drawSvgPath(boxPath, { color: PDFLib.rgb(1, 0, 0) });

  // 텍스트 렌더
  page.drawSvgPath(pathData, {
    fillColor: cfg.color,
    borderWidth: 0.2,
    borderColor: cfg.color
  });

  console.log(`✓ drawSvgPath 완료 (${key})`);
  console.groupEnd();
}

// 메인
async function generateFrontPDF(data) {
  console.group('🖨️ 명함 앞면 PDF 생성 시작');

  // 1) PDF 템플릿 로드
  const tplUrl = '/templates/kbfintech_template_front.pdf';
  const tplRes = await fetch(tplUrl);
  if (!tplRes.ok) throw new Error(`템플릿 로드 실패: HTTP ${tplRes.status}`);
  const tplBytes = await tplRes.arrayBuffer();

  // 2) PDFDoc 준비
  const pdfDoc = await PDFLib.PDFDocument.load(tplBytes);
  const page = pdfDoc.getPage(0);
  console.log('📄 템플릿 페이지 크기:', page.getWidth(), 'x', page.getHeight());

  // 3) 폰트 로드
  const font = await loadFont('/fonts/KBFGTextL.otf', '본문폰트');

  // 4) 레이아웃 정의
  const layout = {
    kor_name:  { x:19.034, y:21.843, size:13, em:0.3, font, color: COLOR_404C },
    kor_dept:  { x:19.034, y:31.747, size: 9, em:0.0, font, color: COLOR_404C },
    kor_title: { x:19.034, y:36.047, size: 9, em:0.0, font, color: COLOR_404C },
    phone:     { x:19.034, y:40.000, size: 8, em:0.0, font, color: COLOR_404C },
    email:     { x:19.034, y:44.000, size: 8, em:0.0, font, color: COLOR_404C },
  };

  // 5) 텍스트 그리기
  drawTextPath(page, layout.kor_name,  data.kor_name, 'kor_name');
  drawTextPath(page, layout.kor_dept,  data.kor_dept, 'kor_dept');
  drawTextPath(page, layout.kor_title, data.kor_title, 'kor_title');
  drawTextPath(page, layout.phone,     data.phone, 'phone');
  drawTextPath(page, layout.email,     `${data.email_id}@alda.ai`, 'email');

  // 6) 저장 및 다운로드
  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'namecard_front.pdf';
  a.click();
  console.log('📥 다운로드 완료');
  console.groupEnd();
}

// 폼 이벤트 연결
const form = document.getElementById('infoForm');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  console.log('✍️ 입력값:', data);
  generateFrontPDF(data).catch(err => console.error('PDF 생성 실패:', err));
});
