function mm2pt(mm) {
  return mm * 2.83465;
}

window.generatePDFWithKoreanName = function () {
  const form = document.getElementById('infoForm');
  const korName = form.elements['kor_name'].value.trim();

  // 스타일 설정
  const fontSize = 13;
  const letterSpacingEm = 0.3;
  const illustratorY = 27.066; // ✅ 하단 정렬 최종 보정값
  const nameX = mm2pt(19.057);
  const nameBaselineY = mm2pt(illustratorY);

  console.log('🟡 PDF 생성 시작');
  console.log(`🎯 베이스라인 Y: ${illustratorY}mm → PDF Y: ${nameBaselineY.toFixed(3)}pt`);

  PDFLib.PDFDocument.create().then((pdfDoc) => {
    const page = pdfDoc.addPage([mm2pt(92), mm2pt(52)]);
    console.log('🟢 페이지 생성 완료');

    opentype.load('./fonts/KBFGDisplayM.otf', function (err, font) {
      if (err) {
        console.error('❌ 폰트 로딩 실패:', err);
        return;
      }

      console.log('✅ 폰트 로딩 성공:', font.names.fullName.en);

      const mergedPath = new opentype.Path();
      let x = 0;
      const letterSpacing = letterSpacingEm * fontSize;

      console.log(`🔧 폰트 크기: ${fontSize}pt, 자간: ${letterSpacing.toFixed(2)}pt`);

      for (let i = 0; i < korName.length; i++) {
        const char = korName[i];
        const glyph = font.charToGlyph(char);
        const glyphPath = glyph.getPath(x, 0, fontSize);
        glyphPath.commands.forEach(cmd => mergedPath.commands.push(cmd));

        const adv = glyph.advanceWidth / font.unitsPerEm * fontSize;
        console.log(`🔠 '${char}' → adv: ${adv.toFixed(2)}pt, step: ${(adv + letterSpacing).toFixed(2)}pt`);
        x += adv + letterSpacing;
      }

      const svgPath = mergedPath.toPathData();
      page.drawSvgPath(svgPath, {
        x: nameX,
        y: nameBaselineY,
        color: PDFLib.rgb(0.349, 0.314, 0.278),
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
