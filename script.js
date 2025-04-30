// script.js
// PDF-lib + opentype.js UMD 환경

document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  console.log('▶ 폼 데이터:', data);

  // 1) PDF 템플릿 로드
  console.log('▶ PDF 템플릿 로드 시작');
  const buf = await fetch('/templates/kbfintech_template.pdf')
    .then(r => r.ok ? r.arrayBuffer() : Promise.reject(r.status));
  const pdf = await PDFLib.PDFDocument.load(buf);
  console.log('▶ PDF 로드 완료, 페이지 수:', pdf.getPageCount());
  const [front, back] = pdf.getPages();

  // 2) 폰트 로드 (opentype.js)
  console.log('▶ 폰트 로드 시작');
  const [dBuf, bBuf, lBuf] = await Promise.all([
    fetch('/fonts/KBFGDisplayM.otf').then(r=>r.arrayBuffer()),
    fetch('/fonts/KBFGTextB.otf')  .then(r=>r.arrayBuffer()),
    fetch('/fonts/KBFGTextL.otf')  .then(r=>r.arrayBuffer()),
  ]);
  const fontDisp = opentype.parse(dBuf);
  const fontB    = opentype.parse(bBuf);
  const fontL    = opentype.parse(lBuf);
  console.log('▶ 폰트 로드 완료');

  // 3) Layout / 스타일 분리
  const txtColor = PDFLib.cmyk(0,0.10,0.20,0.65);
  const layout = {
    kor_name:  { x:19.034, y:21.843, size:13, em:0.3, font:fontDisp, color:txtColor },
    kor_dept:  { x:19.034, y:31.747, size: 9, em:0.0, font:fontB,    color:txtColor },
    kor_title: { x:19.034, y:36.047, size: 9, em:0.0, font:fontB,    color:txtColor },
    phone:     { x:19.034, y:40.000, size: 8, em:0.0, font:fontL,    color:txtColor },
    email:     { x:19.034, y:44.000, size: 8, em:0.0, font:fontL,    color:txtColor },

    eng_name:  { x:19.034, y:21.843, size:13, em:0.3, font:fontDisp, color:txtColor },
    eng_dept:  { x:19.034, y:31.747, size: 9, em:0.0, font:fontB,    color:txtColor },
  };
  console.log('▶ Layout 설정 완료');

  const mm2pt = mm => mm * 2.8346;

  // 4) Debug Grid
  function drawGrid(page, name) {
    console.log(`▶ ${name} 페이지에 격자 그리기`);
    const W = mm2pt(92), H = mm2pt(52);
    // 테두리
    page.drawRectangle({
      x:0, y: page.getHeight()-H,
      width: W, height: H,
      borderColor: PDFLib.rgb(0,0,0),
      borderWidth: 0.5,
    });
    // 1mm 간격 선
    for(let i=1;i<92;i++){
      const x = mm2pt(i);
      page.drawLine({
        start:{x, y: page.getHeight()},
        end:  {x, y: page.getHeight()-H},
        thickness:0.2, color:PDFLib.rgb(0.8,0.8,0.8),
      });
    }
    for(let j=1;j<52;j++){
      const y = page.getHeight() - mm2pt(j);
      page.drawLine({
        start:{x:0,    y},
        end:  {x:W,    y},
        thickness:0.2, color:PDFLib.rgb(0.8,0.8,0.8),
      });
    }
  }
  drawGrid(front, '앞면');
  drawGrid(back,  '뒷면');

  // 5) Path 오버레이 함수
  function drawTextPath(page, cfg, text, name) {
    if(!text){ console.log(`▶ [${name}] 텍스트 없음, 스킵`); return; }
    console.log(`▶ [${name}] Path 오버레이: "${text}"`);
    const scale = mm2pt;
    let cursorX = scale(cfg.x);
    const y     = page.getHeight() - scale(cfg.y);
    const glyphs = cfg.font.stringToGlyphs(text);
    let pathData = '';
    glyphs.forEach(g => {
      const p = g.getPath(cursorX, y, cfg.size);
      pathData += p.toPathData(2);
      cursorX += g.advanceWidth*(cfg.size/cfg.font.unitsPerEm) + cfg.em*cfg.size;
    });
    page.drawSvgPath(pathData, {
      color: cfg.color,
      thickness: 0,   // fill 모드 
    });
  }

  // 6) 앞면 텍스트
  drawTextPath(front, layout.kor_name,  data.kor_name,  'kor_name');
  drawTextPath(front, layout.kor_dept,  data.kor_dept,  'kor_dept');
  drawTextPath(front, layout.kor_title, data.kor_title, 'kor_title');
  drawTextPath(front, layout.phone,     data.phone,     'phone');
  drawTextPath(front, layout.email,     `${data.email_id}@alda.ai`, 'email');

  // 7) 뒷면 텍스트
  drawTextPath(back, layout.eng_name, (data.eng_name||'').toUpperCase(), 'eng_name');
  const deptTitle = [data.eng_dept, data.eng_title].filter(Boolean).join(' / ');
  drawTextPath(back, layout.eng_dept, deptTitle, 'eng_dept');

  // 8) 저장 & 다운로드
  console.log('▶ PDF 저장 & 다운로드');
  const finalBytes = await pdf.save();
  const blob = new Blob([finalBytes],{type:'application/pdf'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'namecard_final.pdf';
  link.click();
});
