// script.js

document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  console.group('🖨️ 명함 앞면 생성 시작');

  // 1. 입력값 수집
  const data = Object.fromEntries(new FormData(e.target));
  console.log('1) 입력값:', data);

  // 2. 템플릿 PDF 로드
  let tplBytes;
  try {
    const res = await fetch('/templates/kbfintech_template_front.pdf');
    tplBytes = await res.arrayBuffer();
    console.log('2) 템플릿 불러오기 완료');
  } catch (e) {
    console.error('2) 템플릿 로딩 실패', e);
    return;
  }

  // 3. PDFDocument 생성
  const pdfDoc = await PDFLib.PDFDocument.load(tplBytes);
  const page = pdfDoc.getPage(0);
  console.log('3) PDF 로딩 완료');

  // 4. 폰트 로드
  const fontBuffer = await fetch('/fonts/KBFGDisplayM.otf').then(r => r.arrayBuffer());
  const font = opentype.parse(fontBuffer);
  console.log('4) opentype.js 로드 완료, unitsPerEm:', font.unitsPerEm);

  // 5. 좌표 및 스타일 설정
  const mm2pt = mm => mm * 2.8346;
  const layout = {
    kor_name:  { x:19.034, y:21.843, size:13 },
    kor_dept:  { x:19.034, y:31.747, size: 9 },
    kor_title: { x:19.034, y:36.047, size: 9 },
    phone:     { x:19.034, y:40.000, size: 8 },
    email:     { x:19.034, y:44.000, size: 8 },
  };
  const color = PDFLib.cmyk(0, 0.10, 0.20, 0.65);

  // 6. 텍스트 Path로 렌더링
  for (const key of Object.keys(layout)) {
    const value = (key === 'email') ? `${data.email_id}@alda.ai` : data[key];
    const cfg = layout[key];
    if (!value || !cfg) continue;

    const glyphs = font.stringToGlyphs(value);
    let pathData = '';
    let cursorX = mm2pt(cfg.x);
    const y = page.getHeight() - mm2pt(cfg.y);

    for (let glyph of glyphs) {
      const p = glyph.getPath(cursorX, y, cfg.size);
      pathData += p.toPathData(2);
      cursorX += glyph.advanceWidth * (cfg.size / font.unitsPerEm);
    }

    if (!pathData) continue;

    page.drawSvgPath(pathData, {
      fillColor: color,
      borderColor: color,
      borderWidth: 0.2
    });

    console.log(`✓ ${key} → glyph 개수 ${glyphs.length}`);
  }

  // 7. 저장 & 다운로드
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'namecard_front.pdf';
  a.click();

  console.log('✅ 다운로드 완료');
  console.groupEnd();
});
