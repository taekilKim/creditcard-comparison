document.addEventListener("DOMContentLoaded", () => {
  // Autofill for development
  document.querySelector('input[name="kor_name"]').value = "김태길";
  document.querySelector('input[name="kor_dept"]').value = "신용대출스쿼드";
  document.querySelector('input[name="kor_title"]').value = "팀장";
  document.querySelector('input[name="phone"]').value = "01092141980";
  document.querySelector('input[name="email_id"]').value = "taekil.design@gmail.com";
  document.querySelector('input[name="eng_name"]').value = "taekil kim";
  document.querySelector('input[name="eng_dept"]').value = "Credit Squad";
  document.querySelector('input[name="eng_title"]').value = "Product Designer";
});

document.getElementById("infoForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const korName = document.querySelector('input[name="kor_name"]').value;
  console.group("PDF 이름 텍스트 시작");
  console.log("이름 데이터:", korName);

  const fontUrl = "/fonts/KBFGTextL.otf"; // 정확한 경로
  const fontBuffer = await fetch(fontUrl).then(res => res.arrayBuffer());
  const font = opentype.parse(fontBuffer);

  console.log("폰트 OTF:", font.names.fullName?.en || "❌");
  console.log("unitsPerEm:", font.unitsPerEm);

  const fontSize = 13.5; // pt 기준
  const letterSpacingEm = 0.3;
  const pageWidth = 92 * 2.83465; // mm to pt
  const pageHeight = 52 * 2.83465;

  const startXmm = 19.034;
  const startYmm = 22.025;
  let x = startXmm * 2.83465;
  const y = pageHeight - (startYmm * 2.83465); // Illustrator 좌상단 기준

  const pdfDoc = await PDFLib.PDFDocument.create();
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // fill color: CMYK C0 M10 Y20 K65 → RGB 변환 (대략 #5a5753)
  const fillColor = PDFLib.rgb(0.353, 0.341, 0.325);

  for (let i = 0; i < korName.length; i++) {
    const glyph = font.charToGlyph(korName[i]);
    const glyphPath = glyph.getPath(x, y, fontSize);
    const svgPath = glyphPath.toPathData(2);
    page.drawSvgPath(svgPath, {
      fillColor,
      borderWidth: 0, // no stroke
    });

    const advance = glyph.advanceWidth * (fontSize / font.unitsPerEm);
    x += advance + (letterSpacingEm * fontSize); // tracking 적용
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "kor_name_test_positioned.pdf";
  a.click();

  console.groupEnd();
});
