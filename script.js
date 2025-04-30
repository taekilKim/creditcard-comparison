// script.js

// PDF-lib, opentype.js UMD 스크립트가 index.html 에서 로드된 상태여야 합니다.

document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  // 1) 폼 데이터 읽기 & 콘솔에 출력
  const data = Object.fromEntries(new FormData(e.target));
  console.log('폼 데이터:', data);
  // → kor_name, kor_dept, kor_title, phone, email_id, eng_name, eng_dept, eng_title 값 확인

  // 2) 템플릿 PDF 불러오기 (public/templates/kbfintech_template.pdf)
  const tplBytes = await fetch('/templates/kbfintech_template.pdf')
    .then(r => r.ok ? r.arrayBuffer() : Promise.reject(`템플릿 로드 실패 ${r.status}`));
  const pdfDoc = await PDFLib.PDFDocument.load(tplBytes);
  const [frontPage, backPage] = pdfDoc.getPages();
  console.log('PDF 페이지 수:', pdfDoc.getPageCount());

  // 3) 폰트 로드 (public/fonts 폴더)
  const [bufD, bufB, bufL] = await Promise.all([
    fetch('/fonts/KBFGDisplayM.otf').then(r => r.arrayBuffer()),
    fetch('/fonts/KBFGTextB.otf')  .then(r => r.arrayBuffer()),
    fetch('/fonts/KBFGTextL.otf')  .then(r => r.arrayBuffer()),
  ]);
  const fontDisplay = opentype.parse(bufD);
  const fontTextB   = opentype.parse(bufB);
  const fontTextL   = opentype.parse(bufL);
  console.log('폰트 로드 완료');

  // 4) CMYK 색상 정의 (Pantone 404C)
  const txtColor = PDFLib.cmyk(0, 0.10, 0.20, 0.65);

  // 5) Path 오버레이 함수 (디버깅용 콘솔로그 포함)
  function drawTextPath(page, font, text, mmX, mmY, ptSize, em) {
    console.log('▶ drawTextPath 호출:', { text, mmX, mmY, ptSize, em });
    if (!text) return;

    const scale = 2.8346;               // mm → pt
    const x = mmX * scale;
    const y = page.getHeight() - mmY * scale;
    let cursor = x;
    let pathData = '';

    const glyphs = font.stringToGlyphs(text);
    glyphs.forEach(g => {
      const p = g.getPath(cursor, y, ptSize);
      pathData += p.toPathData(2);
      cursor += (g.advanceWidth * (ptSize / font.unitsPerEm)) + (em * ptSize);
    });

    page.drawSvgPath(pathData, {
      color: txtColor,
      thickness: 0,
    });
  }

  // 6) 앞면 텍스트 오버레이
  drawTextPath(frontPage, fontDisplay, data.kor_name, 19.034, 21.843, 13, 0.3);
  drawTextPath(frontPage, fontTextB,   data.kor_dept, 19.034, 31.747,  9,   0  );
  drawTextPath(frontPage, fontTextB,   data.kor_title,19.034, 36.047,  9,   0  );
  drawTextPath(frontPage, fontTextL,   data.phone,    19.034, 40.000,  8,   0  );
  drawTextPath(frontPage, fontTextL,   (data.email_id||'') + '@alda.ai', 19.034, 44.000, 8, 0);

  // 7) 뒷면 텍스트 오버레이
  drawTextPath(backPage, fontDisplay, (data.eng_name||'').toUpperCase(), 19.034, 21.843, 13, 0.3);
  const engDeptTitle = [data.eng_dept, data.eng_title].filter(Boolean).join(' / ');
  drawTextPath(backPage, fontTextB, engDeptTitle, 19.034, 31.747, 9, 0);

  // 8) PDF 저장 & 다운로드
  const pdfBytes = await pdfDoc.save();
  const blob     = new Blob([pdfBytes], { type: 'application/pdf' });
  const link     = document.createElement('a');
  link.href      = URL.createObjectURL(blob);
  link.download  = 'namecard_final.pdf';
  link.click();
});
