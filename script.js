document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  console.group('🖨️ 명함 생성 워크플로우 시작');

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

  // 3) PDFDocument 생성
  let pdfDoc;
  try {
    pdfDoc = await PDFLib.PDFDocument.load(tplBytes);
    console.log('3) PDF 로드 완료, 페이지 수:', pdfDoc.getPageCount());
  } catch (err) {
    console.error('3) PDFDocument.load 실패:', err);
    console.groupEnd();
    return;
  }
  const [frontPage, backPage] = pdfDoc.getPages();

  // 4) opentype.js 폰트 로드
  console.log('4) opentype.js 폰트 로드 시작');
  const loadFont = async (key, url) => {
    console.log(`  • [${key}] ${url}`);
    const b = await fetch(url).then(r => r.ok ? r.arrayBuffer() : Promise.reject(r.status));
    const f = opentype.parse(b);
    console.log(`    → unitsPerEm:`, f.unitsPerEm);
    return f;
  };
  const fonts = {
    Display: await loadFont('Display', '/fonts/KBFGDisplayM.otf'),
    TextB:    await loadFont('TextB',    '/fonts/KBFGTextB.otf'),
    TextL:    await loadFont('TextL',    '/fonts/KBFGTextL.otf'),
  };
  console.log('4) 폰트 로드 완료');

  // 5) 레이아웃 정의
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
  console.table(layout);

  // 6) 텍스트를 path로 변환하여 PDF에 추가
  function drawTextPath(page, cfg, text, key) {
    console.group(`▶ drawTextPath [${key}]`);
    console.log('- text:', text);
    if (!text) {
      console.warn('  (빈 문자열, 스킵)');
      console.groupEnd();
      return;
    }

    const glyphs = cfg.font.stringToGlyphs(text);
    if (!glyphs.length) {
      console.error('  (glyphs 없음!)');
      console.groupEnd();
      return;
    }

    let cursorX = mm2pt(cfg.x);
    const yBase = page.getHeight() - mm2pt(cfg.y);
    const ascent = cfg.font.ascender * (cfg.size / cfg.font.unitsPerEm);
    const y = yBase + ascent;

    let pathData = '';
    glyphs.forEach((g, i) => {
      const p = g.getPath(cursorX, y, cfg.size);
      console.log(`[${key}] glyph ${i} path 길이:`, p.commands.length);
      pathData += p.toPathData(2);
      cursorX += g.advanceWidth * (cfg.size / cfg.font.unitsPerEm) + cfg.em * cfg.size;
    });

    if (!pathData) {
      console.error('  pathData 없음 ❌');
      console.groupEnd();
      return;
    }

    page.drawSvgPath(pathData, {
      fillColor: cfg.color,
      borderColor: cfg.color,
      borderWidth: 0.3,
    });
    console.log(`✓ drawSvgPath 성공 (${key})`);
    console.groupEnd();
  }

  // 7) 앞면
  drawTextPath(frontPage, layout.kor_name,  data.kor_name,  'kor_name');
  drawTextPath(frontPage, layout.kor_dept,  data.kor_dept,  'kor_dept');
  drawTextPath(frontPage, layout.kor_title, data.kor_title, 'kor_title');
  drawTextPath(frontPage, layout.phone,     data.phone,     'phone');
  drawTextPath(frontPage, layout.email,     `${data.email_id}@alda.ai`, 'email');

  // 8) 뒷면
  const engName = (data.eng_name || '').toUpperCase();
  const deptTitle = [data.eng_dept, data.eng_title].filter(Boolean).join(' / ');
  drawTextPath(backPage, layout.eng_name, engName, 'eng_name');
  drawTextPath(backPage, layout.eng_dept, deptTitle, 'eng_dept');

  // 9) 저장 & 다운로드
  try {
    const bytes = await pdfDoc.save();
    console.log('- PDF 크기:', bytes.byteLength, 'bytes');
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'namecard_final.pdf';
    a.click();
    console.log('- Download 트리거 완료');
  } catch (err) {
    console.error('9) PDF 저장 실패:', err);
  }

  console.groupEnd();
});
