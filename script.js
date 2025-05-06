document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  console.group('🖨️ 앞면 명함 생성 시작');

  const data = Object.fromEntries(new FormData(e.target));
  console.log('1) 입력값:', data);

  // 2) PDF 템플릿 로드
  const resTpl = await fetch('/templates/kbfintech_template_front.pdf');
  const tplBytes = await resTpl.arrayBuffer();
  const pdfDoc = await PDFLib.PDFDocument.load(tplBytes);
  const page = pdfDoc.getPages()[0];
  console.log('2) 템플릿 로드 완료');

  // 3) 폰트 로드 (opentype.js)
  const fontUrl = '/fonts/KBFGTextL.otf';
  const fontBuffer = await fetch(fontUrl).then(r => r.arrayBuffer());
  const font = opentype.parse(fontBuffer);
  console.log("3) 폰트 로드:", font.names.fullName?.en || "❌ undefined");
  console.dir(font.names);

  // 4) mm → pt 변환
  const mm2pt = mm => mm * 2.8346;

  // 5) 레이아웃 설정
  const COLOR_KB = PDFLib.cmyk(0, 0.1, 0.2, 0.65);
  const layout = {
    kor_name:  { x:19.034, y:21.843, size:13 },
    kor_dept:  { x:19.034, y:31.747, size:9 },
    kor_title: { x:19.034, y:36.047, size:9 },
    phone:     { x:19.034, y:40.000, size:8 },
    email:     { x:19.034, y:44.000, size:8 },
  };

  // 6) drawTextPath 함수 정의 (y 보정 포함)
  const drawTextPath = (page, cfg, text, key) => {
    console.group(`▶ drawTextPath [${key}]`);
    if (!text) {
      console.warn('  (빈 문자열, 스킵)');
      console.groupEnd();
      return;
    }

    const glyphs = font.stringToGlyphs(text);
    if (!glyphs.length) {
      console.error('  (glyphs 없음)');
      console.groupEnd();
      return;
    }

    let cursorX = mm2pt(cfg.x);
    const y = page.getHeight() - mm2pt(cfg.y);
    let pathData = '';

    glyphs.forEach((g, i) => {
      const p = g.getPath(cursorX, y, cfg.size);
      pathData += p.toPathData(2);
      cursorX += g.advanceWidth * (cfg.size / font.unitsPerEm);
    });

    if (!pathData) return;

    page.drawSvgPath(pathData, {
      fillColor: COLOR_KB,
      borderWidth: 0,
    });

    console.log(`✓ ${key}: glyph ${glyphs.length}개`);
    console.groupEnd();
  };

  // 7) 텍스트 렌더링
  drawTextPath(page, layout.kor_name,  data.kor_name,  'kor_name');
  drawTextPath(page, layout.kor_dept,  data.kor_dept,  'kor_dept');
  drawTextPath(page, layout.kor_title, data.kor_title, 'kor_title');
  drawTextPath(page, layout.phone,     data.phone,     'phone');
  drawTextPath(page, layout.email,     `${data.email_id}@alda.ai`, 'email');

  // 8) 저장 및 다운로드
  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'namecard_front.pdf';
  a.click();

  console.log('9) PDF 다운로드 완료');
  console.groupEnd();
});
