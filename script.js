document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(e.target));
  console.log('1) 폼 데이터:', data);

  const { PDFDocument, rgb } = PDFLib;

  // mm to pt
  const mm2pt = mm => mm * 2.8346;

  // 1. Create PDF
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([mm2pt(92), mm2pt(52)]); // 아트보드 사이즈

  // 2. Load font
  const fontUrl = '/fonts/KBFGDisplayM.otf'; // 실제 경로 확인 필요
  const fontBuffer = await fetch(fontUrl).then(res => res.arrayBuffer());
  const font = opentype.parse(fontBuffer);

  // 3. Draw text
  const text = data.kor_name || '김태길';
  const fontSize = 13;
  const letterSpacing = 0.3; // em
  const baselineOffset = 0; // 추가 조정 필요시 사용
  const x = mm2pt(19.034);
  const y = mm2pt(27.212);

  let cursorX = x;
  const glyphs = font.stringToGlyphs(text);
  const yPos = y;

  let fullPath = '';
  for (const glyph of glyphs) {
    const path = glyph.getPath(cursorX, yPos, fontSize);
    fullPath += path.toPathData(2);
    cursorX += glyph.advanceWidth * (fontSize / font.unitsPerEm) + letterSpacing * fontSize;
  }

  // 4. Fill only (no stroke)
  page.drawSvgPath(fullPath, {
    fillColor: PDFLib.cmyk(0, 0.10, 0.20, 0.65),
    borderColor: undefined,
    borderWidth: 0
  });

  // 5. Save + Download
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'kor_name_test.pdf';
  a.click();
});
