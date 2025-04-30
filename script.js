// script.js

// 1) 폼 제출 이벤트 등록
document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  console.log('--- 명함 생성 워크플로우 시작 ---');

  // 2) 폼 데이터 읽기
  const formData = Object.fromEntries(new FormData(e.target));
  console.log('1) 폼 데이터:', formData);

  // 3) 템플릿 PDF 로드
  console.log('2) 템플릿 PDF 로드 시작 → templates/kbfintech_template.pdf');
  const tplBytes = await fetch('templates/kbfintech_template.pdf').then(r => r.arrayBuffer());
  console.log('   • 템플릿 로드 완료, 바이트 수:', tplBytes.byteLength);

  // 4) PDFDocument 생성
  const { PDFDocument } = PDFLib;
  const pdfDoc = await PDFDocument.load(tplBytes);
  const pages = pdfDoc.getPages();
  console.log('3) PDFDocument 생성 완료, 페이지 수:', pages.length);
  const frontPage = pages[0], backPage = pages[1];

  // 5) opentype.js 로 OTF 폰트 로드
  console.log('4) opentype.js 폰트 로드 시작');
  const loadFont = (url, name) =>
    new Promise((res, rej) =>
      opentype.load(url, (err, f) => {
        if (err) {
          console.error(`   ✗ ${name} 로드 실패:`, err);
          rej(err);
        } else {
          console.log(`   ✓ ${name} 로드 완료 (unitsPerEm=${f.unitsPerEm})`);
          res(f);
        }
      })
    );
  const fontDisp = await loadFont('fonts/KBFGDisplayM.otf', 'KBFGDisplayM.otf');
  const fontTextB = await loadFont('fonts/KBFGTextB.otf', 'KBFGTextB.otf');
  const fontTextL = await loadFont('fonts/KBFGTextL.otf', 'KBFGTextL.otf');
  console.log('4) 모든 폰트 로드 완료');

  // 6) CMYK 색상 정의 (Pantone 404C)
  const cmyk404 = pdfDoc.context.obj({
    Type: 'ColorSpace',
    base: 'DeviceCMYK',
    values: [0, 0.10, 0.20, 0.65],
  });
  console.log('5) CMYK 색상 정의 완료 (Pantone 404C)');

  // 7) 텍스트를 Path로 그리기
  function drawTextPath(page, text, mmX, mmY, ptSize, letterEm, font) {
    console.group(`drawTextPath [${text}]`);
    const scale = 2.8346; // mm → pt
    const x0 = mmX * scale;
    const y0 = page.getHeight() - mmY * scale;
    console.log('  - 위치(mm→pt):', mmX, mmY, '→', x0.toFixed(2), y0.toFixed(2));
    console.log('  - 폰트:', font.names.fullName.en, 'ptSize:', ptSize, 'letterEm:', letterEm);

    let cursor = x0, pathData = '';
    const glyphs = font.stringToGlyphs(text);
    for (const g of glyphs) {
      const p = g.getPath(cursor, y0, ptSize);
      pathData += p.toPathData(2);
      cursor += g.advanceWidth * (ptSize / font.unitsPerEm) + letterEm * ptSize;
    }
    console.log('  - pathData length:', pathData.length);

    page.drawSvgPath(pathData, { color: cmyk404 });
    console.groupEnd();
  }

  // 8) SVG 로고 삽입
  async function drawLogo(page, url, mmX, mmY, mmW, mmH) {
    console.log(`drawLogo [${url}] 시작`);
    const svg = await fetch(url).then(r => r.text());
    const s = 2.8346;
    page.drawSvgPath(svg, {
      x: mmX * s,
      y: page.getHeight() - (mmY + mmH) * s,
      width: mmW * s,
      height: mmH * s,
    });
    console.log(`  - 삽입: ${mmX}×${mmY}, size ${mmW}×${mmH} mm`);
  }

  // 9) 앞면 그리기
  console.log('8) 앞면 그리기 시작');
  await drawLogo(frontPage, 'logos/front_left.svg', 7, 7, 37.155, 7);
  await drawLogo(frontPage, 'logos/front_right.svg', 69, 6, 19, 14.385);
  drawTextPath(frontPage, formData.kor_name, 19.034, 21.843, 13, 0.3, fontDisp);
  drawTextPath(frontPage, formData.kor_dept, 19.034, 31.747, 9, 0, fontDisp);
  if (formData.kor_title) drawTextPath(frontPage, formData.kor_title, 19.034, 36.047, 9, 0, fontDisp);
  drawTextPath(frontPage, formData.phone, 19.034, 40, 8, 0, fontTextB);
  drawTextPath(frontPage, `${formData.email_id}@alda.ai`, 19.034, 44, 8, 0, fontTextB);
  console.log('8) 앞면 그리기 완료');

  // 10) 뒷면 그리기
  console.log('9) 뒷면 그리기 시작');
  await drawLogo(backPage, 'logos/back_left.svg', 7, 7, 38.228, 5.9);
  drawTextPath(backPage, formData.eng_name.toUpperCase(), 19.034, 21.843, 13, 0.3, fontDisp);
  const engLine = formData.eng_dept + (formData.eng_title ? ' | ' + formData.eng_title : '');
  drawTextPath(backPage, engLine, 19.034, 31.747, 9, 0, fontDisp);
  console.log('9) 뒷면 그리기 완료');

  // 11) PDF 저장 & 다운로드
  console.log('10) PDF 저장 시작');
  const pdfBytes = await pdfDoc.save();
  console.log('   • PDF 크기:', pdfBytes.byteLength, 'bytes');
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'namecard_final.pdf';
  link.click();
  console.log('10) 다운로드 트리거 완료');
  console.log('--- 명함 생성 워크플로우 종료 ---');
});
