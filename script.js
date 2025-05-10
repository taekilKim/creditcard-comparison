function mm2pt(mm) {
  return mm * 2.83465;
}

window.generatePDFWithKoreanName = function () {
  const form = document.getElementById('infoForm');
  const korName = form.elements['kor_name'].value.trim();

  const fontSize = 13;
  const letterSpacingEm = 0.3;
  const nameX = mm2pt(19.057);
  const nameBaselineY = mm2pt(-26.101);

  PDFLib.PDFDocument.create().then((pdfDoc) => {
    const page = pdfDoc.addPage([mm2pt(92), mm2pt(52)]);

    opentype.load('./fonts/KBFGDisplayM.otf', function (err, font) {
      if (err) {
        console.error('❌ 폰트 로딩 실패:', err);
        return;
      }

      const fontEm = font.unitsPerEm;
      let x = 0;
      const mergedPath = new opentype.Path();

      for (let i = 0; i < korName.length; i++) {
        const glyph = font.charToGlyph(korName[i]);
        const glyphPath = glyph.getPath(x, 0, fontSize);
        glyphPath.commands.forEach(cmd => mergedPath.commands.push(cmd));
        x += glyph.advanceWidth + letterSpacingEm * fontEm;
      }

      const svgPath = mergedPath.toPathData();

      page.drawSvgPath(svgPath, {
        x: nameX,
        y: nameBaselineY,
        color: PDFLib.rgb(0, 0, 0),
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
  });
};
