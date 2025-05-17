function mm2pt(mm) {
  return mm * 2.83465;
}

// ✅ SVG를 높이 기준으로 비율 유지하여 삽입
async function embedLogoSvgByHeight(page, svgUrl, x_mm, y_mm, height_mm) {
  const res = await fetch(svgUrl);
  const svgText = await res.text();
  const svgImage = await page.doc.embedSvg(svgText);

  const { width, height } = svgImage.size();
  const scale = mm2pt(height_mm) / height;

  page.drawImage(svgImage, {
    x: mm2pt(x_mm),
    y: mm2pt(y_mm),
    width: width * scale,
    height: height * scale,
  });

  console.log(`✅ SVG 임베딩 완료: ${svgUrl} @ (${x_mm}mm, ${y_mm}mm), height=${height_mm}mm`);
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

    // 문서 객체 연결 (embedSvg를 위해 필요)
    page.doc = pdfDoc;

    // ✅ 좌상단 로고 삽입 (높이 7mm 기준)
    await embedLogoSvgByHeight(page, './assets/front_left.svg', 7, 38, 7);

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
