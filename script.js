document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  console.group('🖨️ 명함 생성 시작');

  // 1) 폼 데이터
  const data = Object.fromEntries(new FormData(e.target));
  console.log('1) 입력값:', data);

  // 2) 템플릿 로드
  const tplBytes = await fetch('/templates/kbfintech_template.pdf').then(r => r.arrayBuffer());
  const pdfDoc = await PDFLib.PDFDocument.load(tplBytes);
  console.log('2) 템플릿 로드 완료, 페이지 수:', pdfDoc.getPageCount());
  const [frontPage, backPage] = pdfDoc.getPages();

  // 3) fontkit 등록
  pdfDoc.registerFontkit(fontkit);
  console.log('3) fontkit 등록 완료');

  // 4) 폰트 로드 및 임베드
  const loadFont = async (name, path) => {
    const buf = await fetch(path).then(r => r.arrayBuffer());
    return await pdfDoc.embedFont(buf, { subset: true });
  };
  const fontDisplay = await loadFont('Display', '/fonts/KBFGDisplayM.otf');
  const fontTextB = await loadFont('TextB', '/fonts/KBFGTextB.otf');
  const fontTextL = await loadFont('TextL', '/fonts/KBFGTextL.otf');
  console.log('4) 폰트 로드 완료');

  // 5) 색상 및 레이아웃
  const mm2pt = mm => mm * 2.8346;
  const color404C = PDFLib.cmyk(0, 0.1, 0.2, 0.65);
  const layout = {
    kor_name:  { x:19.034, y:21.843, size:13, font:fontDisplay },
    kor_dept:  { x:19.034, y:31.747, size: 9, font:fontDisplay },
    kor_title: { x:19.034, y:36.047, size: 9, font:fontTextB },
    phone:     { x:19.034, y:40.000, size: 8, font:fontTextL },
    email:     { x:19.034, y:44.000, size: 8, font:fontTextL },
    eng_name:  { x:19.034, y:21.843, size:13, font:fontDisplay },
    eng_dept:  { x:19.034, y:31.747, size: 9, font:fontTextB },
  };
  console.table(layout);

  // 6) 텍스트 그리기 함수
  function drawText(page, key, text) {
    const { x, y, size, font } = layout[key];
    const ptX = mm2pt(x);
    const ptY = page.getHeight() - mm2pt(y);
    console.log(`▶ drawText "${key}" @ (${ptX.toFixed(2)}, ${ptY.toFixed(2)}) = "${text}"`);
    page.drawText(text, {
      x: ptX, y: ptY,
      font: font,
      size: size,
      color: color404C,
    });
  }

  // 7) 앞면 텍스트
  drawText(frontPage, 'kor_name',  data.kor_name);
  drawText(frontPage, 'kor_dept',  data.kor_dept);
  drawText(frontPage, 'kor_title', data.kor_title);
  drawText(frontPage, 'phone',     data.phone);
  drawText(frontPage, 'email',     `${data.email_id}@alda.ai`);

  // 8) 뒷면 텍스트
  drawText(backPage, 'eng_name',  data.eng_name.toUpperCase());
  const dt = [data.eng_dept, data.eng_title].filter(Boolean).join(' / ');
  drawText(backPage, 'eng_dept', dt);

  // 9) 저장 및 다운로드
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'namecard_final.pdf';
  a.click();
  console.log('9) PDF 다운로드 완료');

  console.groupEnd();
});
