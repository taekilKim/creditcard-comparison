<<<<<<< Updated upstream
// script.js
// PDF-lib + fontkit UMD 환경
=======
import { loadTemplate }   from './modules/template.js';
import { loadFonts }      from './modules/fonts.js';
import { defineLayout }   from './modules/layout.js';
import { drawFront,
         drawBack }      from './modules/draw.js';
import { savePdf }        from './modules/save.js';
>>>>>>> Stashed changes

document.getElementById('infoForm').addEventListener('submit', async e => {
  e.preventDefault();
  console.group('🖨️ 명함 생성 워크플로우 시작');

  // 1) 폼 데이터
  const data = Object.fromEntries(new FormData(e.target));
  console.log('1) 폼 데이터:', data);

  // 2) 템플릿 로드
  const { pdfDoc, frontPage, backPage } = await loadTemplate('/templates/kbfintech_template.pdf');

<<<<<<< Updated upstream
  // 3) PDFDocument 생성 & fontkit 등록
  let pdfDoc;
  try {
    pdfDoc = await PDFLib.PDFDocument.load(tplBytes);
    // fontkit 이 없다는 에러 방지
    pdfDoc.registerFontkit(fontkit);
    console.log('3) PDF 로드 완료, 페이지 수:', pdfDoc.getPageCount());
    // (옵션) AcroForm 필드 평면화
    const form = pdfDoc.getForm();
    if (form) {
      form.flatten();
      console.log('   → AcroForm 평면화 완료');
    }
  } catch (err) {
    console.error('3) PDFDocument.load 실패:', err);
    console.groupEnd();
    return;
  }
  const [frontPage, backPage] = pdfDoc.getPages();

  // 4) 폰트 로드 + embedFont
  console.log('4) OTF 폰트 로드 + embed 시작');
  const loadAndEmbed = async (url, key) => {
    console.log(`  • [${key}] fetch ${url}`);
    const buf = await fetch(url)
      .then(r => r.ok ? r.arrayBuffer() : Promise.reject(r.status));
    const font = await pdfDoc.embedFont(buf, { subset: true });
    console.log(`    → [${key}] embedFont 완료, 字形 수:`, font.getCharacterSet().length);
    return font;
  };
  const embedded = {
    Display: await loadAndEmbed('/fonts/KBFGDisplayM.otf', 'Display'),
    TextB:    await loadAndEmbed('/fonts/KBFGTextB.otf',    'TextB'),
    TextL:    await loadAndEmbed('/fonts/KBFGTextL.otf',    'TextL'),
  };
  console.log('4) 모든 폰트 embed 완료');

  // 5) 레이아웃 · 스타일 정의
  console.log('5) 레이아웃 정의');
  const mm2pt = mm => mm * 2.8346;
  const COLOR_404C = PDFLib.cmyk(0,0.10,0.20,0.65);
  const layout = {
    kor_name:  { x:19.034, y:21.843, size:13, font:embedded.Display, color:COLOR_404C },
    kor_dept:  { x:19.034, y:31.747, size: 9, font:embedded.Display, color:COLOR_404C },
    kor_title: { x:19.034, y:36.047, size: 9, font:embedded.TextB,    color:COLOR_404C },
    phone:     { x:19.034, y:40.000, size: 8, font:embedded.TextL,    color:COLOR_404C },
    email:     { x:19.034, y:44.000, size: 8, font:embedded.TextL,    color:COLOR_404C },
    eng_name:  { x:19.034, y:21.843, size:13, font:embedded.Display, color:COLOR_404C },
    eng_dept:  { x:19.034, y:31.747, size: 9, font:embedded.TextB,    color:COLOR_404C },
  };
  console.table(layout);

  // 6) drawText 유틸
  function drawText(page, cfg, text, key) {
    console.group(`▶ drawText [${key}]`);
    if (!text) {
      console.warn('  (빈 문자열, 스킵)');
      console.groupEnd();
      return;
    }
    const px  = mm2pt(cfg.x);
    const py  = page.getHeight() - mm2pt(cfg.y) - cfg.size;
    console.log(`  - 위치: ${px.toFixed(1)},${py.toFixed(1)} pt, size: ${cfg.size}`);
    page.drawText(text, {
      x: px,
      y: py,
      size: cfg.size,
      font: cfg.font,
      color: cfg.color,
    });
    console.log('  - drawText 완료:', text);
    console.groupEnd();
  }

  // 7) 앞면
  console.log('7) 앞면 오버레이');
  drawText(frontPage, layout.kor_name,  data.kor_name,  'kor_name');
  drawText(frontPage, layout.kor_dept,  data.kor_dept,  'kor_dept');
  drawText(frontPage, layout.kor_title, data.kor_title, 'kor_title');
  drawText(frontPage, layout.phone,     data.phone,     'phone');
  drawText(frontPage, layout.email,     `${data.email_id}@alda.ai`, 'email');

  // 8) 뒷면
  console.log('8) 뒷면 오버레이');
  drawText(backPage, layout.eng_name, (data.eng_name||'').toUpperCase(), 'eng_name');
  const deptTitle = [data.eng_dept, data.eng_title].filter(Boolean).join(' / ');
  drawText(backPage, layout.eng_dept, deptTitle, 'eng_dept');

  // 9) 저장 & 다운로드
  console.log('9) PDF 저장 & 다운로드');
  try {
    const pdfBytes = await pdfDoc.save();
    console.log('- PDF 크기:', pdfBytes.byteLength, 'bytes');
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'namecard_final.pdf';
    a.click();
    console.log('- Download 트리거 완료');
  } catch (err) {
    console.error('9) PDF 저장 실패:', err);
  }
=======
  // 3) 폰트 로드
  const fonts = await loadFonts({
    Display: '/fonts/KBFGDisplayM.otf',
    TextB:   '/fonts/KBFGTextB.otf',
    TextL:   '/fonts/KBFGTextL.otf',
  });

  // 4) 레이아웃 정의
  const layout = defineLayout(fonts);
  console.table(layout);

  // 5) 앞/뒷면 오버레이
  drawFront(frontPage, data, layout);
  drawBack( backPage, data, layout);

  // 6) PDF 저장 & 다운로드
  await savePdf(pdfDoc, 'namecard_final.pdf');
>>>>>>> Stashed changes

  console.groupEnd();
});