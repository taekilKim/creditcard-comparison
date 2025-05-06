document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = document.getElementById('kor_name').value;
  const fontUrl = '/fonts/KBFGTextL.otf';

  // mm to pt 변환 함수
  const mm2pt = mm => mm * 2.83465;

  // 좌표 입력 (바운딩박스 좌상단 기준)
  const x_mm = 19.034;
  const y_mm = 22.025;

  // PDF 크기: 92 x 52 mm
  const pdfWidth = mm2pt(92);   // 260.55pt
  const pdfHeight = mm2pt(52);  // 147.38pt

  const fontSize = 13; // pt

  const resFont = await fetch(fontUrl);
  const fontBuffer = await resFont.arrayBuffer();
  const font = opentype.parse(fontBuffer);

  const glyph = font.charToGlyph(text);
  const path = glyph.getPath(mm2pt(x_mm), pdfHeight - mm2pt(y_mm), fontSize);
  const pathData = path.toPathData(2);

  const pdfDoc = await PDFLib.PDFDocument.create();
  const page = pdfDoc.addPage([pdfWidth, pdfHeight]);

  page.drawSvgPath(pathData, {
    borderWidth: 0.3,
    borderColor: PDFLib.rgb(1, 0, 0),
    fillColor: PDFLib.rgb(0, 0, 0),  // 검정색 필 적용
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'namecard_kor_name_test.pdf';
  a.click();
});
