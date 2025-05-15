function mm2pt(mm) {
  return mm * 2.83465;
}

window.generatePDFWithKoreanName = function () {
  const form = document.getElementById('infoForm');
  const korName = form.elements['kor_name'].value.trim();

  // ⭐️ 스타일 및 위치 설정
  const fontSize = 13; // pt
  const letterSpacingEm = 0.3; // em 단위 자간
  const illustratorY = 28.031; // ✅ 베이스라인 Y (mm) - 반드시 텍스트 베이스라인 기준
  const illustratorX = 19.057; // 텍스트 좌측 기준 X (mm)

  const nameX = mm2pt(illustratorX);
  const nameBaselineY = mm2pt(illustratorY); // PDF-lib과 Illustrator 좌표계 동일하므로 그대로 사용

  console.log('🟡 PDF 생성 시작');
  console.log(`🎯 좌표 X: ${illustratorX}mm → ${nameX.toFixed(3)}pt`);
  console.log(`🎯 좌표 Y: ${illustratorY}mm → ${nameBaselineY.toFixed(3)}pt`);

  PDFLib.PDFDocument.create().then((pdfDoc) => {
    const page = pdfDoc.addPage([mm2pt(92), mm2pt(52)]); // 명함 크기 92x52mm
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

      console.log(`🔧 폰트 크기: ${fontSize}pt`);
      console.log(`🔧 자간: ${letterSpacing.toFixed(2)}pt`);

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
        color: PDFLib.rgb(0.349, 0.314, 0.278), // CMYK(0,10,20,65) 근사 색상
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
