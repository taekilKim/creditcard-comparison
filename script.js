// script.js

// index.html 에서 PDF-lib + fontkit을 이미 로드해 두셔야 합니다.

document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  // 1) 폼 데이터 읽기
  const data = Object.fromEntries(new FormData(e.target));
  console.log('▶ 1) 폼 데이터:', data);

  // 2) PDF 템플릿 로드
  console.log('▶ 2) PDF 템플릿 로드 시작');
  const tplBytes = await fetch('/templates/kbfintech_template.pdf')
    .then(r => {
      if (!r.ok) throw new Error(`템플릿 로드 실패 ${r.status}`);
      return r.arrayBuffer();
    });
  const pdfDoc = await PDFLib.PDFDocument.load(tplBytes);
  console.log('▶ 2) PDF 로드 완료, 페이지 수:', pdfDoc.getPageCount());
  pdfDoc.registerFontkit(fontkit);
  const [front, back] = pdfDoc.getPages();

  // 3) 폰트 임베드
  console.log('▶ 3) 폰트 임베드 시작');
  const [dBuf, bBuf, lBuf] = await Promise.all([
    fetch('/fonts/KBFGDisplayM.otf').then(r => r.arrayBuffer()),
    fetch('/fonts/KBFGTextB.otf')  .then(r => r.arrayBuffer()),
    fetch('/fonts/KBFGTextL.otf')  .then(r => r.arrayBuffer()),
  ]);
  const fontDisp = await pdfDoc.embedFont(dBuf, { subset: false });
  const fontB    = await pdfDoc.embedFont(bBuf, { subset: false });
  const fontL    = await pdfDoc.embedFont(lBuf, { subset: false });
  console.log('▶ 3) 폰트 임베드 완료');

  // 4) 공통 색상 정의
  const txtColor = PDFLib.cmyk(0, 0.10, 0.20, 0.65);
  const mm2pt = mm => mm * 2.8346;

  // 5) layout 정의
  const layout = {
    kor_name:  { x:19.034, y:21.843, size:13, em:0.3, font:fontDisp, color:txtColor },
    kor_dept:  { x:19.034, y:31.747, size: 9, em:0.0, font:fontB,    color:txtColor },
    kor_title: { x:19.034, y:36.047, size: 9, em:0.0, font:fontB,    color:txtColor },
    phone:     { x:19.034, y:40.000, size: 8, em:0.0, font:fontL,    color:txtColor },
    email:     { x:19.034, y:44.000, size: 8, em:0.0, font:fontL,    color:txtColor },
    eng_name:  { x:19.034, y:21.843, size:13, em:0.3, font:fontDisp, color:txtColor },
    eng_dept:  { x:19.034, y:31.747, size: 9, em:0.0, font:fontB,    color:txtColor },
  };
  console.log('▶ 5) layout 설정 완료');

  // 6) 디버그용 격자 그리기
  function drawGrid(page, name) {
    console.log(`▶ 6) ${name} 페이지 격자 그리기 시작`);
    const w = mm2pt(92), h = mm2pt(52);
    page.drawRectangle({
      x: 0, y: page.getHeight() - h,
      width: w, height: h,
      borderColor: PDFLib.rgb(0,0,0),
      borderWidth: 0.5,
    });
    for (let i = 1; i < 92; i++) {
      const x = mm2pt(i);
      page.drawLine({
        start: { x, y: page.getHeight() },
        end:   { x, y: page.getHeight() - h },
        thickness: 0.2,
        color: PDFLib.rgb(0.8,0.8,0.8),
      });
    }
    for (let j = 1; j < 52; j++) {
      const y = page.getHeight() - mm2pt(j);
      page.drawLine({
        start: { x: 0, y },
        end:   { x: w, y },
        thickness: 0.2,
        color: PDFLib.rgb(0.8,0.8,0.8),
      });
    }
    console.log(`▶ 6) ${name} 페이지 격자 그리기 완료`);
  }
  drawGrid(front, '앞면');
  drawGrid(back,  '뒷면');

  // 7) 텍스트 렌더링 헬퍼
  function drawText(page, text, cfg, name) {
    if (!text) {
      console.log(`▶ 7) [${name}] 텍스트 없음, 스킵`);
      return;
    }
    const x = mm2pt(cfg.x);
    const y = page.getHeight() - mm2pt(cfg.y);
    console.log(`▶ 7) [${name}] 그리기: "${text}" @ (${cfg.x},${cfg.y}), size=${cfg.size}, em=${cfg.em}`);
    page.drawText(text, {
      x, y,
      size: cfg.size,
      font: cfg.font,
      color: cfg.color,
      letterSpacing: cfg.size * cfg.em,
    });
  }

  // 8) 앞면 텍스트
  drawText(front, data.kor_name,  layout.kor_name,  'kor_name');
  drawText(front, data.kor_dept,  layout.kor_dept,  'kor_dept');
  drawText(front, data.kor_title, layout.kor_title, 'kor_title');
  drawText(front, data.phone,     layout.phone,     'phone');
  drawText(front, `${data.email_id}@alda.ai`, layout.email, 'email');

  // 9) 뒷면 텍스트
  drawText(back, (data.eng_name||'').toUpperCase(), layout.eng_name, 'eng_name');
  const deptTitle = [data.eng_dept, data.eng_title].filter(Boolean).join(' / ');
  drawText(back, deptTitle, layout.eng_dept, 'eng_dept');

  // 10) PDF 저장 & 다운로드
  console.log('▶ 10) PDF 저장 시작');
  const pdfBytes = await pdfDoc.save();
  console.log('▶ 10) PDF 저장 완료, 다운로드 트리거');
  const blob = new Blob([pdfBytes], { type:'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'namecard_final.pdf';
  link.click();
});
