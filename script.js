document.addEventListener("DOMContentLoaded", () => {
  // 오토필: 테스트용 기본값
  const autofill = {
    kor_name: "김태길",
    kor_dept: "신용대출스쿼드",
    kor_title: "팀장",
    phone: "01092141980",
    email_id: "taekil.design@gmail.com",
    eng_name: "taekil kim",
    eng_dept: "Credit Squad",
    eng_title: "Product Designer"
  };
  for (const key in autofill) {
    const input = document.querySelector(`[name="${key}"]`);
    if (input) input.value = autofill[key];
  }

  document.getElementById("infoForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    console.group("📄 명함 생성 워크플로우 시작");

    // 1. 데이터
    const data = Object.fromEntries(new FormData(e.target));
    console.log("1) 입력 데이터:", data);

    // 2. PDF 생성
    const pdfDoc = await PDFLib.PDFDocument.create();
    const pageWidth = 92 * 2.8346;
    const pageHeight = 52 * 2.8346;
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    console.log("2) PDF 페이지 생성:", pageWidth, pageHeight);

    // 3. 폰트 로드
    const fontBytes = await fetch("/fonts/KBFGDisplayM.otf").then(res => res.arrayBuffer());
    const font = opentype.parse(fontBytes);
    console.log("3) 폰트 로드:", font.names.fullName?.en || "❌ unknown");
    console.log("   → unitsPerEm:", font.unitsPerEm);

    // 4. 색상 및 유틸
    const mm2pt = mm => mm * 2.8346;
    const COLOR_404C = PDFLib.cmyk(0, 0.1, 0.2, 0.65);

    // 5. 텍스트 출력 함수
    function drawText(page, text, x, y, font, fontSize, letterSpacing) {
      const glyphs = font.stringToGlyphs(text);
      let cursorX = mm2pt(x);
      const baselineY = mm2pt(y);

      let pathData = "";
      glyphs.forEach(glyph => {
        const path = glyph.getPath(cursorX, baselineY, fontSize);
        pathData += path.toPathData(2);
        cursorX += (glyph.advanceWidth || 0) * (fontSize / font.unitsPerEm) + (letterSpacing * fontSize);
      });

      page.drawSvgPath(pathData, {
        fillColor: COLOR_404C
        // strokeColor: PDFLib.rgb(1, 0, 0), // 디버깅용 스트로크
        // borderWidth: 0.3,
      });
    }

    // 6. 이름 텍스트 위치 정보
    const korNameX = 19.034;
    const korNameY = 27.212; // 좌하단 기준
    const fontSize = 13;
    const letterSpacing = 0.3; // em

    // 7. 텍스트 출력
    drawText(page, data.kor_name, korNameX, korNameY, font, fontSize, letterSpacing);

    // 8. 저장 및 다운로드
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "kor_name_positioned.pdf";
    a.click();

    console.groupEnd();
  });
});
