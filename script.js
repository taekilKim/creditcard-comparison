document.getElementById("infoForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = e.target;
  const userData = Object.fromEntries(new FormData(form));

  const existingPdfBytes = await fetch("KB_PINTECH_명함_템플릿_240415_재전송.pdf").then(res => res.arrayBuffer());
  const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
  const formFields = pdfDoc.getForm();

  formFields.getTextField("KOR_NAME").setText(userData.kor_name);
  formFields.getTextField("ENG_NAME").setText(userData.eng_name);
  formFields.getTextField("KOR_DEPT").setText(userData.kor_dept);
  formFields.getTextField("ENG_DEPT").setText(userData.eng_dept);
  formFields.getTextField("KOR_TITLE").setText(userData.kor_title);
  formFields.getTextField("ENG_TITLE").setText(userData.eng_title);
  formFields.getTextField("PHONE").setText(userData.phone);
  formFields.getTextField("EMAIL_ID").setText(userData.email_id);

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "namecard_filled.pdf";
  link.click();
});
