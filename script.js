document.getElementById('generate').addEventListener('click', async () => {
  const name = document.getElementById('name').value;
  const org = document.getElementById('org').value;
  const phone = document.getElementById('phone').value;
  const email = document.getElementById('email').value;

  const { PDFDocument } = PDFLib;
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([260.63, 147.4]);

  const fontDisplay = await opentype.load('KBFGDisplayM.otf');
  const fontBold = await opentype.load('KBFGTextB.otf');
  const fontLight = await opentype.load('KBFGTextL.otf');

  const drawText = (text, font, x, y, size) => {
    const path = font.getPath(text, x, y, size);
    const cmds = path.toPathData(2);
    return `q 0 0 0 rg
${cmds}
Q`;
  };

  const paths = [
    drawText(name, fontDisplay, 54, 100, 13),
    drawText(org, fontBold, 54, 85, 9),
    drawText(phone, fontLight, 54, 70, 8),
    drawText(email, fontLight, 54, 60, 8),
  ];

  const all = paths.join('\n');
  const stream = pdfDoc.register(await pdfDoc.context.streamFromString(all));
  page.node.addContentStream(stream);

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'namecard.pdf';
  link.click();
});
