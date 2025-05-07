document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  console.group("🖨️ PDF 이름 테스트 시작");

  const formData = Object.fromEntries(new FormData(e.target));
  const name = formData.kor_name;
  console.log("이름 데이터:", name);

  const fontUrl = "/fonts/KBFGDisplayM.otf";
  const resFont = await fetch(fontUrl);
  const fontBuffer = await resFont.arrayBuffer();
  const font = opentype.parse(fontBuffer);

  console.log("폰트 이름:", font.names?.fullName?.en || "(없음)");
  console.log("unitsPerEm:", font.unitsPerEm);

  // PDF 페이지 크기 (92mm x 52mm)
  const mm2pt = mm => mm * 2.8346;
  const pageWidth = mm2pt(92);
  const pageHeight = mm2pt(52);

  const pdfDoc = await PDFLib.PDFDocument.create();
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // 국문 이름 설정
  const cfg = {
    x: mm2pt(19.034),
    y: mm2pt(22.025),
    size: 13,
    em: 0.3,
    color: PDFLib.cmyk(0, 0.10, 0.20, 0.65),
    font: font
  };

  const glyphs = font.stringToGlyphs(name);
  let cursorX = cfg.x;
  const y = pageHeight - cfg.y;
  let pathData = "";

  glyphs.forEach((g, i) => {
    const p = g.getPath(cursorX, y, cfg.size);
    const d = p.toPathData(2);
    pathData += d;
    cursorX += g.advanceWidth * (cfg.size / cfg.font.unitsPerEm) + cfg.em * cfg.size;
  });

  if (!pathData) {
    console.error("pathData가 비어 있음!");
    return;
  }

  page.drawSvgPath(pathData, {
    fillColor: cfg.color,
    borderColor: undefined,
    borderWidth: 0,
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "kor_name_test.pdf";
  a.click();

  console.groupEnd();
});
