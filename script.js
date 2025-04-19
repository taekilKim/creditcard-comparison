document.getElementById("infoForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = e.target;
  const userData = Object.fromEntries(new FormData(form));

  // 템플릿 PDF 불러오기
  const existingPdfBytes = await fetch("kbfintech_template.pdf").then(res => res.arrayBuffer());
  const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);

  const formFields = pdfDoc.getForm();

  // 텍스트 필드에 사용자 입력값 설정
  formFields.getTextField("KOR_NAME").setText(userData.kor_name);
  formFields.getTextField("ENG_NAME").setText(userData.eng_name);
  formFields.getTextField("KOR_DEPT").setText(userData.kor_dept);
  formFields.getTextField("ENG_DEPT").setText(userData.eng_dept);
  formFields.getTextField("KOR_TITLE").setText(userData.kor_title);
  formFields.getTextField("ENG_TITLE").setText(userData.eng_title);
  formFields.getTextField("PHONE").setText(userData.phone);
  formFields.getTextField("EMAIL_ID").setText(userData.email_id);

  // PDF 저장 및 다운로드
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "namecard_filled.pdf";
  link.click();
});
