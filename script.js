document.addEventListener("DOMContentLoaded", () => {
  // 오토필
  const autofill = {
    kor_name: "김태길",
    kor_dept: "신용대출스쿼드",
    kor_title: "팀장",
    phone: "01092141980",
    email_id: "taekil.design@gmail.com",
    eng_name: "taekil kim",
    eng_dept: "Credit Squad",
    eng_title: "Product Designer",
  };
  for (const [key, val] of Object.entries(autofill)) {
    document.querySelector(`input[name=${key}]`).value = val;
  }

  document.getElementById("infoForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const korName = form.get("kor_name");

    console.group("PDF 이름 텍스트 시작");
    console.log("이름 데이터:", korName);

    // 정확한 폰트 경로 사용
    const fontUrl = "/fonts/KBFGTextL.otf";
    const fontBuffer = await fetch(fontUrl).then((res) => res.arrayBuffer());
    const font = opentype.parse(fontBuffer);

    const pdfDoc = await PDFLib.PDFDocument.create();
    const page = pdfDoc.addPage([92, 52]); // mm 단위
    const unitsPerEm = font.unitsPerEm;

    console.log("폰트 이름:", font.names.fullName.en);
    console.log("unitsPerEm:", unitsPerEm);

    let cursorX = 19.034; // mm
    const boundingBoxTop = 22.025; // mm
    const fontSizePt = 13;
    const fontSizeMm = (fontSizePt / 72) * 25.4;
    const cursorY = 52 - boundingBoxTop; // 좌하단 기준 Y

    const scale = fontSizeMm / unitsPerEm;
    const spacing = 0.3 * unitsPerEm;

    for (let i = 0; i < korName.length; i++) {
      const glyph = font.charToGlyph(korName[i]);
      const path = glyph.getPath(0, 0, fontSizeMm);
      const pathData = path.toPathData(2);

      page.drawSvgPath(pathData, {
        x: cursorX,
        y: cursorY,
        borderWidth: 0,
        fillColor: PDFLib.cmyk(0, 0.1, 0.2, 0.65), // Pantone 404C 근사
      });

      cursorX += ((glyph.advanceWidth + spacing) * scale);
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
});
