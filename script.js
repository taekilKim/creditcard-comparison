document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const mmToPt = (mm) => mm * 2.83465; // 1mm = 2.83465pt
  const formData = new FormData(e.target);
  const kor_name = formData.get('kor_name') || '김태길';

  const fontUrl = "/fonts/KBFGDisplay-Medium.otf";
  const fontBuffer = await fetch(fontUrl).then(res => res.arrayBuffer());
  const font = opentype.parse(fontBuffer);

  const fontSize = 13 * 1.333; // pt to px (optional), PDF-lib interprets in pt
  const unitsPerEm = font.unitsPerEm;
  const spacing = 0.3 * unitsPerEm; // letter-spacing in em
  const nameX = mmToPt(19.034);
  const nameY = mmToPt(52 - 22.025); // PDF-lib Y=0 is bottom-left

  const glyphs = font.stringToGlyphs(kor_name);
  const path = new opentype.Path();
  let offsetX = 0;

  for (const glyph of glyphs) {
    const gPath = glyph.getPath(offsetX, 0, fontSize);
    gPath.commands.forEach(cmd => path.commands.push(cmd));
    offsetX += (glyph.advanceWidth + spacing) * (fontSize / unitsPerEm);
  }

  const pdfDoc = await PDFLib.PDFDocument.create();
  const page = pdfDoc.addPage([mmToPt(92), mmToPt(52)]);
  const pathData = path.toPathData(2);

  page.drawSvgPath(pathData, {
    x: nameX,
    y: nameY,
    borderColor: PDFLib.rgb(1, 0, 0),
    borderWidth: 0.5,
    color: PDFLib.rgb(0, 0, 0), // fill
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "kor_name_test_positioned.pdf";
  a.click();
});
