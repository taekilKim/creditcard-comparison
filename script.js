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
    tplBytes = await res.arrayBuffer();
    console.log('2) PDF 템플릿 로드 완료:', tplBytes.byteLength, 'bytes');
  } catch (err) {
    console.error('2) 템플릿 로드 실패:', err);
    console.groupEnd();
    return;
  }

  // 3) PDFDocument 로드
  const pdfDoc = await PDFLib.PDFDocument.load(tplBytes);
  const [frontPage, backPage] = pdfDoc.getPages();
  console.log('3) PDF 로드 완료, 페이지 수:', pdfDoc.getPageCount());

  // 4) opentype.js 폰트 로드
  console.log('4) opentype.js 폰트 로드 시작');
  const loadFont = async (key, url) => {
    console.log(`  • [${key}] ${url}`);
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    const font = opentype.parse(buffer);
    return font;
  };

  const fonts = {
    Display: await loadFont('Display', '/fonts/KBFGDisplayM.otf'),
    TextB:    await loadFont('TextB',    '/fonts/KBFGTextB.otf'),
    TextL:    await loadFont('TextL',    '/fonts/KBFGTextL.otf'),
  };
  console.log('4) 폰트 로드 완료');

  // 5) 레이아웃
  const mm2pt = mm => mm * 2.8346;
  const COLOR_404C = PDFLib.cmyk(0, 0.10, 0.20, 0.65);
  const layout = {
    kor_name:  { x:19.034, y:21.843, size:13, em:0.3, font:fonts.Display, color:COLOR_404C },
    kor_dept:  { x:19.034, y:31.747, size: 9, em:0.0, font:fonts.Display, color:COLOR_404C },
    kor_title: { x:19.034, y:36.047, size: 9, em:0.0, font:fonts.TextB,    color:COLOR_404C },
    phone:     { x:19.034, y:40.000, size: 8, em:0.0, font:fonts.TextL,    color:COLOR_404C },
    email:     { x:19.034, y:44.000, size: 8, em:0.0, font:fonts.TextL,    color:COLOR_404C },
    eng_name:  { x:19.034, y:21.843, size:13, em:0.3, font:fonts.Display,  color:COLOR_404C },
    eng_dept:  { x:19.034, y:31.747, size: 9, em:0.0, font:fonts.TextB,    color:COLOR_404C },
  };

  // 6) 텍스트 출력 (glyph 단위로 개별 렌더링)
  function drawTextPath(page, cfg, text, key) {
    console.group(`▶ drawTextPath [${key}]`);
    console.log('- text:', `"${text}"`);
    if (!text) { console.warn('  (빈 문자열, 스킵)'); console.groupEnd(); return; }

    const glyphs = cfg.font.stringToGlyphs(text);
    if (!glyphs.length) { console.warn('  (glyph 없음, 스킵)'); console.groupEnd(); return; }

    let cursorX = mm2pt(cfg.x);
    const y = page.getHeight() - mm2pt(cfg.y);

    glyphs.forEach((glyph, i) => {
      const p = glyph.getPath(cursorX, y, cfg.size);
      const d = p.toPathData(2);
      console.log(`   • [${key}] glyph ${i} path 길이:`, d.length);

      if (!d || d.length < 5) {
        console.warn(`     ⛔ pathData 없음`);
        return;
      }

      page.drawSvgPath(d, {
        fillColor: cfg.color,
        borderWidth: 0,
      });

      cursorX += glyph.advanceWidth * (cfg.size / cfg.font.unitsPerEm) + cfg.em * cfg.size;
    });

    console.groupEnd();
  }

  // 7) 앞면 텍스트
  drawTextPath(frontPage, layout.kor_name,  data.kor_name,  'kor_name');
  drawTextPath(frontPage, layout.kor_dept,  data.kor_dept,  'kor_dept');
  drawTextPath(frontPage, layout.kor_title, data.kor_title, 'kor_title');
  drawTextPath(frontPage, layout.phone,     data.phone,     'phone');
  drawTextPath(frontPage, layout.email,     `${data.email_id}@alda.ai`, 'email');

  // 8) 뒷면 텍스트
  drawTextPath(backPage, layout.eng_name,  (data.eng_name || '').toUpperCase(), 'eng_name');
  const engDeptLine = [data.eng_dept, data.eng_title].filter(Boolean).join(' / ');
  drawTextPath(backPage, layout.eng_dept, engDeptLine, 'eng_dept');

  // 9) 저장 및 다운로드
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'namecard_final.pdf';
  a.click();
  console.log('✅ PDF 다운로드 완료');

  console.groupEnd();
});
