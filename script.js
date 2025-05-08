document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(e.target));
  console.group('🖨️ 명함 이름 테스트 시작');
  console.log('1) 입력 데이터:', data);

  const fontUrl = '/fonts/KBFGDisplayM.otf';
  const fontBytes = await fetch(fontUrl).then(r => r.arrayBuffer());
  const font = opentype.parse(fontBytes);
  console.log('2) 폰트 이름:', font.names.fullName.en);
  console.log('   unitsPerEm:', font.unitsPerEm);

  const pdfDoc = await PDFLib.PDFDocument.create();
  const page = pdfDoc.addPage([92 * 2.8346, 52 * 2.8346]); // 92mm x 52mm in pt
  console.log('3) PDF 페이지 크기:', page.getWidth(), 'x', page.getHeight());

  const text = data.kor_name;
  const fontSize = 13;
  const letterSpacingEm = 0.3;
  const xPt = 53.95; // 19.034mm
  const yPt = 77.14; // 27.212mm (좌하단 기준)

  const glyphs = font.stringToGlyphs(text);
  const color = PDFLib.cmyk(0, 0.10, 0.20, 0.65);
  let cursorX = xPt;
  const y = yPt;

  let pathData = '';
  glyphs.forEach((g, i) => {
    const p = g.getPath(cursorX, y, fontSize);
    pathData += p.toPathData(2);
    cursorX += g.advanceWidth * (fontSize / font.unitsPerEm) + letterSpacingEm * fontSize;
  });

  page.drawSvgPath(pathData, {
    fillColor: color,
    borderWidth: 0, // 스트로크 제거
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'kor_name_test_positioned.pdf';
  a.click();
  console.groupEnd();
});
