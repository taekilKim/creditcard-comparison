import { PDFDocument, rgb } from 'pdf-lib';
import opentype from 'opentype.js';
import fs from 'fs';

// mm → pt 변환 함수
const mm2pt = (mm) => mm * 2.83465;

// 국문 이름 위치 정보
const nameX_mm = 19.057;
const nameBaselineY_mm = -26.101;

const drawKoreanName = async (pdfDoc, page) => {
  const fontBuffer = fs.readFileSync('KBFGDisplayM.otf');
  const font = opentype.parse(fontBuffer.buffer);

  const name = '김태길';
  const fontSize = 13;
  const letterSpacing = 0.3 * font.unitsPerEm; // 300/1000em

  // 폰트 path로 변환
  let x = 0;
  const paths = name.split('').map((char) => {
    const glyph = font.charToGlyph(char);
    const glyphPath = glyph.getPath(x, 0, fontSize);
    x += glyph.advanceWidth + letterSpacing;
    return glyphPath;
  });

  // 전체 path 합치기
  const fullPath = new opentype.Path();
  paths.forEach((p) => {
    p.commands.forEach((cmd) => fullPath.commands.push(cmd));
  });

  // path → SVG → PDF-lib path
  const svgPathData = fullPath.toPathData();
  page.drawSvgPath(svgPathData, {
    x: mm2pt(nameX_mm),
    y: mm2pt(nameBaselineY_mm),
    color: rgb(0, 0, 0),
    borderWidth: 0,
  });
};
