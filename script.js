document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  console.group('🖨️ 명함 생성 워크플로우');

  // 1) 오토필 데이터
  const data = {
    kor_name: "홍길동"
  };
  console.log("입력 데이터:", data);

  // 2) PDF 문서 생성
  const pdfDoc = await PDFLib.PDFDocument.create();
  const pageWidth = 92 * 2.8346;
  const pageHeight = 52 * 2.8346;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // 3) 폰트 로드
  const fontBuffer = await fetch("/fonts/KBFGDisplayM.otf").then(res => res.arrayBuffer());
  const font = opentype.parse(fontBuffer);
  console.log("폰트:", font.names?.fullName?.en || "❌ undefined");

  // 4) 위치와 스타일 정의
  const mm2pt = mm => mm * 2.8346;
  const layout = {
    kor_name: {
      x: mm2pt(19.034),
      y: pageHeight - mm2pt(22.025), // Illustrator는 좌상단 기준
      size: 13,
      letterSpacing: 0.3,
      font,
      color: PDFLib.cmyk(0, 0.10, 0.20, 0.65)
    }
  };

  // 5) drawTextPath 함수
  function drawTextPath(page, cfg, text, key) {
    console.group(`📍 drawTextPath: ${key}`);
    const glyphs = cfg.font.stringToGlyphs(text);
    if (!glyphs.length) {
      console.warn("  ➤ glyph 없음, 스킵");
      console.groupEnd();
      return;
    }

    let cursorX = cfg.x;
    const y = cfg.y;
    let pathData = '';

    glyphs.forEach((g, i) => {
      const p = g.getPath(cursorX, y, cfg.size);
      pathData += p.toPathData(2);
      cursorX += g.advanceWidth * (cfg.size / cfg.font.unitsPerEm) + cfg.letterSpacing * cfg.size;
    });

    if (!pathData) {
      console.warn("  ➤ pathData 없음");
      console.groupEnd();
      return;
    }

    page.drawSvgPath(pathData, {
      fillColor: cfg.color,
      borderWidth: 0 // 스트로크 제거
    });

    console.log("✔ drawSvgPath 완료");
    console.groupEnd();
  }

  // 6) 이름 그리기
  drawTextPath(page, layout.kor_name, data.kor_name, 'kor_name');

  // 7) 저장 & 다운로드
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "namecard_front_test.pdf";
  a.click();
  console.groupEnd();
});
