// script.js
// PDF-lib + opentype.js UMD 환경에서 동작합니다.

document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  console.group('🖨️ 명함 생성 워크플로우 시작');

  // 1) 폼 데이터 읽기
  const data = Object.fromEntries(new FormData(e.target));
  console.log('1) 폼 데이터:', data);

  // 2) PDF 템플릿 로드
  console.log('2) PDF 템플릿 로드 시작 ("/templates/kbfintech_template.pdf")');
  let tplBytes;
  try {
    const tplRes = await fetch('/templates/kbfintech_template.pdf');
    if (!tplRes.ok) throw new Error(`HTTP ${tplRes.status}`);
    tplBytes = await tplRes.arrayBuffer();
    console.log('2) PDF 템플릿 로드 성공, 파일 크기:', tplBytes.byteLength, 'bytes');
  } catch (err) {
    console.error('2) PDF 템플릿 로드 실패:', err);
    console.groupEnd();
    return;
  }

  // 3) PDFDocument 생성
  let pdfDoc;
  try {
    pdfDoc = await PDFLib.PDFDocument.load(tplBytes);
    console.log('3) PDFDocument 생성 완료, 페이지 수:', pdfDoc.getPageCount());
  } catch (err) {
    console.error('3) PDFDocument.load 실패:', err);
    console.groupEnd();
    return;
  }
  const [frontPage, backPage] = pdfDoc.getPages();

  // 4) opentype.js 로 폰트 로드
  console.log('4) opentype.js 로 폰트 로드 시작');
  const fontFiles = [
    { key: 'Display', url: '/fonts/KBFGDisplayM.otf' },
    { key: 'TextB',    url: '/fonts/KBFGTextB.otf'   },
    { key: 'TextL',    url: '/fonts/KBFGTextL.otf'   },
  ];
  const fonts = {};
  for (const { key, url } of fontFiles) {
    try {
      console.log(`4) 폰트 [${key}] 로드 시도: ${url}`);
      const buf = await fetch(url).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.arrayBuffer();
      });
      fonts[key] = opentype.parse(buf);
      console.log(`4) 폰트 [${key}] 로드 완료, unitsPerEm:`, fonts[key].unitsPerEm);
    } catch (err) {
      console.error(`4) 폰트 [${key}] 로드 실패:`, err);
      console.groupEnd();
      return;
    }
  }

  // 5) 레이아웃 및 스타일 정의
  console.log('5) 레이아웃·스타일 정의');
  const mm2pt = mm => mm * 2.8346;
  const COLOR_404C = PDFLib.cmyk(0, 0.10, 0.20, 0.65);
  const layout = {
    kor_name:  { x:19.034, y:21.843, size:13, em:0.3, font:fonts.Display, color:COLOR_404C },
    kor_dept:  { x:19.034, y:31.747, size: 9, em:0.0, font:fonts.Display, color:COLOR_404C },
    kor_title: { x:19.034, y:36.047, size: 9, em:0.0, font:fonts.TextB,    color:COLOR_404C },
    phone:     { x:19.034, y:40.000, size: 8, em:0.0, font:fonts.TextL,    color:COLOR_404C },
    email:     { x:19.034, y:44.000, size: 8, em:0.0, font:fonts.TextL,    color:COLOR_404C },
    eng_name:  { x:19.034, y:21.843, size:13, em:0.3, font:fonts.Display, color:COLOR_404C },
    eng_dept:  { x:19.034, y:31.747, size: 9, em:0.0, font:fonts.TextB,    color:COLOR_404C },
  };
  console.table(layout);

  // 6) Path 오버레이 함수 (상세 로그)
  function drawTextPath(page, cfg, text, key) {
    console.group(`▶ drawTextPath [${key}] 시작`);
    console.log('- 입력 텍스트:', `"${text}"`);
    if (!text) {
      console.warn('- 텍스트가 비어 있어 스킵');
      console.groupEnd();
      return;
    }

    const glyphs = cfg.font.stringToGlyphs(text);
    console.log('- glyphs 개수:', glyphs.length);
    if (glyphs.length === 0) {
      console.error('- glyphs 배열이 비어 있음, 스킵');
      console.groupEnd();
      return;
    }

    let cursorX = mm2pt(cfg.x);
    const y = page.getHeight() - mm2pt(cfg.y);
    let pathData = '';

    glyphs.forEach((g, i) => {
      const p = g.getPath(cursorX, y, cfg.size);
      const d = p.toPathData(2);
      console.log(`  • glyph[${i}] (unicode=${g.unicode}) pathData 길이: ${d.length}`);
      pathData += d;
      cursorX += g.advanceWidth * (cfg.size / cfg.font.unitsPerEm) + cfg.em * cfg.size;
    });

    if (!pathData) {
      console.error('- 최종 pathData가 비어 있음, 스킵');
      console.groupEnd();
      return;
    }
    console.log('- 최종 pathData 총 길이:', pathData.length);

    page.drawSvgPath(pathData, {
      color: cfg.color,
      thickness: 0
    });
    console.log('- drawSvgPath 완료');
    console.groupEnd();
  }

  // 7) 앞면 텍스트
  console.log('7) 앞면 텍스트 오버레이');
  drawTextPath(frontPage, layout.kor_name,  data.kor_name,  'kor_name');
  drawTextPath(frontPage, layout.kor_dept,  data.kor_dept,  'kor_dept');
  drawTextPath(frontPage, layout.kor_title, data.kor_title, 'kor_title');
  drawTextPath(frontPage, layout.phone,     data.phone,     'phone');
  drawTextPath(frontPage, layout.email,     `${data.email_id}@alda.ai`, 'email');

  // 8) 뒷면 텍스트
  console.log('8) 뒷면 텍스트 오버레이');
  drawTextPath(backPage, layout.eng_name, (data.eng_name||'').toUpperCase(), 'eng_name');
  const deptTitle = [data.eng_dept, data.eng_title].filter(Boolean).join(' / ');
  drawTextPath(backPage, layout.eng_dept, deptTitle, 'eng_dept');

  // 9) PDF 저장 및 다운로드
  console.log('9) PDF 저장 시작');
  try {
    const pdfBytes = await pdfDoc.save();
    console.log('- 최종 PDF 크기:', pdfBytes.byteLength, 'bytes');

    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href        = URL.createObjectURL(blob);
    a.download    = 'namecard_final.pdf';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    console.log('9) 다운로드 트리거 완료');
  } catch (err) {
    console.error('9) PDF 저장 또는 다운로드 실패:', err);
  }

  console.groupEnd();
});
