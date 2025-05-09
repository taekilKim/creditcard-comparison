document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const text = '김태길';
  const fontUrl = '/fonts/KBFGDisplayM.otf';

  console.group('🖨️ 국문 이름 테스트 시작');
  console.log('이름 데이터:', text);

  const pdfDoc = await PDFLib.PDFDocument.create();
  const mm2pt = mm => mm * 2.8346;
  const pageWidth = mm2pt(92);
  const pageHeight = mm2pt(52);
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  const fontBuffer = await fetch(fontUrl).then(r => r.arrayBuffer());
  const font = opentype.parse(fontBuffer);

  console.log('폰트 이름:', font.names.fullName?.en || 'Unknown');
  console.log('unitsPerEm:', font.unitsPerEm);

  const layout = {
    x: mm2pt(19.034),
    y: mm2pt(27.212),
    fontSize: 13,
    letterSpacing: 0.3,
    color: PDFLib.cmyk(0, 0.10, 0.20, 0.65)
  };

  const glyphs = font.stringToGlyphs(text);
  let cursorX = layout.x;
  let pathData = '';

  glyphs.forEach((glyph) => {
    const path = glyph.getPath(cursorX, layout.y, layout.fontSize);
    pathData += path.toPathData(2);
    cursorX += glyph.advanceWidth * (layout.fontSize / font.unitsPerEm) + layout.letterSpacing * layout.fontSize;
  });

  if (pathData) {
    page.drawSvgPath(pathData, {
      fillColor: layout.color,
      borderColor: undefined,
      borderWidth: 0
    });
    console.log('✓ drawSvgPath 성공');
  } else {
    console.warn('⚠️ pathData 비어 있음');
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'kor_name_positioned.pdf';
  a.click();

  console.groupEnd();
});
