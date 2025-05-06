// PDF-lib + opentype.js 단일 glyph 렌더 테스트
document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = "a";
  const fontUrl = "/fonts/KBFGTextL.otf";

  console.group('Glyph Path PDF 테스트');

  const resFont = await fetch(fontUrl);
  const fontBuffer = await resFont.arrayBuffer();
  const font = opentype.parse(fontBuffer);

  console.log("폰트 로드:", font.names?.fullName?.en || "❌ undefined");
  console.log("unitsPerEm:", font.unitsPerEm);

  const glyph = font.charToGlyph(text);
  const path = glyph.getPath(100, 500, 100);  // (x, y, fontSize)
  const bbox = path.getBoundingBox();

  console.log("→ glyph advanceWidth:", glyph.advanceWidth);
  console.log("→ bbox:", bbox);
  console.log("→ path commands:", path.commands.length);

  const pdfDoc = await PDFLib.PDFDocument.create();
  const page = pdfDoc.addPage([300, 600]);

  const pathData = path.toPathData(2);
  console.log("→ pathData 길이:", pathData.length);

  page.drawSvgPath(pathData, {
    borderWidth: 0.5,
    borderColor: PDFLib.rgb(1, 0, 0),
    fillColor: PDFLib.rgb(0, 0, 0),
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "glyph_test_single.pdf";
  a.click();

  console.groupEnd();
});
