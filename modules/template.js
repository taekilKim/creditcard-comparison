export async function loadTemplate(url) {
  console.log('2) loadTemplate 시작:', url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`템플릿 로드 실패: ${res.status}`);
  const bytes = await res.arrayBuffer();
  console.log('   ↳ 바이트 크기:', bytes.byteLength);

  const pdfDoc = await PDFLib.PDFDocument.load(bytes);
  console.log('3) PDFDocument 로드 완료, 페이지 수=', pdfDoc.getPageCount());

  // AcroForm 잠금 해제 + custom fontkit 등록
  pdfDoc.registerFontkit(fontkit);

  const [frontPage, backPage] = pdfDoc.getPages();
  return { pdfDoc, frontPage, backPage };
}