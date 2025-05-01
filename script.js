// script.js
// ———————————————————————————
// 1) 의존 라이브러리 전역 객체 불러오기
const { PDFDocument, rgb, cmyk } = PDFLib;
const fontkit = window.fontkit;
// (이 두 스크립트는 index.html 에 이미 <script> 로 로드되어 있습니다.)
// ———————————————————————————

// 2) 폼 제출 핸들러
document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  console.group('🖨️ 명함 생성 워크플로우 시작');

  // 1) 폼 데이터
  const data = Object.fromEntries(new FormData(e.target));
  console.log('1) 폼 데이터:', data);

  // 2) 템플릿 로드
  let tplBytes;
  try {
    console.log('2) PDF 템플릿 로드 시작');
    const res = await fetch('/templates/kbfintech_template.pdf');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    tplBytes = await res.arrayBuffer();
    console.log('2) 로드 완료,', tplBytes.byteLength, 'bytes');
  } catch (err) {
    console.error('2) 템플릿 로드 실패:', err);
    console.groupEnd();
    return;
  }

  // 3) PDFDocument 생성 + Fontkit 등록
  let pdfDoc;
  try {
    pdfDoc = await PDFDocument.load(tplBytes);
    pdfDoc.registerFontkit(fontkit);
    console.log('3) PDF 로드 완료, 페이지 수:', pdfDoc.getPageCount());
  } catch (err) {
    console.error('3) PDFDocument.load 실패:', err);
    console.groupEnd();
    return;
  }
  const [frontPage, backPage] = pdfDoc.getPages();

  // 4) 커스텀 폰트 로드
  console.log('4) 커스텀 폰트 로드 시작');
  async function loadFont(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`폰트 로드 실패 ${url}: ${r.status}`);
    return r.arrayBuffer();
  }
  const [displayBytes, textBBytes, textLBytes] = await Promise.all([
    loadFont('/fonts/KBFGDisplayM.otf'),
    loadFont('/fonts/KBFGTextB.otf'),
    loadFont('/fonts/KBFGTextL.otf'),
  ]);
  const [fontDisplay, fontTextB, fontTextL] = await Promise.all([
    pdfDoc.embedFont(displayBytes),
    pdfDoc.embedFont(textBBytes),
    pdfDoc.embedFont(textLBytes),
  ]);
  console.log('4) 폰트 로드 완료');

  // 5) 레이아웃 · 스타일 정의
  console.log('5) 레이아웃 정의');
  const mm2pt = mm => mm * 2.8346;
  const COLOR_404C = cmyk(0,0.10,0.20,0.65);
  const layout = {
    kor_name:  { x:19.034, y:21.843, size:13, em:0.3, font:fontDisplay, color:COLOR_404C },
    kor_dept:  { x:19.034, y:31.747, size: 9, em:0.0, font:fontDisplay, color:COLOR_404C },
    kor_title: { x:19.034, y:36.047, size: 9, em:0.0, font:fontTextB,    color:COLOR_404C },
    phone:     { x:19.034, y:40.000, size: 8, em:0.0, font:fontTextL,    color:COLOR_404C },
    email:     { x:19.034, y:44.000, size: 8, em:0.0, font:fontTextL,    color:COLOR_404C },
    eng_name:  { x:19.034, y:21.843, size:13, em:0.3, font:fontDisplay, color:COLOR_404C },
    eng_dept:  { x:19.034, y:31.747, size: 9, em:0.0, font:fontTextB,    color:COLOR_404C },
  };
  console.table(layout);

  // 6) 텍스트 벡터 오버레이 함수
  function drawText(page, cfg, text, key) {
    console.group(`▶ drawText [${key}]`);
    console.log('  텍스트:', text);
    if (!text) { console.warn('  빈 문자열, 스킵'); console.groupEnd(); return; }

    // PDF-lib 의 embedFont 를 썼기 때문에, .drawText 로 간단히 그릴 수 있습니다.
    // Path 벡터로 완벽하게 내보내고 싶다면 PDF-lib 에서 drawSvgPath 을 사용하세요.
    page.drawText(text, {
      x: mm2pt(cfg.x),
      y: page.getHeight() - mm2pt(cfg.y) - cfg.size,
      size: cfg.size,
      font: cfg.font,
      color: cfg.color,
      lineHeight: cfg.size * 1.2,
    });

    console.log('  drawText 완료');
    console.groupEnd();
  }

  // 7) 앞면
  console.log('7) 앞면 그리기');
  drawText(frontPage, layout.kor_name,  data.kor_name,  'kor_name');
  drawText(frontPage, layout.kor_dept,  data.kor_dept,  'kor_dept');
  drawText(frontPage, layout.kor_title, data.kor_title, 'kor_title');
  drawText(frontPage, layout.phone,     data.phone,     'phone');
  drawText(frontPage, layout.email,     `${data.email_id}@alda.ai`, 'email');

  // 8) 뒷면
  console.log('8) 뒷면 그리기');
  drawText(backPage, layout.eng_name, (data.eng_name||'').toUpperCase(), 'eng_name');
  const dt  = [data.eng_dept, data.eng_title].filter(Boolean).join(' / ');
  drawText(backPage, layout.eng_dept, dt, 'eng_dept');

  // 9) 저장 & 다운로드
  console.log('9) PDF 저장 시작');
  const pdfBytes = await pdfDoc.save();
  console.log('   ↳ PDF 크기:', pdfBytes.byteLength, 'bytes');
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'namecard_final.pdf';
  a.click();
  console.log('   ↳ 다운로드 트리거 완료');

  console.groupEnd();
});
