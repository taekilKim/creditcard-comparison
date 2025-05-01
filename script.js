document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  console.group('🖨️ 명함 생성 워크플로우 시작');

  // 1) 폼 데이터
  const data = Object.fromEntries(new FormData(e.target));
  console.log('1) 입력 데이터:', data);

  // 2) 템플릿 로드
  const tplBytes = await fetch('/templates/kbfintech_template.pdf').then(r => r.arrayBuffer());
  const pdfDoc = await PDFLib.PDFDocument.load(tplBytes);
  const [frontPage, backPage] = pdfDoc.getPages();
  console.log('2) PDF 로드 완료, 페이지 수:', pdfDoc.getPageCount());

  // 3) opentype 폰트 로드
  const loadFont = async (name, url) => {
    const buffer = await fetch(url).then(r => r.arrayBuffer());
    const font = opentype.parse(buffer);
    console.log(`✅ ${name} 로드 완료`, font);
    return font;
  };

  const fonts = {
    Display: await loadFont('Display', '/fonts/KBFGDisplayM.otf'),
    TextB: await loadFont('TextB', '/fonts/KBFGTextB.otf'),
    TextL: await loadFont('TextL', '/fonts/KBFGTextL.otf'),
  };

  // 4) 레이아웃 정의
  const mm2pt = mm => mm * 2.8346;
  const COLOR_404C = PDFLib.cmyk(0, 0.10, 0.20, 0.65);

  const layout = {
    kor_name:  { x:19.034, y:21.843, size:13, em:0.3, font:fonts.Display, color:COLOR_404C },
    kor_dept:  { x:19.034, y:31.747, size: 9, em:0.0, font:fonts.Display, color:COLOR_404C },
    kor_title: { x:19.034, y:36.047, size: 9, em:0.0, font:fonts.TextB,   color:COLOR_404C },
    phone:     { x:19.034, y:40.000, size: 8, em:0.0, font:fonts.TextL,   color:COLOR_404C },
    email:     { x:19.034, y:44.000, size: 8, em:0.0, font:fonts.TextL,   color:COLOR_404C },
    eng_name:  { x:19.034, y:21.843, size:13, em:0.3, font:fonts.Display, color:COLOR_404C },
    eng_dept:  { x:19.034, y:31.747, size: 9, em:0.0, font:fonts.TextB,   color:COLOR_404C },
  };

  // 5) 벡터 텍스트 출력 함수
  function drawTextPath(page, cfg, text, label) {
    console.group(`▶ drawTextPath [${label}]`);
    if (!text) {
      console.warn('⚠️ 텍스트 없음, 스킵');
      console.groupEnd();
      return;
    }

    const glyphs = cfg.font.stringToGlyphs(text);
    const y = page.getHeight() - mm2pt(cfg.y);
    let cursorX = mm2pt(cfg.x);
    let pathData = '';

    glyphs.forEach(g => {
      const p = g.getPath(cursorX, y, cfg.size);
      pathData += p.toPathData(2);
      cursorX += g.advanceWidth * (cfg.size / cfg.font.unitsPerEm) + cfg.em * cfg.size;
    });

    if (!pathData) {
      console.error('❌ pathData 없음');
      console.groupEnd();
      return;
    }

    page.drawSvgPath(pathData, {
      fillColor: PDFLib.rgb(1, 0, 0), // 강제 색상 테스트
      borderWidth: 0,
    });

    console.log('✔️ pathData 길이:', pathData.length);
    console.groupEnd();
  }

  // 6) 앞면
  drawTextPath(frontPage, layout.kor_name,  data.kor_name,  'kor_name');
  drawTextPath(frontPage, layout.kor_dept,  data.kor_dept,  'kor_dept');
  drawTextPath(frontPage, layout.kor_title, data.kor_title, 'kor_title');
  drawTextPath(frontPage, layout.phone,     data.phone,     'phone');
  drawTextPath(frontPage, layout.email,     `${data.email_id}@alda.ai`, 'email');

  // 7) 뒷면
  drawTextPath(backPage, layout.eng_name, (data.eng_name || '').toUpperCase(), 'eng_name');
  const engDeptLine = [data.eng_dept, data.eng_title].filter(Boolean).join(' / ');
  drawTextPath(backPage, layout.eng_dept, engDeptLine, 'eng_dept');

  // 8) 저장
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'namecard_final.pdf';
  link.click();

  console.groupEnd();
});
