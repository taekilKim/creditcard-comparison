// script.js (UMD 방식)
document
  .getElementById('infoForm')
  .addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(e.target));

    // 1) 템플릿 PDF 로드 (2페이지: 앞, 뒤)
    const tplBytes = await fetch('templates/kbfintech_template.pdf')
      .then((r) => r.arrayBuffer());
    const pdfDoc = await PDFLib.PDFDocument.load(tplBytes);
    const [frontPage, backPage] = pdfDoc.getPages();

    // 2) KBFGDisplayM 폰트 로드
    const font = await new Promise((res, rej) =>
      opentype.load('fonts/KBFGDisplayM.ttf', (err, f) =>
        err ? rej(err) : res(f)
      )
    );

    // 3) CMYK 색상 (Pantone 404C)
    const nameColor = pdfDoc.context.obj({
      Type: 'ColorSpace',
      base: 'DeviceCMYK',
      values: [0, 0.10, 0.20, 0.65],
    });

    // 4) 텍스트 Path 그리기 함수
    function drawTextPath(page, text, mmX, mmY, fontSize, letterEm) {
      const x = mmX * 2.8346;
      // PDF-lib y축 원점이 아래쪽이므로, mmY 기준을 그대로 사용
      const y = mmY * 2.8346;
      let cursor = x;
      let pathData = '';
      const glyphs = font.stringToGlyphs(text);
      for (const g of glyphs) {
        const p = g.getPath(cursor, y, fontSize);
        pathData += p.toPathData(2);
        cursor +=
          g.advanceWidth * (fontSize / font.unitsPerEm) +
          letterEm * fontSize;
      }
      page.drawSvgPath(pathData, { color: nameColor });
    }

    // 5) 로고 SVG 삽입 함수
    async function drawLogo(page, svgUrl, mmX, mmY, mmW, mmH) {
      const svgText = await fetch(svgUrl).then((r) => r.text());
      page.drawSvgPath(svgText, {
        x: mmX * 2.8346,
        // PDF-lib y좌표는 아래가 0이므로, offset = 페이지높이 - mmY
        y:
          page.getHeight() -
          mmY * 2.8346 -
          mmH * 2.8346,
        width: mmW * 2.8346,
        height: mmH * 2.8346,
      });
    }

    // 6) 앞면 그리기
    await drawLogo(frontPage, 'logos/front_left.svg', 7, 7, 37.155, 7);
    await drawLogo(frontPage, 'logos/front_right.svg', 69, 6, 19, 14.385);
    drawTextPath(
      frontPage,
      formData.kor_name,
      19.034,
      21.843,
      13,
      0.3
    );
    drawTextPath(
      frontPage,
      formData.kor_dept,
      19.034,
      31.747,
      9,
      0
    );
    drawTextPath(
      frontPage,
      formData.kor_title,
      19.034,
      36.047,
      9,
      0
    );
    drawTextPath(
      frontPage,
      formData.phone,
      19.034,
      40.0,
      8,
      0
    );
    drawTextPath(
      frontPage,
      formData.email_id + '@alda.ai',
      19.034,
      44.0,
      8,
      0
    );

    // 7) 뒷면 그리기
    await drawLogo(backPage, 'logos/back_left.svg', 7, 7, 38.228, 5.9);
    drawTextPath(
      backPage,
      formData.eng_name.toUpperCase(),
      19.034,
      21.843,
      13,
      0.3
    );
    drawTextPath(
      backPage,
      formData.eng_dept + ' / ' + formData.eng_title,
      19.034,
      31.747,
      9,
      0
    );

    // 8) PDF 저장 & 다운로드
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], {
      type: 'application/pdf',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'namecard_final.pdf';
    link.click();
  });
