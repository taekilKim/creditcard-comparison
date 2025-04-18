document.getElementById("infoForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formElement = e.target;
  const userData = Object.fromEntries(new FormData(formElement));

  const existingPdfBytes = await fetch("kbfintech_template.pdf").then(res => res.arrayBuffer());
  const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);

  const form = pdfDoc.getForm();

  // 👇 이 부분 추가: PDF에 텍스트 필드 모양 생성
  form.updateFieldAppearances(PDFLib.StandardFonts.Helvetica);

  form.getTextField("KOR_NAME").setText(userData.kor_name);
  form.getTextField("ENG_NAME").setText(userData.eng_name);
  form.getTextField("KOR_DEPT").setText(userData.kor_dept);
  form.getTextField("ENG_DEPT").setText(userData.eng_dept);
  form.getTextField("KOR_TITLE").setText(userData.kor_title);
  form.getTextField("ENG_TITLE").setText(userData.eng_title);
  form.getTextField("PHONE").setText(userData.phone);
  form.getTextField("EMAIL_ID").setText(userData.email_id);

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "namecard_filled.pdf";
  link.click();
});
