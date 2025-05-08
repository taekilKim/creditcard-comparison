document.getElementById("infoForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  console.group("🖨️ 명함 생성 워크플로우 시작");

  // 1) 자동 테스트용 데이터 적용
  const data = Object.fromEntries(new FormData(e.target));
  console.log("1) 입력 데이터:", data);

  // 2) PDF 기본 설정
  const mm2pt = (mm) => mm * 2.8346;
  const pageWidth = mm2pt(92);
  const pageHeight = mm2pt(52);
  const pdfDoc = await PDFLib.PDFDocument.create();
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // 3) 폰트 로드 (Display Medium)
  const fontUrl = "/fonts/KBFGDisplayM.otf";
  const fontBuffer = await fetch(fontUrl).then((res) => res.arrayBuffer());
  const font = opentype.parse(fontBuffer);
  console.log("2) 폰트 이름:", font.names.fullName?.en);
  console.log("unitsPerEm:", font.unitsPerEm);

  // 4) 레이아웃 설정 (Y 좌표는 52mm - 일러스트 기준 Y로 보정)
  const layout = {
    kor_name: {
      x: mm2pt(19.034),
      y: mm2pt(52 - 22.025), // 좌상단 기준으로 Y 보정
      size: 13,
      letterSpacing: 0.3
    },
  };

  // 5) 텍스트 → Path → pathData 추출 함수
  function drawTextPath(page, text, cfg, label) {
    console.group(`▶ drawTextPath: ${label}`);
    const glyphs = cfg.font.stringToGlyphs(text);
    let cursorX = cfg.x;
    const y = cfg.y;
    let pathData = "";

    for (let i = 0; i < glyphs.length; i++) {
      const g = glyphs[i];
      const path = g.getPath(cursorX, y, cfg.size);
      pathData += path.toPathData(2);
      cursorX += g.advanceWidth * (cfg.size / cfg.font.unitsPerEm) + cfg.letterSpacing * cfg.size;
    }

    if (pathData) {
      page.drawSvgPath(pathData, {
        fillColor: PDFLib.rgb(0, 0, 0),
        borderWidth: 0.5,
        borderColor: PDFLib.rgb(1, 0, 0), // 임시 빨간 외곽선
      });
      console.log("✓ pathData 적용 완료");
    } else {
      console.warn("⚠️ pathData 없음");
    }
    console.groupEnd();
  }

  // 6) 폰트 config 삽입
  layout.kor_name.font = font;

  // 7) 실제 텍스트 그리기
  drawTextPath(page, data.kor_name, layout.kor_name, "kor_name");

  // 8) PDF 저장 & 다운로드
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "kor_name_test_positioned.pdf";
  a.click();

  console.groupEnd();
});
