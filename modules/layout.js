export function defineLayout(fonts) {
  const mm2pt = mm => mm * 2.8346;
  const COLOR_404C = PDFLib.cmyk(0, 0.10, 0.20, 0.65);

  return {
    kor_name:  { x:19.034, y:21.843, size:13, em:0.3, font:fonts.Display, color:COLOR_404C },
    kor_dept:  { x:19.034, y:31.747, size: 9, em:0.0, font:fonts.Display, color:COLOR_404C },
    kor_title: { x:19.034, y:36.047, size: 9, em:0.0, font:fonts.TextB,    color:COLOR_404C },
    phone:     { x:19.034, y:40.000, size: 8, em:0.0, font:fonts.TextL,    color:COLOR_404C },
    email:     { x:19.034, y:44.000, size: 8, em:0.0, font:fonts.TextL,    color:COLOR_404C },
    eng_name:  { x:19.034, y:21.843, size:13, em:0.3, font:fonts.Display, color:COLOR_404C },
    eng_dept:  { x:19.034, y:31.747, size: 9, em:0.0, font:fonts.TextB,    color:COLOR_404C },
  };
}