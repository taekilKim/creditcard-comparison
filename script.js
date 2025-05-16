function mm2pt(mm) {
  return mm * 2.83465;
}

// ✅ 고정 로고 삽입 함수
async function drawFixedLogo(page, svgUrl, x_mm, y_mm, width_mm) {
  const res = await fetch(svgUrl);
  const svg = await res.text();
  const match = svg.match(/<path[^>]*d="([^"]+)"[^>]*>/);
  if (!match) {
    console.error('❌ SVG path data를 찾을 수 없습니다.');
    return;
  }

  const pathData = match[1];
  page.drawSvgPath(pathData, {
    x: mm2pt(x_mm),
    y: mm2pt(y_mm),
    width: mm2pt(width_mm),
    color: PDFLib.rgb(0, 0, 0),
  });

  console.log(`✅ 로고 삽입 완료: ${svgUrl} @ (${x_mm}mm, ${y_mm}mm), width=${width_mm}mm`);
}

window.generatePDFWithKoreanName = function () {
  const form = document.getElementById('infoForm');
  const korName = form.elements['kor_name'].value.trim();
  const korDept = form.elements['kor_dept'].value.trim();
  const korTitle = form.elements['kor_title'].value.trim();

  const artboardHeight = 52; // mm
  const pageWidth = mm2pt(92);
  const pageHeight = mm2pt(artboardHeight);

  PDFLib.PDFDocument.create().then(async (pdfDoc) => {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // ✅ 로고 먼저 삽입
    await drawFixedLogo(page, './assets/front_left.svg', 7, 14, 37.155);

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
      let x1 = 0;
      for (const char of korName) {
        const glyph = font.charToGlyph(char);
        const path = glyph.getPath(x1, 0, nameFontSize);
        path.commands.forEach(cmd => namePath.commands.push(cmd));
        const adv = glyph.advanceWidth / font.unitsPerEm * nameFontSize;
        x1 += adv + nameLetterSpacing;
      }

      page.drawSvgPath(namePath.toPathData(), {
        x: nameX,
        y: nameY,
        color: PDFLib.rgb(0.349, 0.314, 0.278),
      });

      // ▷ 국문 소속 및 직함
      const subFontSize = 9;
      const subX = mm2pt(19.057);
      const subBaseline = 30.839;
      const subY = mm2pt(artboardHeight - subBaseline);

      let korDeptOrTitle = '';
      if (korDept && korTitle) {
        korDeptOrTitle = `${korDept} | ${korTitle}`;
      } else if (korDept) {
        korDeptOrTitle = korDept;
      } else if (korTitle) {
        korDeptOrTitle = korTitle;
      }

      if (korDeptOrTitle) {
        const subPath = new opentype.Path();
        let x2 = 0;
        for (const char of korDeptOrTitle) {
          const glyph = font.charToGlyph(char);
          const path = glyph.getPath(x2, 0, subFontSize);
          path.commands.forEach(cmd => subPath.commands.push(cmd));
          const adv = glyph.advanceWidth / font.unitsPerEm * subFontSize;
          x2 += adv;
        }

        page.drawSvgPath(subPath.toPathData(), {
          x: subX,
          y: subY,
          color: PDFLib.rgb(0.349, 0.314, 0.278),
        });
      }

      // ✅ PDF 저장
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
