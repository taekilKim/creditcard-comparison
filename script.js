document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  console.clear();
  console.group("🖨️ 이름 PDF 생성");

  const data = Object.fromEntries(new FormData(e.target));
  console.log("1) 입력 데이터:", data);

  const mm2pt = mm => mm * 2.8346;
  const pageWidth = mm2pt(92);
  const pageHeight = mm2pt(52);
  const safeOffsetY = mm2pt(52);  // opentype.js 좌표계는 좌상단 0, PDF-lib은 좌하단 0

  const pdfDoc = await PDFLib.PDFDocument.create();
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // 폰트 로드
  const fontBuffer = await fetch('/fonts/KBFGDisplayM.otf').then(res => res.arrayBuffer());
  const font = opentype.parse(fontBuffer);
  console.log("2) 폰트 이름:", font.names.fullName?.en, "unitsPerEm:", font.unitsPerEm);

  // 스타일 정의
  const fontSize = 13;
  const letterSpacing = 0.3;
  const color = PDFLib.cmyk(0, 0.1, 0.2, 0.65); // Pantone 404C

  // 좌하단 기준 위치
  const baseX = mm2pt(19.034);
  const baseY = mm2pt(27.212);

  // 텍스트 렌더링
  const glyphs = font.stringToGlyphs(data.kor_name || "홍길동");
  let cursorX = baseX;
  const y = baseY;

  let pathData = '';
  glyphs.forEach((g, i) => {
    const p = g.getPath(cursorX, safeOffsetY - y, fontSize); // 보정
    pathData += p.toPathData(2);
    cursorX += g.advanceWidth * (fontSize / font.unitsPerEm) + fontSize * letterSpacing;
  });

  page.drawSvgPath(pathData, {
    fillColor: color,
    borderWidth: 0, // stroke 제거
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
