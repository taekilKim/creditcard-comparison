function mm2pt(mm) {
  return mm * 2.83465;
}

window.generatePDFWithKoreanName = function () {
  const form = document.getElementById('infoForm');
  const korName = form.elements['kor_name'].value.trim();

  // 스타일 설정
  const fontSize = 13; // pt
  const letterSpacingEm = 0.3; // 300/1000 em
  const illustratorY = -26.101; // 베이스라인 기준 Y좌표 (mm)
  const artboardHeightMM = 52;

  // PDF-lib 좌표계 보정
  const nameX = mm2pt(19.057);
  const nameBaselineY = mm2pt(artboardHeightMM + illustratorY);

  console.log('🟡 PDF 문서 생성 시작...');

  PDFLib.PDFDocument.create().then((pdfDoc) => {
    const page = pdfDoc.addPage([mm2pt(92), mm2pt(52)]);
    console.log('🟢 PDF 페이지 생성 완료');

    opentype.load('./fonts/KBFGDisplayM.otf', function (err, font) {
      if (err) {
        console.error('❌ 폰트 로딩 실패:', err);
        return;
      }

      console.log('✅ 폰트 로딩 성공:', font.names.fullName.en);

      const fontEm = font.unitsPerEm; // 보통 1000
      const letterSpacing = letterSpacingEm * fontEm;

      const mergedPath = new opentype.Path();
      let x = 0;

      for (let i = 0; i < korName.length; i++) {
        const char = korName[i];
        const glyph = font.charToGlyph(char);
        const glyphPath = glyph.getPath(x, 0, fontSize);
        glyphPath.commands.forEach(cmd => mergedPath.commands.push(cmd));

        const adv = glyph.advanceWidth;
        console.log(`🔠 '${char}' advanceWidth: ${adv}, spacing: ${letterSpacing}`);
        x += adv + letterSpacing;
      }

      const svgPath = mergedPath.toPathData();

      page.drawSvgPath(svgPath, {
        x: nameX,
        y: nameBaselineY,
        color: PDFLib.rgb(0.349, 0.314, 0.278), // CMYK 0/10/20/65 근사값
        borderWidth: 0,
      });

      console.log(`📍 출력 위치: X=${nameX.toFixed(2)}pt, Y=${nameBaselineY.toFixed(2)}pt`);

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
