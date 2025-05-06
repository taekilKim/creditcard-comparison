document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  console.group("🖨️ 벡터 PDF 테스트");

  const data = Object.fromEntries(new FormData(e.target));
  console.log("1) 입력 데이터:", data);

  // 2) 폰트 로드
  const fontUrl = "/fonts/KBFGTextL.otf";
  const resFont = await fetch(fontUrl);
  const fontBuffer = await resFont.arrayBuffer();
  const font = opentype.parse(fontBuffer);

  const fontName = font?.names?.fullName?.en;
  console.log("2) 폰트 로드:", fontName ?? "❌ undefined");
  console.log(" - unitsPerEm:", font.unitsPerEm);

  // 3) PDF 생성
  const pdfDoc = await PDFLib.PDFDocument.create();
  const page = pdfDoc.addPage([300, 150]);
  const height = page.getHeight();

  const drawTextPath = (text, xPt, yPt, size) => {
    const glyphs = font.stringToGlyphs(text);
    if (!glyphs.length) {
      console.warn("⚠️ 그릴 텍스트 없음:", text);
      return;
    }

    let cursorX = xPt;
    let pathData = "";
    for (let i = 0; i < glyphs.length; i++) {
      const g = glyphs[i];
      const path = g.getPath(cursorX, yPt, size);
      pathData += path.toPathData(2);
      cursorX += g.advanceWidth * (size / font.unitsPerEm);
    }

    if (!pathData) {
      console.warn("⚠️ pathData 없음:", text);
      return;
    }

    page.drawSvgPath(pathData, {
      fillColor: PDFLib.rgb(0, 0, 0),
      borderWidth: 0.3,
      borderColor: PDFLib.rgb(1, 0, 0),
    });

    console.log(`✅ drawSvgPath 완료: "${text}" at (${xPt}, ${yPt})`);
  };

  // 4) 테스트 텍스트 배치 (앞면용)
  drawTextPath(data.kor_name, 20, height - 30, 12);
  drawTextPath(data.kor_dept, 20, height - 50, 9);
  drawTextPath(data.kor_title, 20, height - 65, 9);
  drawTextPath(data.phone, 20, height - 85, 8);
  drawTextPath(`${data.email_id}@alda.ai`, 20, height - 100, 8);

  // 5) 저장 & 다운로드
  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'namecard_front_test.pdf';
  a.click();

  console.groupEnd();
});
