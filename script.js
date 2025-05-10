function mm2pt(mm) {
  return mm * 2.83465;
}

window.generatePDFWithKoreanName = function () {
  const form = document.getElementById('infoForm');
  const korName = form.elements['kor_name'].value.trim();

  // 스타일 정보
  const fontSize = 13; // pt
  const letterSpacingEm = 0.3; // 300/1000 em
  const illustratorY = -26.101; // Illustrator 기준 베이스라인 Y좌표 (mm)
  const artboardHeightMM = 52; // 아트보드 높이 (mm)

  // PDF-lib 좌표계 기준으로 보정된 Y
  const nameX = mm2pt(19.057); // X좌표: 좌상단 기준
  const nameBaselineY = mm2pt(artboardHeightMM + illustratorY); // Y좌표: PDF-lib 하단 기준 보정

  console.log('🟡 PDF 문서 생성 준비 시작...');

  PDFLib.PDFDocument.create().then((pdfDoc) => {
    const page = pdfDoc.addPage([mm2pt(92), mm2pt(52)]);
    console.log('🟢 PDF 페이지 추가 완료');

    opentype.load('./fonts/KBFGDisplayM.otf', function (err, font) {
      if (err) {
        console.error('❌ 폰트 로딩 실패:', err);
        return;
      }
      console.log('✅ 폰트 로딩 성공:', font.names.fullName.en);

      const mergedPath = new opentype.Path();
      let x = 0;

      for (let i = 0; i < korName.length; i++) {
        const char = korName[i];
        const glyph = font.charToGlyph(char);
        const glyphPath = glyph.getPath(x, 0, fontSize);
        glyphPath.commands.forEach(cmd => mergedPath.commands.push(cmd));

        const adv = glyph.getAdvanceWidth(fontSize, { kerning: false });
        const spacing = fontSize * letterSpacingEm;
        console.log(`🔠 '${char}' advanceWidth: ${adv.toFixed(2)} pt, spacing: ${spacing.toFixed(2)} pt`);
        x += adv + spacing;
      }

      const svgPath = mergedPath.toPathData();
      console.log('🧵 SVG pathData (partial):', svgPath.slice(0, 100), '...');
      console.log(`📍 출력 위치: x=${nameX.toFixed(2)}pt, y=${nameBaselineY.toFixed(2)}pt`);

      page.drawSvgPath(svgPath, {
        x: nameX,
        y: nameBaselineY,
        color: PDFLib.rgb(0.298, 0.251, 0.204), // 대략 #4C4034
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
