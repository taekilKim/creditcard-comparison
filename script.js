// script.js (UMD 방식, console.log로 페이지 수 확인 포함)

document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = Object.fromEntries(new FormData(e.target));

  //
  // 1) 템플릿 PDF 불러오기 (2페이지: 앞면, 뒷면)
  //
  const tplBytes = await fetch('templates/kbfintech_template.pdf')
    .then(r => {
      if (!r.ok) throw new Error(`템플릿 로드 실패: ${r.status}`);
      return r.arrayBuffer();
    });
  const pdfDoc = await PDFLib.PDFDocument.load(tplBytes);

  // load 직후 페이지 수 확인
  console.log('PDF 페이지 수:', pdfDoc.getPages().length);

  // 페이지 배열 확보, 없으면 뒷면은 새로 추가
  const pages     = pdfDoc.getPages();
  const frontPage = pages[0];
  const backPage  = pages[1] || pdfDoc.addPage([92 * 2.8346, 52 * 2.8346]);

  //
  // 2) KBFG OTF 폰트 로드 (DisplayM, TextB, TextL)
  //
  let fontDisplay, fontTextB, fontTextL;
  try {
    fontDisplay = await new Promise((res, rej) =>
      opentype.load('fonts/KBFGDisplayM.otf', (err, f) => err ? rej(err) : res(f))
    );
    fontTextB = await new Promise((res, rej) =>
      opentype.load('fonts/KBFGTextB.otf', (err, f) => err ? rej(err) : res(f))
    );
    fontTextL = await new Promise((res, rej) =>
      opentype.load('fonts/KBFGTextL.otf', (err, f) => err ? rej(err) : res(f))
    );
  } catch (err) {
    console.error('폰트 로딩 오류:', err);
    return;
  }

  //
  // 3) CMYK 색상 정의 (Pantone 404C)
  //
  const nameColor = PDFLib.cmyk(0, 0.10, 0.20, 0.65);

  //
  // 4) 텍스트 Path 그리기 함수
  //
  function drawTextPath(page, font, text, mmX, mmY, fontSize, letterEm) {
    const x = mmX * 2.8346;
    const y = mmY * 2.8346;
    let cursor = x;
    let pathData = '';
    const glyphs = font.stringToGlyphs(text);
    for (const g of glyphs) {
      const p = g.getPath(cursor, y, fontSize);
      pathData += p.toPathData(2);
      cursor += g.advanceWidth * (fontSize / font.unitsPerEm) + letterEm * fontSize;
    }
    page.drawSvgPath(pathData, {
      color: nameColor,
      thickness: 0
    });
  }

  //
  // 5) 로고 SVG 그리기 함수
  //
  async function drawLogo(page, svgUrl, mmX, mmY, mmW, mmH) {
    const svgText = await fetch(svgUrl).then(r => {
      if (!r.ok) throw new Error(`SVG 로드 실패: ${svgUrl}`);
      return r.text();
    });
    page.drawSvgPath(svgText, {
      x:      mmX * 2.8346,
      y:      page.getHeight() - mmY * 2.8346 - mmH * 2.8346,
      width:  mmW * 2.8346,
      height: mmH * 2.8346,
    });
  }

  //
  // 6) 앞면 그리기
  //
  await drawLogo(frontPage, 'logos/front_left.svg',  7,   7,    37.155, 7);
  await drawLogo(frontPage, 'logos/front_right.svg', 69,  6,    19,     14.385);
  drawTextPath(frontPage, fontDisplay, formData.kor_name,   19.034, 21.843, 13, 0.3);
  drawTextPath(frontPage, fontTextB,   formData.kor_dept,   19.034, 31.747,  9, 0);
  drawTextPath(frontPage, fontTextB,   formData.kor_title,  19.034, 36.047,  9, 0);
  drawTextPath(frontPage, fontTextL,   formData.phone,      19.034, 40.000,  8, 0);
  drawTextPath(frontPage, fontTextL,   formData.email_id + '@alda.ai', 19.034, 44.000, 8, 0);

  //
  // 7) 뒷면 그리기
  //
  await drawLogo(backPage, 'logos/back_left.svg', 7, 7, 38.228, 5.9);
  drawTextPath(backPage, fontDisplay, formData.eng_name.toUpperCase(),                       19.034, 21.843, 13, 0.3);
  drawTextPath(backPage, fontTextB,   formData.eng_dept + ' / ' + formData.eng_title,         19.034, 31.747,  9, 0);

  //
  // 8) PDF 저장 & 다운로드
  //
  const pdfBytes = await pdfDoc.save();
  const blob     = new Blob([pdfBytes], { type: 'application/pdf' });
  const link     = document.createElement('a');
  link.href      = URL.createObjectURL(blob);
  link.download  = 'namecard_final.pdf';
  link.click();
});
