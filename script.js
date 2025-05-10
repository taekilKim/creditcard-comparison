function mm2pt(mm) {
  return mm * 2.83465;
}

async function generatePDFWithKoreanName() {
  const name = '김태길';
  const fontSize = 13;
  const letterSpacingEm = 0.3; // 300/1000em

  const nameX = mm2pt(19.057);
  const nameBaselineY = mm2pt(-26.101);

  const pdfDoc = await PDFLib.PDFDocument.create();
  const page = pdfDoc.addPage([mm2pt(92), mm2pt(52)]);

  opentype.load('./fonts/KBFGDisplayM.otf', function (err, font) {
    if (err) {
      console.error('폰트 로딩 오류:', err);
      return;
    }

    const fontEm = font.unitsPerEm;
    let currentX = 0;
    const mergedPath = new opentype.Path();

    for (let i = 0; i < name.length; i++) {
      const glyph = font.charToGlyph(name[i]);
      const glyphPath = glyph.getPath(currentX, 0, fontSize);
      glyphPath.commands.forEach(cmd => mergedPath.commands.push(cmd));
      currentX += glyph.advanceWidth + letterSpacingEm * fontEm;
    }

    const svgPathData = mergedPath.toPathData();

    page.drawSvgPath(svgPathData, {
      x: nameX,
      y: nameBaselineY,
      color: PDFLib.rgb(0, 0, 0),
      borderWidth: 0
    });

    pdfDoc.save().then((pdfBytes) => {
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'namecard.pdf';
      a.click();
      URL.revokeObjectURL(url);
    });
  });
}
