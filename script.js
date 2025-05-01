document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  console.group('🖨️ 명함 생성 워크플로우 시작');

  const data = Object.fromEntries(new FormData(e.target));
  console.log('1) 폼 데이터:', data);

  // 템플릿 PDF 로드
  const tplBytes = await fetch('/templates/kbfintech_template.pdf').then(res => res.arrayBuffer());
  const pdfDoc = await PDFLib.PDFDocument.load(tplBytes);
  const [frontPage, backPage] = pdfDoc.getPages();
  console.log('2) 템플릿 로드 완료, 페이지 수:', pdfDoc.getPageCount());

  // 폰트 로드
  const loadFont = async (url) => opentype.load(url);
  const fonts = {
    Display: await loadFont('/fonts/KBFGDisplayM.otf'),
    TextB: await loadFont('/fonts/KBFGTextB.otf'),
    TextL: await loadFont('/fonts/KBFGTextL.otf')
  };
  console.log('3) opentype.js 폰트 로드 완료');

  const mm2pt = mm => mm * 2.8346;
  const COLOR_404C = PDFLib.cmyk(0,0.10,0.20,0.65);

  const layout = {
    kor_name:  { x:19.034, y:21.843, size:13, em:0.3, font:fonts.Display, color:COLOR_404C },
    kor_dept:  { x:19.034, y:31.747, size: 9, em:0.0, font:fonts.Display, color:COLOR_404C },
    kor_title: { x:19.034, y:36.047, size: 9, em:0.0, font:fonts.TextB,    color:COLOR_404C },
    phone:     { x:19.034, y:40.000, size: 8, em:0.0, font:fonts.TextL,    color:COLOR_404C },
    email:     { x:19.034, y:44.000, size: 8, em:0.0, font:fonts.TextL,    color:COLOR_404C },
    eng_name:  { x:19.034, y:21.843, size:13, em:0.3, font:fonts.Display,  color:COLOR_404C },
    eng_dept:  { x:19.034, y:31.747, size: 9, em:0.0, font:fonts.TextB,    color:COLOR_404C }
  };

  function drawTextPath(page, cfg, text, key) {
    console.group(`▶ drawTextPath [${key}]`);
    if (!text) { console.warn('  (스킵: 빈 문자열)'); console.groupEnd(); return; }

    const glyphs = cfg.font.stringToGlyphs(text);
    if (!glyphs.length) { console.error('  (에러: glyph 없음)'); console.groupEnd(); return; }

    const y = page.getHeight() - mm2pt(cfg.y);
    let cursorX = mm2pt(cfg.x);
    let pathData = '';

    glyphs.forEach((g, i) => {
      const p = g.getPath(cursorX, y, cfg.size);
      console.log(`  [${key}] glyph ${i} path 길이:`, p.commands.length);
      pathData += p.toPathData(2);
      cursorX += g.advanceWidth * (cfg.size / cfg.font.unitsPerEm) + cfg.em * cfg.size;
    });

    if (!pathData) {
      console.error(`  [${key}] pathData 없음`);
      console.groupEnd();
      return;
    }

    console.log(`✔ pathData 길이: ${pathData.length}`);
    try {
      page.drawSvgPath(pathData, {
        fillColor: cfg.color,
        borderWidth: 0
      });
      console.log(`✅ drawSvgPath 성공`);
    } catch (err) {
      console.error(`❌ drawSvgPath 실패`, err);
    }

    console.groupEnd();
  }

  // 앞면
  drawTextPath(frontPage, layout.kor_name,  data.kor_name,  'kor_name');
  drawTextPath(frontPage, layout.kor_dept,  data.kor_dept,  'kor_dept');
  drawTextPath(frontPage, layout.kor_title, data.kor_title, 'kor_title');
  drawTextPath(frontPage, layout.phone,     data.phone,     'phone');
  drawTextPath(frontPage, layout.email,     `${data.email_id}@alda.ai`, 'email');

  // 뒷면
  drawTextPath(backPage, layout.eng_name, (data.eng_name||'').toUpperCase(), 'eng_name');
  const dt = [data.eng_dept, data.eng_title].filter(Boolean).join(' / ');
  drawTextPath(backPage, layout.eng_dept, dt, 'eng_dept');

  // 저장
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'namecard_final.pdf';
  link.click();

  console.groupEnd();
});
