// script.js

// PDF-lib & fontkit이 index.html에서 이미 로드된 상태여야 합니다.
// (opentype.js, drawSvgPath 코드는 더 이상 사용하지 않습니다)

document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));

  // 1) 템플릿 PDF 로드
  const tplBytes = await fetch('/templates/kbfintech_template.pdf')
    .then(r => r.ok ? r.arrayBuffer() : Promise.reject(`템플릿 로드 실패 ${r.status}`));
  const pdfDoc = await PDFLib.PDFDocument.load(tplBytes);

  // 2) 폰트 임베드
  pdfDoc.registerFontkit(fontkit);
  const [bufD, bufB, bufL] = await Promise.all([
    fetch('/fonts/KBFGDisplayM.otf').then(r => r.arrayBuffer()),
    fetch('/fonts/KBFGTextB.otf')  .then(r => r.arrayBuffer()),
    fetch('/fonts/KBFGTextL.otf')  .then(r => r.arrayBuffer()),
  ]);
  const fontDisp = await pdfDoc.embedFont(bufD);
  const fontB    = await pdfDoc.embedFont(bufB);
  const fontL    = await pdfDoc.embedFont(bufL);

  // 3) CMYK 색상(Pantone 404C)
  const txtColor = PDFLib.cmyk(0, 0.10, 0.20, 0.65);

  // 단위 변환 헬퍼
  const mm2pt = mm => mm * 2.8346;
  const [front, back] = pdfDoc.getPages();

  // 4) drawText 헬퍼 (lineHeight는 값이 있을 때만 추가)
  function drawText(page, text, font, mmX, mmY, sizePt, letterEm = 0, lineHt) {
    if (!text) return;
    const x = mm2pt(mmX);
    const y = page.getHeight() - mm2pt(mmY);

    // 기본 옵션
    const opts = {
      x,
      y,
      size: sizePt,
      font,
      color: txtColor,
      letterSpacing: sizePt * letterEm,
    };
    // lineHeight가 명시적 숫자일 때만 추가
    if (typeof lineHt === 'number') {
      opts.lineHeight = lineHt;
    }

    page.drawText(text, opts);
  }

  // 5) 앞면
  drawText(front, data.kor_name,        fontDisp, 19.034, 21.843, 13, 0.3);
  drawText(front, data.kor_dept,        fontB,    19.034, 31.747,  9,   0  );
  drawText(front, data.kor_title,       fontB,    19.034, 36.047,  9,   0  );
  drawText(front, data.phone,           fontL,    19.034, 40.000,  8,   0  );
  drawText(front, `${data.email_id}@alda.ai`, fontL, 19.034, 44.000, 8, 0);

  // 6) 뒷면
  drawText(back, (data.eng_name||'').toUpperCase(), fontDisp, 19.034, 21.843, 13, 0.3);
  const deptTitle = [data.eng_dept, data.eng_title].filter(Boolean).join(' / ');
  drawText(back, deptTitle, fontB, 19.034, 31.747, 9, 0);

  // 7) PDF 저장 & 다운로드
  const pdfBytes = await pdfDoc.save();
  const blob     = new Blob([pdfBytes], { type: 'application/pdf' });
  const link     = document.createElement('a');
  link.href      = URL.createObjectURL(blob);
  link.download  = 'namecard_final.pdf';
  link.click();
});
