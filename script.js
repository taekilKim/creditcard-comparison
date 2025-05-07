// script.js

document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  console.group('🖨️ 명함 생성 워크플로우 시작');

  const data = Object.fromEntries(new FormData(e.target));
  console.log('1) 폼 데이터:', data);

  // 템플릿 없이 빈 페이지 생성
  const pdfDoc = await PDFLib.PDFDocument.create();
  const page = pdfDoc.addPage([PDFLib.mm2pt(92), PDFLib.mm2pt(52)]); // 92x52mm 대지
  const pageHeight = page.getHeight();

  // 폰트 로드
  const fontBuffer = await fetch("/fonts/KBFGDisplayM.otf").then(res => res.arrayBuffer());
  const font = opentype.parse(fontBuffer);
  console.log("폰트 로드:", font.names.fullName?.en || "❌ undefined");

  // 컬러 정의
  const fillColor = PDFLib.cmyk(0, 0.10, 0.20, 0.65);

  // 위치 계산: 아트보드 Y가 -52mm인 상황을 보정
  const mm2pt = mm => mm * 2.8346;
  const baseY = 52; // 보정값
  const korNameLayout = {
    x: mm2pt(19.034),
    y: mm2pt(baseY - 22.025), // 보정 적용
    size: 13,
    spacingEm: 0.3
  };

  // 텍스트를 path로 렌더링
  const glyphs = font.stringToGlyphs(data.kor_name || "홍길동");
  let cursorX = korNameLayout.x;
  const pathCommands = [];

  for (let g of glyphs) {
    const path = g.getPath(cursorX, korNameLayout.y, korNameLayout.size);
    pathCommands.push(path.toPathData(2));
    cursorX += g.advanceWidth * (korNameLayout.size / font.unitsPerEm) + korNameLayout.spacingEm * korNameLayout.size;
  }

  const fullPath = pathCommands.join('');
  page.drawSvgPath(fullPath, {
    fillColor,
    borderWidth: 0
  });

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "namecard_test_front.pdf";
  a.click();

  console.groupEnd();
});
