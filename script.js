document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  console.group('🖨️ 명함 앞면 생성');

  // 1) 입력 데이터
  const data = Object.fromEntries(new FormData(e.target));
  console.log('1) 입력값:', data);

  // 2) 템플릿 로드
  let tplBytes;
  try {
    const res = await fetch('/templates/kbfintech_template_front.pdf');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    tplBytes = await res.arrayBuffer();
    console.log('2) 템플릿 불러옴:', tplBytes.byteLength, 'bytes');
  } catch (err) {
    console.error('❌ 템플릿 로드 실패:', err);
    return;
  }

  // 3) PDFDocument 생성
  let pdfDoc;
  try {
    pdfDoc = await PDFLib.PDFDocument.load(tplBytes);
    console.log('3) PDFDocument 로드 성공');
  } catch (err) {
    console.error('❌ PDFDocument 생성 실패:', err);
    return;
  }
  const [page] = pdfDoc.getPages();

  // 4) 폰트 로드
  console.log('4) opentype.js 폰트 로드');
  const fontBuffer = await fetch('/fonts/KBFGDisplayM.otf').then(r => r.arrayBuffer());
  const font = opentype.parse(fontBuffer);
  console.log('→ unitsPerEm:', font.unitsPerEm);

  // 5) 텍스트 설정
  const mm2pt = mm => mm * 2.8346;
  const COLOR = PDFLib.cmyk(0, 0.1, 0.2, 0.65); // 404C
  const layout = {
    kor_name:  { x:19.034, y:21.843, size:13, em:0.3 },
    kor_dept:  { x:19.034, y:31.747, size: 9, em:0.0 },
    kor_title: { x:19.034, y:36.047, size: 9, em:0.0 },
    phone:     { x:19.034, y:40.000, size: 8, em:0.0 },
    email:     { x:19.034, y:44.000, size: 8, em:0.0 },
  };

  const drawText = (key, text) => {
    console.group(`🔤 ${key}: "${text}"`);
    if (!text) return console.warn('스킵됨');

    const cfg = layout[key];
    const glyphs = font.stringToGlyphs(text);
    let x = mm2pt(cfg.x);
    const y = page.getHeight() - mm2pt(cfg.y);
    let pathData = '';

    glyphs.forEach((g, i) => {
      const path = g.getPath(x, y, cfg.size);
      const d = path.toPathData(2);
      pathData += d;
      x += g.advanceWidth * (cfg.size / font.unitsPerEm) + cfg.em * cfg.size;
    });

    if (!pathData) return console.error('❌ pathData 없음');

    page.drawSvgPath(pathData, {
      fillColor: COLOR,
      borderColor: COLOR,
      borderWidth: 0.2,
    });
    console.groupEnd();
  };

  // 6) 텍스트 그리기
  drawText('kor_name',  data.kor_name);
  drawText('kor_dept',  data.kor_dept);
  drawText('kor_title', data.kor_title);
  drawText('phone',     data.phone);
  drawText('email',     `${data.email_id}@alda.ai`);

  // 7) 저장 및 다운로드
  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'namecard_front.pdf';
  a.click();
  console.log('📦 다운로드 완료');

  console.groupEnd();
});
