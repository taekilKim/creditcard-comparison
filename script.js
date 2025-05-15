function mm2pt(mm) {
  return mm * 2.83465;
}

window.generatePDFWithKoreanName = function () {
  const form = document.getElementById('infoForm');
  const korName = form.elements['kor_name'].value.trim();

  // 스타일 및 위치 설정
  const fontSize = 13; // pt
  const letterSpacingEm = 0.3; // 300/1000 em
  const illustratorX = 19.057; // mm
  const illustratorY = 25.899; // mm (🎯 베이스라인 기준 Y값)
  const artboardHeight = 52;   // mm (명함 세로 길이)

  const nameX = mm2pt(illustratorX);
  const nameBaselineY = mm2pt(artboardHeight - illustratorY); // ✅ Y 좌표 반전

  console.log('🟡 PDF 생성 시작');
  console.log(`🎯 입력 Y: ${illustratorY}mm → PDF-lib Y: ${(artboardHeight - illustratorY).toFixed(3)}mm → ${nameBaselineY.toFixed(2)}pt`);

  PDFLib.PDFDocument.create().then((pdfDoc) => {
    const page = pdfDoc.addPage([mm2pt(92), mm2pt(52)]); // 명함 크기
    console.log('🟢 PDF 페이지 생성 완료');

    opentype.load('./fonts/KBFGDisplayM.otf', function (err, font) {
      if (err) {
        console.error('❌ 폰트 로딩 실패:', err);
        return;
      }

      console.log('✅ 폰트 로딩 성공:', font.names.fullName.en);

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
        color: PDFLib.rgb(0.349, 0.314, 0.278), // CMYK(0,10,20,65) 근사값
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
