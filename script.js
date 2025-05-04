document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  console.group('🖨️ 앞면 명함 생성');

  const data = Object.fromEntries(new FormData(e.target));
  console.log('1) 폼 데이터:', data);

  // 2) 폰트 로드 (Pretendard로 예시)
  console.log('2) 폰트 로드 시작');
  const loadFont = async (url) => {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    return opentype.parse(buffer);
  };
  const font = await loadFont('/fonts/Pretendard-Regular.otf');
  console.log('2) 폰트 로드 완료:', font.familyName);

  // 3) PDF 생성 및 페이지 추가
  const pdfDoc = await PDFLib.PDFDocument.create();
  const page = pdfDoc.addPage([250, 150]); // mm로 치면 약 88x53mm

  const mm2pt = mm => mm * 2.8346;
  const drawTextPath = (text, x, y, size) => {
    const glyphs = font.stringToGlyphs(text);
    let cursorX = mm2pt(x);
    const ptY = page.getHeight() - mm2pt(y);
    let pathData = '';

    glyphs.forEach((g, i) => {
      const path = g.getPath(cursorX, ptY, size);
      pathData += path.toPathData(2);
      cursorX += g.advanceWidth * (size / font.unitsPerEm);
    });

    page.drawSvgPath(pathData, {
      fillColor: PDFLib.rgb(0, 0, 0),        // 검정색 채움
      borderColor: PDFLib.rgb(1, 0, 0),     // 빨간 외곽선
      borderWidth: 0.2,
    });
  };

  console.log('3) 텍스트 그리기 시작');
  drawTextPath(data.kor_name || '홍길동', 19, 21.8, 13);
  drawTextPath(data.kor_dept || '마케팅팀', 19, 31.7, 9);
  drawTextPath(data.kor_title || '책임매니저', 19, 36.0, 9);
  drawTextPath(data.phone || '010-1234-5678', 19, 40.0, 8);
  drawTextPath(`${data.email_id || 'hong'}@alda.ai`, 19, 44.0, 8);

  // 4) 저장 & 다운로드
  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'namecard_front.pdf';
  a.click();

  console.log('✓ PDF 다운로드 완료');
  console.groupEnd();
});
