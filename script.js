document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  console.group('🖨️ 명함 앞면 생성 시작');

  const data = Object.fromEntries(new FormData(e.target));
  console.log('1) 입력 데이터:', data);

  // 템플릿 로드
  const tplBytes = await fetch('/templates/kbfintech_template_front.pdf').then(r => r.arrayBuffer());
  const pdfDoc = await PDFLib.PDFDocument.load(tplBytes);
  const [page] = pdfDoc.getPages();
  const pageHeight = page.getHeight();

  // 폰트 로드 (Pretendard OTF 사용)
  const fontBuffer = await fetch('/fonts/Pretendard-Regular.otf').then(r => r.arrayBuffer());
  const font = opentype.parse(fontBuffer);
  console.log('2) 폰트 로드 완료 - unitsPerEm:', font.unitsPerEm);

  // 컬러 및 레이아웃 설정
  const mm2pt = mm => mm * 2.8346;
  const COLOR = PDFLib.cmyk(0, 0.10, 0.20, 0.65);
  const layout = {
    kor_name:  { x:19.034, y:21.843, size:13, em:0.3 },
    kor_dept:  { x:19.034, y:31.747, size: 9, em:0.0 },
    kor_title: { x:19.034, y:36.047, size: 9, em:0.0 },
    phone:     { x:19.034, y:40.000, size: 8, em:0.0 },
    email:     { x:19.034, y:44.000, size: 8, em:0.0 },
  };

  const drawTextPath = (key, text) => {
    console.group(`▶ drawTextPath: ${key}`);
    if (!text) return console.warn('스킵 (빈 텍스트)');
    const cfg = layout[key];
    const glyphs = font.stringToGlyphs(text);
    if (!glyphs.length) return console.warn('스킵 (glyph 없음)');

    let x = mm2pt(cfg.x);
    const y = pageHeight - mm2pt(cfg.y);
    let pathData = '';

    for (const g of glyphs) {
      const p = g.getPath(x, y, cfg.size);
      pathData += p.toPathData(2);
      x += g.advanceWidth * (cfg.size / font.unitsPerEm) + cfg.em * cfg.size;
    }

    if (!pathData) return console.warn('스킵 (pathData 없음)');
    page.drawSvgPath(pathData, {
      fillColor: COLOR,
      borderColor: PDFLib.rgb(1, 0, 0), // 디버깅용 외곽선
      borderWidth: 0.3,
    });
    console.log(`✓ ${key} 출력 완료`);
    console.groupEnd();
  };

  // 실제 텍스트 출력
  drawTextPath('kor_name', data.kor_name);
  drawTextPath('kor_dept', data.kor_dept);
  drawTextPath('kor_title', data.kor_title);
  drawTextPath('phone', data.phone);
  drawTextPath('email', `${data.email_id}@alda.ai`);

  // PDF 저장 및 다운로드
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'namecard_front.pdf';
  a.click();

  console.groupEnd();
});
