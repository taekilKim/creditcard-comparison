document.addEventListener('DOMContentLoaded', () => {
  // 오토필 (테스트용)
  const autofill = {
    kor_name: "김태길",
    kor_dept: "신용대출스쿼드",
    kor_title: "팀장",
    phone: "01092141980",
    email_id: "taekil.design@gmail.com",
    eng_name: "taekil kim",
    eng_dept: "Credit Squad",
    eng_title: "Product Designer",
  };
  for (const [key, val] of Object.entries(autofill)) {
    const el = document.querySelector(`[name=${key}]`);
    if (el) el.value = val;
  }
});

document.getElementById('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  console.group("🔧 명함 생성 워크플로우 시작");

  const mm2pt = mm => mm * 2.834645669; // PDF 단위 변환

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());
  console.log("1) 폼 데이터:", data);

  // PDF 생성
  const pdfDoc = await PDFLib.PDFDocument.create();
  const pageWidth = mm2pt(92);
  const pageHeight = mm2pt(52);
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  console.log("2) 새 페이지 크기:", pageWidth, pageHeight);

  // 폰트 로드
  const fontBytes = await fetch("/fonts/KBFGDisplayM.otf").then(r => r.arrayBuffer());
  const font = opentype.parse(fontBytes);
  console.log("3) 폰트 이름:", font.names.fullName.en);
  console.log("unitsPerEm:", font.unitsPerEm);

  // 이름 위치 정보
  const layout = {
    kor_name: {
      x: mm2pt(19.034),
      y: mm2pt(52 - 22.025),  // 52mm 보정
      size: 13,
      letterSpacing: 0.3,
      color: PDFLib.cmyk(0, 0.10, 0.20, 0.65),
    }
  };

  const text = data.kor_name;
  const glyphs = font.stringToGlyphs(text);
  const scale = layout.kor_name.size / font.unitsPerEm;
  let cursorX = layout.kor_name.x;

  let pathData = "";
  for (const glyph of glyphs) {
    const path = glyph.getPath(cursorX, layout.kor_name.y, layout.kor_name.size);
    pathData += path.toPathData(2);
    cursorX += (glyph.advanceWidth * scale) + (layout.kor_name.letterSpacing * layout.kor_name.size);
  }

  page.drawSvgPath(pathData, {
    fillColor: layout.kor_name.color,
    borderWidth: 0,
  });
  console.log("✓ drawSvgPath 성공");

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "kor_name_test_positioned.pdf";
  a.click();
  console.groupEnd();
});
