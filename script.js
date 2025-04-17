opentype.load('fonts/KBFGDisplayM.otf', function(err, font) {
  if (err) {
    console.error('폰트 로딩 오류:', err);
  } else {
    console.log('폰트 로드 성공:', font.names.fullName.en);
  }
});

document.getElementById('generate').addEventListener('click', async () => {
  const name = document.getElementById('name').value;
  const org = document.getElementById('org').value;
  const phone = document.getElementById('phone').value;
  const email = document.getElementById('email').value;

  const { PDFDocument } = PDFLib;
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([260.63, 147.4]); // 92mm x 52mm

  // ✅ public/fonts 경로 기준으로 폰트 불러오기
  const fontDisplay = await opentype.load('fonts/KBFGDisplayM.otf');
  const fontBold = await opentype.load('fonts/KBFGTextB.otf');
  const fontLight = await opentype.load('fonts/KBFGTextL.otf');

  // 텍스트 -> path 변환 함수
  const drawText = (text, font, x, y, size) => {
    const path = font.getPath(text, x, y, size);
    const cmds = path.toPathData(2);
    return `q 0 0 0 rg\n${cmds}\nQ`;
  };

  // 각 항목 좌표 및 스타일 설정
  const paths = [
    drawText(name, fontDisplay, 54, 100, 13),     // 이름
    drawText(org, fontBold, 54, 85, 9),           // 소속
    drawText(phone, fontLight, 54, 70, 8),        // 연락처
    drawText(email, fontLight, 54, 60, 8)         // 이메일
  ];

  // PDF에 path 삽입
  const all = paths.join('\n');
  const stream = pdfDoc.register(await pdfDoc.context.streamFromString(all));
  page.node.addContentStream(stream);

  // PDF 다운로드
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'namecard.pdf';
  link.click();
});
