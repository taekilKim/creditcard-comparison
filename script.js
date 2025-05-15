function mm2pt(mm) {
  return mm * 2.83465;
}

window.generatePDFWithKoreanName = function () {
  const form = document.getElementById('infoForm');
  const korName = form.elements['kor_name'].value.trim();

  // ▶ 스타일 및 위치 설정
  const fontSize = 13;
  const letterSpacingEm = 0.3;
  const illustratorX = 19.057;      // 텍스트 시작 X (mm)
  const illustratorY = 26.354;      // 베이스라인 기준 Y (mm)
  const artboardHeight = 52;        // 명함 세로 크기 (mm)

  const nameX = mm2pt(illustratorX);
  const nameBaselineY = mm2pt(artboardHeight - illustratorY); // ✅ 반전 적용

  console.log('🟡 PDF 생성 시작');
  console.log(`🎯 입력된 베이스라인 Y: ${illustratorY}mm`);
  console.log(`🎯 반전된 PDF Y: ${artboardHeight - illustratorY}mm → ${nameBaselineY.toFixed(2)}pt`);

  PDFLib.PDFDocument.create().then((pdfDoc) => {
    const page = pdfDoc.addPage([mm2pt(92), mm2pt(52)]); // 명함 사이즈
    console.log('🟢 페이지 생성 완료');

    opentype.load('./fonts/KBFGDisplayM.otf', function (err, font) {
      if (err) {
        console.error('❌ 폰트 로딩 실패:', err);
        return;
      }

      const mergedPath = new opentype.Path();
      let x = 0;
      const letterSpacing = letterSpacingEm * fontSize;

      for (let i = 0; i < korName.length; i++) {
        const glyph = font.charToGlyph(korName[i]);
        const glyphPath = glyph.getPath(x, 0, fontSize);
        glyphPath.commands.forEach(cmd => mergedPath.commands.push(cmd));

        const adv = glyph.advanceWidth / font.unitsPerEm * fontSize;
        x += adv + letterSpacing;
      }

      const svgPath = mergedPath.toPathData();
      page.drawSvgPath(svgPath, {
        x: nameX,
        y: nameBaselineY,
        color: PDFLib.rgb(0.349, 0.314, 0.278), // 팬톤 404C 근사 RGB
        borderWidth: 0,
      });

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
