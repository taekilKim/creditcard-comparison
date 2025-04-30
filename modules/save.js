export async function savePdf(pdfDoc, filename) {
  console.log('9) savePdf 시작');
  const bytes = await pdfDoc.save();
  console.log('   ↳ PDF 바이트 크기:', bytes.byteLength);

  const blob = new Blob([bytes], { type: 'application/pdf' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();

  console.log('   ↳ 다운로드 트리거 완료');
}