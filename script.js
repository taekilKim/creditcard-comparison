document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  console.group('🖨️ 국문 이름 테스트 시작');

  // 1. 기본 값 설정
  const name = '김태길';  // 테스트 고정값
  const fontUrl = '/fonts/KBFGDisplayM.otf';  // 정확한 파일명 확인 필요
  const mm2pt = mm => mm * 2.8346;
  const fontSize = 13;
  const letterSpacing = 0.3; // em 단위

  // 2. PDF 및 폰트 로드
  const pdfDoc = await PDFLib.PDFDocument.create();
  const page = pdfDoc.addPage([mm2pt(92), mm2pt(52)]); // 명함 사이즈

  const fontBuffer = await fetch(fontUrl).then(r => r.arrayBuffer());
  const font = opentype.parse(fontBuffer);

  // 3. 좌표 계산
  const x = mm2pt(19.034);
  const baseY = mm2pt(26.1); // 베이스라인 Y좌표 (절대값 양수로 변환)
  const y = baseY;

  // 4. 텍스트 패스 생성 및 적용
  const glyphs = font.stringToGlyphs(name);
  let cursorX = x;
  let pathData = '';

  for (const g of glyphs) {
    const p = g.getPath(cursorX, y, fontSize);
    pathData += p.toPathData(2);
    cursorX += g.advanceWidth * (fontSize / font.unitsPerEm) + (letterSpacing * fontSize);
  }

  page.drawSvgPath(pathData, {
    fillColor: PDFLib.cmyk(0, 0.10, 0.20, 0.65),
    borderWidth: 0
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "kor_name_positioned.pdf";
  a.click();

  console.groupEnd();
});
