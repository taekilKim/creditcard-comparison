function mm2pt(mm) {
  return mm * 2.83465;
}

window.generatePDFWithKoreanName = function () {
  const form = document.getElementById('infoForm');
  const korName = form.elements['kor_name'].value.trim();
  const korDeptOrTitle = form.elements['kor_dept'].value.trim() || form.elements['kor_title'].value.trim();

  const artboardHeight = 52; // mm
  const pageWidth = mm2pt(92);
  const pageHeight = mm2pt(artboardHeight);

  PDFLib.PDFDocument.create().then((pdfDoc) => {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    opentype.load('./fonts/KBFGDisplayM.otf', function (err, font) {
      if (err) {
        console.error('❌ 폰트 로딩 실패:', err);
        return;
      }

      // ▷ 국문 이름
      const nameFontSize = 13;
      const nameLetterSpacing = nameFontSize * 0.3;
      const nameX = mm2pt(19.057);
      const nameBaseline = 25.899;
      const nameY = mm2pt(artboardHeight - nameBaseline);

      const namePath = new opentype.Path();
      let nameXCursor = 0;

      for (const char of korName) {
        const glyph = font.charToGlyph(char);
        const path = glyph.getPath(nameXCursor, 0, nameFontSize);
        path.commands.forEach(cmd => namePath.commands.push(cmd));
        const adv = glyph.advanceWidth / font.unitsPerEm * nameFontSize;
        nameXCursor += adv + nameLetterSpacing;
      }

      page.drawSvgPath(namePath.toPathData(), {
        x: nameX,
        y: nameY,
        color: PDFLib.rgb(0.349, 0.314, 0.278),
      });

      // ▷ 국문 소속 또는 직함
      const subFontSize = 9;
      const subX = mm2pt(19.057);
      const subBaseline = 30.839; // 🎯 보정된 베이스라인 위치
      const subY = mm2pt(artboardHeight - subBaseline);

      const subPath = new opentype.Path();
      let subXCursor = 0;

      for (const char of korDeptOrTitle) {
        const glyph = font.charToGlyph(char);
        const path = glyph.getPath(subXCursor, 0, subFontSize);
        path.commands.forEach(cmd => subPath.commands.push(cmd));
        const adv = glyph.advanceWidth / font.unitsPerEm * subFontSize;
        subXCursor += adv;
      }

      page.drawSvgPath(subPath.toPathData(), {
        x: subX,
        y: subY,
        color: PDFLib.rgb(0.349, 0.314, 0.278),
      });

      // ▷ PDF 저장
      pdfDoc.save().then((pdfBytes) => {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'namecard.pdf';
        a.click();
        URL.revokeObjectURL(url);
        console.log('✅ PDF 다운로드 완료');
      });
    });
  });
};
