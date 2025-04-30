// script.js
// PDF-lib + Fontkit UMD 환경

document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  console.group('🖨️ 명함 생성 워크플로우 시작');

  // 1) 폼 데이터
  const data = Object.fromEntries(new FormData(e.target));
  console.log('1) 폼 데이터:', data);

  // 2) PDF 템플릿 로드
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
    pdfDoc = await PDFLib.PDFDocument.load(tplBytes);
    console.log('3) PDF 로드 완료, 페이지 수:', pdfDoc.getPageCount());
    pdfDoc.registerFontkit(fontkit);
  } catch (err) {
    console.error('3) PDFDocument.load 실패:', err);
    console.groupEnd();
    return;
  }
  const [frontPage, backPage] = pdfDoc.getPages();

  // 4) 커스텀 폰트 임베드
  console.log('4) 커스텀 폰트 임베드 시작');
  async function embed(name, url) {
    console.log(`  • ${name} → ${url}`);
    const bytes = await fetch(url).then(r => {
      if (!r.ok) throw new Error(r.status);
      return r.arrayBuffer();
    });
    const font = await pdfDoc.embedFont(bytes);
    console.log(`    → ${name} 임베드 완료`);
    return font;
  }
  const fonts = {
    Display: await embed('DisplayM', '/fonts/KBFGDisplayM.otf'),
    TextB:    await embed('TextB',    '/fonts/KBFGTextB.otf'),
    TextL:    await embed('TextL',    '/fonts/KBFGTextL.otf'),
  };

  // 5) 레이아웃 · 스타일 정의
  console.log('5) 레이아웃 정의');
  const mm2pt = mm => mm * 2.8346;
  const COLOR_404C = PDFLib.cmyk(0,0.10,0.20,0.65);
  const layout = {
    kor_name:  { x:19.034, y:21.843, size:13,   spacing:0.3, font:fonts.Display, color:COLOR_404C },
    kor_dept:  { x:19.034, y:31.747, size: 9,   spacing:0.0, font:fonts.Display, color:COLOR_404C },
    kor_title: { x:19.034, y:36.047, size: 9,   spacing:0.0, font:fonts.TextB,    color:COLOR_404C },
    phone:     { x:19.034, y:40.000, size: 8,   spacing:0.0, font:fonts.TextL,    color:COLOR_404C },
    email:     { x:19.034, y:44.000, size: 8,   spacing:0.0, font:fonts.TextL,    color:COLOR_404C },
    eng_name:  { x:19.034, y:21.843, size:13,   spacing:0.3, font:fonts.Display, color:COLOR_404C },
    eng_dept:  { x:19.034, y:31.747, size: 9,   spacing:0.0, font:fonts.TextB,    color:COLOR_404C },
  };
  console.table(layout);

  // 6) drawText 래퍼
  function drawField(page, cfg, text, key) {
    console.group(`▶ draw [${key}]`);
    console.log('- text:', text);
    if (!text) { console.warn('  (빈 문자열, 스킵)'); console.groupEnd(); return; }
    const options = {
      x: mm2pt(cfg.x),
      y: page.getHeight() - mm2pt(cfg.y),
      size: cfg.size,
      font: cfg.font,
      color: cfg.color,
      characterSpacing: cfg.spacing * cfg.size,
    };
    page.drawText(text, options);
    console.log('- drawText 완료:', options);
    console.groupEnd();
  }

  // 7) 앞면
  console.log('7) 앞면 오버레이');
  drawField(frontPage, layout.kor_name,  data.kor_name,  'kor_name');
  drawField(frontPage, layout.kor_dept,  data.kor_dept,  'kor_dept');
  drawField(frontPage, layout.kor_title, data.kor_title, 'kor_title');
  drawField(frontPage, layout.phone,     data.phone,     'phone');
  drawField(frontPage, layout.email,     `${data.email_id}@alda.ai`, 'email');

  // 8) 뒷면
  console.log('8) 뒷면 오버레이');
  drawField(backPage, layout.eng_name,  (data.eng_name||'').toUpperCase(), 'eng_name');
  const deptLine = [data.eng_dept, data.eng_title].filter(Boolean).join(' / ');
  drawField(backPage, layout.eng_dept,  deptLine, 'eng_dept');

  // 9) 저장 & 다운로드
  console.log('9) PDF 저장 & 다운로드');
  try {
    const pdfBytes = await pdfDoc.save();
    console.log('- PDF 크기:', pdfBytes.byteLength, 'bytes');
    const blob = new Blob([pdfBytes], { type:'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'namecard_final.pdf';
    link.click();
    console.log('- Download 트리거 완료');
  } catch (err) {
    console.error('9) PDF 저장 실패:', err);
  }

  console.groupEnd();
});
