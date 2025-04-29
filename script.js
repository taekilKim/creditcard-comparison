// script.js
document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));

  // PDF 로드
  const tplBytes = await fetch('./templates/kbfintech_template.pdf').then(r => r.arrayBuffer());
  const pdfDoc   = await PDFLib.PDFDocument.load(tplBytes);
  const [frontPage, backPage] = pdfDoc.getPages();

  // 폰트 로드
  const [bufD, bufB, bufL] = await Promise.all([
    fetch('./fonts/KBFGDisplayM.otf').then(r => r.arrayBuffer()),
    fetch('./fonts/KBFGTextB.otf')    .then(r => r.arrayBuffer()),
    fetch('./fonts/KBFGTextL.otf')    .then(r => r.arrayBuffer()),
  ]);
  const fontDisplay = opentype.parse(bufD);
  const fontTextB   = opentype.parse(bufB);
  const fontTextL   = opentype.parse(bufL);

  // 색상
  const txtColor = PDFLib.cmyk(0,0.10,0.20,0.65);

  // Path 오버레이 함수 (Y 좌표 보정 추가)
  function drawTextPath(page, font, text, mmX, mmY, ptSize, em) {
    if (!text) return;
    const scale = 2.8346;
    const x = mmX * scale;
    const y = page.getHeight() - mmY * scale;
    let cursor = x, pathData = '';
    font.stringToGlyphs(text).forEach(g => {
      const p = g.getPath(cursor, y, ptSize);
      pathData += p.toPathData(2);
      cursor  += g.advanceWidth * (ptSize / font.unitsPerEm) + em * ptSize;
    });
    page.drawSvgPath(pathData, { color: txtColor, thickness: 0 });
  }

  // 앞면
  drawTextPath(frontPage, fontDisplay, data.kor_name,        19.034, 21.843, 13, 0.3);
  drawTextPath(frontPage, fontTextB,   data.kor_dept,        19.034, 31.747,  9, 0  );
  drawTextPath(frontPage, fontTextB,   data.kor_title,       19.034, 36.047,  9, 0  );
  drawTextPath(frontPage, fontTextL,   data.phone,           19.034, 40.000,  8, 0  );
  drawTextPath(frontPage, fontTextL,   (data.email_id||'')+'@alda.ai', 19.034,44.000,8,0);

  // 뒷면
  drawTextPath(backPage, fontDisplay, (data.eng_name||'').toUpperCase(), 19.034,21.843,13,0.3);
  const dt = [data.eng_dept, data.eng_title].filter(Boolean).join(' / ');
  drawTextPath(backPage, fontTextB, dt, 19.034,31.747,9,0);

  // 다운로드
  const pdfBytes = await pdfDoc.save();
  const blob     = new Blob([pdfBytes], { type: 'application/pdf' });
  const link     = document.createElement('a');
  link.href      = URL.createObjectURL(blob);
  link.download  = 'namecard_final.pdf';
  link.click();
});
