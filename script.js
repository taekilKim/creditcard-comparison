// script.js
document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));

  // 1) PDF 불러오기
  const tplBytes = await fetch('templates/kbfintech_template.pdf')
    .then(r => r.ok ? r.arrayBuffer() : Promise.reject(`템플릿 로드 실패 ${r.status}`));
  const pdfDoc = await PDFLib.PDFDocument.load(tplBytes);
  const [frontPage, backPage] = pdfDoc.getPages();

  // 2) 폰트 로드
  const [dispBuf, bBuf, lBuf] = await Promise.all([
    fetch('fonts/KBFGDisplayM.otf').then(r=>r.arrayBuffer()),
    fetch('fonts/KBFGTextB.otf')  .then(r=>r.arrayBuffer()),
    fetch('fonts/KBFGTextL.otf')  .then(r=>r.arrayBuffer()),
  ]);
  const fontDisplay = opentype.parse(dispBuf);
  const fontTextB   = opentype.parse(bBuf);
  const fontTextL   = opentype.parse(lBuf);

  // 3) CMYK 색상 (Pantone 404C)
  const txtColor = PDFLib.cmyk(0, 0.10, 0.20, 0.65);

  // 4) Path 오버레이 함수
  function drawTextPath(page, font, text, mmX, mmY, ptSize, em) {
    const x0 = mmX * 2.8346;
    const y0 = mmY * 2.8346;
    let cursor = x0, pathData = '';
    font.stringToGlyphs(text).forEach(g => {
      const p = g.getPath(cursor, y0, ptSize);
      pathData += p.toPathData(2);
      cursor  += g.advanceWidth * (ptSize / font.unitsPerEm) + em * ptSize;
    });
    page.drawSvgPath(pathData, { color: txtColor, thickness: 0 });
  }

  // 5) 앞면 텍스트
  drawTextPath(frontPage, fontDisplay, data.kor_name  , 19.034, 21.843, 13, 0.3);
  drawTextPath(frontPage, fontTextB  , data.kor_dept  , 19.034, 31.747,  9, 0  );
  if (data.kor_title)
    drawTextPath(frontPage, fontTextB, data.kor_title , 19.034, 36.047,  9, 0  );
  drawTextPath(frontPage, fontTextL, data.phone      , 19.034, 40.000,  8, 0  );
  drawTextPath(frontPage, fontTextL, data.email_id + '@alda.ai', 19.034, 44.000, 8, 0);

  // 6) 뒷면 텍스트
  drawTextPath(backPage, fontDisplay, (data.eng_name||'').toUpperCase(), 19.034, 21.843, 13, 0.3);
  const deptTitle = [data.eng_dept, data.eng_title].filter(Boolean).join(' / ');
  drawTextPath(backPage, fontTextB, deptTitle, 19.034, 31.747, 9, 0);

  // 7) PDF 저장 & 다운로드
  const pdfBytes = await pdfDoc.save();
  const blob     = new Blob([pdfBytes], { type: 'application/pdf' });
  const link     = document.createElement('a');
  link.href      = URL.createObjectURL(blob);
  link.download  = 'namecard_final.pdf';
  link.click();
});
