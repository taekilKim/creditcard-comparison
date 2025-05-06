document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const korName = formData.get('kor_name'); // 이름 필드만 추출

  const fontUrl = '/fonts/KBFGTextL.otf';
  const mm2pt = mm => mm * 2.83465;

  const x_mm = 19.034;
  const y_mm = 22.025;
  const pdfWidth = mm2pt(92);
  const pdfHeight = mm2pt(52);
  const fontSize = 13; // pt

  const resFont = await fetch(fontUrl);
  const fontBuffer = await resFont.arrayBuffer();
  const font = opentype.parse(fontBuffer);

  const pdfDoc = await PDFLib.PDFDocument.create();
  const page = pdfDoc.addPage([pdfWidth, pdfHeight]);

  let cursorX = mm2pt(x_mm);
  const y = pdfHeight - mm2pt(y_mm);
  const spacing = fontSize * 0.3;

  for (const char of korName) {
    const glyph = font.charToGlyph(char);
    const path = glyph.getPath(cursorX, y, fontSize);
    const pathData = path.toPathData(2);

    page.drawSvgPath(pathData, {
      borderWidth: 0.3,
      borderColor: PDFLib.rgb(1, 0, 0),
      fillColor: PDFLib.rgb(0, 0, 0),
    });

    const advance = glyph.advanceWidth / font.unitsPerEm * fontSize;
    cursorX += advance + spacing;
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'namecard_kor_name_test.pdf';
  a.click();
});
