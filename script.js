// script.js (PDF-lib + UMD 환경)
// <!DOCTYPE html> 쪽에는 PDF-lib 만 남기고 opentype.js 스크립트는 삭제하세요.

document.getElementById('infoForm').addEventListener('submit', async e => {
  e.preventDefault();

  console.group('📇 명함 생성 시작');
  const data = Object.fromEntries(new FormData(e.target));
  console.log('폼 데이터:', data);

  // 1) 템플릿 로드
  const tplRes = await fetch('/templates/kbfintech_template.pdf');
  const tplBytes = await tplRes.arrayBuffer();
  console.log('템플릿 로드:', tplBytes.byteLength, 'bytes');

  // 2) PDFDocument
  const pdfDoc = await PDFLib.PDFDocument.load(tplBytes);
  console.log('PDF 로드 완료, 페이지 수:', pdfDoc.getPageCount());
  const [front, back] = pdfDoc.getPages();

  // 3) 폰트 임베드
  console.log('폰트 임베드 시작');
  const fontDisplay = await pdfDoc.embedFont(
    await fetch('/fonts/KBFGDisplayM.otf').then(r => r.arrayBuffer())
  );
  const fontTextB = await pdfDoc.embedFont(
    await fetch('/fonts/KBFGTextB.otf').then(r => r.arrayBuffer())
  );
  const fontTextL = await pdfDoc.embedFont(
    await fetch('/fonts/KBFGTextL.otf').then(r => r.arrayBuffer())
  );
  console.log('폰트 임베드 완료');

  // 4) 레이아웃 & 스타일 정의
  const toPt = mm => mm * 2.8346;
  const COLOR = PDFLib.cmyk(0,0.10,0.20,0.65);
  const layout = {
    kor_name:  { x:19.034, y:21.843, size:13,  font:fontDisplay },
    kor_dept:  { x:19.034, y:31.747, size:9,   font:fontDisplay },
    kor_title: { x:19.034, y:36.047, size:9,   font:fontTextB },
    phone:     { x:19.034, y:40.000, size:8,   font:fontTextL },
    email:     { x:19.034, y:44.000, size:8,   font:fontTextL },
    eng_name:  { x:19.034, y:21.843, size:13,  font:fontDisplay },
    eng_dept:  { x:19.034, y:31.747, size:9,   font:fontTextB },
  };
  console.table(layout);

  // 5) drawText 유틸
  function drawField(page, key, text) {
    const cfg = layout[key];
    if (!text) return;
    const x = toPt(cfg.x);
    const y = page.getHeight() - toPt(cfg.y);
    page.drawText(text, {
      x, y,
      size: cfg.size,
      font: cfg.font,
      color: COLOR,
      letterSpacing: key.endsWith('name') ? cfg.size * 0.3 : 0,
    });
    console.log(`  • ${key} 그리기: "${text}" @ (${cfg.x},${cfg.y})`);
  }

  // 6) 앞면
  console.log('앞면 채우기');
  drawField(front, 'kor_name',  data.kor_name);
  drawField(front, 'kor_dept',  data.kor_dept);
  drawField(front, 'kor_title', data.kor_title);
  drawField(front, 'phone',     data.phone);
  drawField(front, 'email',     `${data.email_id}@alda.ai`);

  // 7) 뒷면
  console.log('뒷면 채우기');
  drawField(back, 'eng_name', data.eng_name.toUpperCase());
  const dt = [data.eng_dept, data.eng_title].filter(Boolean).join(' / ');
  drawField(back, 'eng_dept', dt);

  // 8) 저장 & 다운로드
  console.log('PDF 저장 중...');
  const outBytes = await pdfDoc.save();
  console.log('완료, 크기:', outBytes.byteLength, 'bytes');
  const blob = new Blob([outBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'namecard_final.pdf';
  link.click();
  console.groupEnd();
});
