// script.js

// 👉 mm 단위를 PDF point(pt)로 변환
function mm2pt(mm) {
  return mm * 2.8346;
}

document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  console.log('▶ 명함 생성 워크플로우 시작');

  // 1) 폼 데이터 수집
  const data = Object.fromEntries(new FormData(e.target));
  console.log('1) 폼 데이터:', data);

  // 2) PDF 템플릿 로드
  const tplUrl = 'templates/kbfintech_template.pdf';
  console.log('2) 템플릿 로드 시작 →', tplUrl);
  const tplBytes = await fetch(tplUrl)
    .then(r => {
      if (!r.ok) throw new Error(`템플릿 로드 실패: ${r.status}`);
      return r.arrayBuffer();
    });
  console.log('2) 템플릿 로드 완료, 바이트 수:', tplBytes.byteLength);

  // 3) PDFDocument 생성
  const pdfDoc = await PDFLib.PDFDocument.load(tplBytes);
  console.log('3) PDFDocument 생성 완료, 페이지 수:', pdfDoc.getPageCount());
  const [frontPage, backPage] = pdfDoc.getPages();

  // ─── 디버그 #1: 내장 Helvetica 폰트 임베드 후 drawText 테스트 ───
  const helv = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
  console.log('4) 헬베티카 임베드 완료');
  // (기존 drawText 디버그 부분)
  frontPage.drawText('test print', {
    x:  mm2pt(19.034),
    y:  frontPage.getHeight() - mm2pt(21.843),
    size: 13,
    font: helv,
    color: PDFLib.cmyk(0, 0.10, 0.20, 0.65)
  });
  console.log('5) [디버그] drawText("test print") 완료');

  // 4) opentype.js 로 KBFG 폰트 로드
  const fontDisp = await new Promise((res, rej) =>
    opentype.load('fonts/KBFGDisplayM.ttf', (err, f) => err ? rej(err) : res(f))
  );
  const fontB = await new Promise((res, rej) =>
    opentype.load('fonts/KBFGTextB.ttf', (err, f) => err ? rej(err) : res(f))
  );
  const fontL = await new Promise((res, rej) =>
    opentype.load('fonts/KBFGTextL.ttf', (err, f) => err ? rej(err) : res(f))
  );
  console.log('6) opentype.js 폰트 로드 완료');

  // 5) CMYK 컬러 정의
  const cmykColor = pdfDoc.context.obj({
    Type: 'ColorSpace',
    base: 'DeviceCMYK',
    values: [0, 0.10, 0.20, 0.65],
  });

  // 6) 텍스트 Path 그리기 헬퍼
  function drawTextPath(page, text, mmX, mmY, fontSize, letterEm, font) {
    const x = mm2pt(mmX);
    const y = mm2pt(mmY);
    let cursor = x;
    let pathData = '';
    const glyphs = font.stringToGlyphs(text);
    for (const g of glyphs) {
      const p = g.getPath(cursor, y, fontSize);
      pathData += p.toPathData(2);
      cursor +=
        g.advanceWidth * (fontSize / font.unitsPerEm) +
        letterEm * fontSize;
    }
    page.drawSvgPath(pathData, { color: cmykColor });
    console.log(`   • drawTextPath [${text}] @(${mmX},${mmY}) size=${fontSize} em=${letterEm}`);
  }

  // 7) 로고 SVG 삽입 헬퍼
  async function drawLogo(page, svgUrl, mmX, mmY, mmW, mmH) {
    const svgText = await fetch(svgUrl).then(r => r.text());
    page.drawSvgPath(svgText, {
      x: mm2pt(mmX),
      y: page.getHeight() - mm2pt(mmY) - mm2pt(mmH),
      width: mm2pt(mmW),
      height: mm2pt(mmH),
    });
    console.log(`   • drawLogo ${svgUrl} @(${mmX},${mmY}) ${mmW}×${mmH}`);
  }

  // ─── 8) 오버레이 시작 ───
  console.log('7) 오버레이 시작 (경로 + 로고)');

  // 앞면
  await drawLogo(frontPage, 'logos/front_left.svg', 7, 7, 37.155, 7);
  await drawLogo(frontPage, 'logos/front_right.svg', 69, 6, 19, 14.385);
  drawTextPath(frontPage, data.kor_name, 19.034, 21.843, 13, 0.3, fontDisp);
  drawTextPath(frontPage, data.kor_dept, 19.034, 31.747, 9, 0, fontDisp);
  if (data.kor_title) drawTextPath(frontPage, data.kor_title, 19.034, 36.047, 9, 0, fontB);
  drawTextPath(frontPage, data.phone, 19.034, 40.000, 8, 0, fontL);
  drawTextPath(frontPage, data.email_id + '@alda.ai', 19.034, 44.000, 8, 0, fontL);

  // 뒷면
  await drawLogo(backPage, 'logos/back_left.svg', 7, 7, 38.228, 5.9);
  drawTextPath(backPage, data.eng_name.toUpperCase(), 19.034, 21.843, 13, 0.3, fontDisp);
  drawTextPath(
    backPage,
    data.eng_dept + (data.eng_title ? ' | ' + data.eng_title : ''),
    19.034,
    31.747,
    9,
    0,
    fontB
  );

  // 9) PDF 저장 및 다운로드
  const outBytes = await pdfDoc.save();
  console.log('8) PDF 저장 완료, byteLength=', outBytes.byteLength);
  const blob = new Blob([outBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'namecard_final.pdf';
  link.click();
  console.log('9) 다운로드 트리거 완료');
  console.log('▶ 명함 생성 워크플로우 종료');
});
