const mm2pt = mm => mm * 2.8346;

function drawTextPath(page, cfg, text, key) {
  console.group(`▶ drawTextPath [${key}]`);
  console.log('- text =', text);
  if (!text) {
    console.warn('  빈 문자열, 스킵');
    console.groupEnd();
    return;
  }

  // fontkit layout → glyphs 배열
  const { glyphs } = cfg.font.layout(text);

  let cursorX = mm2pt(cfg.x);
  const y = page.getHeight() - mm2pt(cfg.y);
  let pathData = '';

  glyphs.forEach((g, i) => {
    const p = g.path.translate(cursorX, y).scale(cfg.size / g.unitsPerEm);
    const d = p.toSVG();
    console.log(`   • glyph[${i}] len=${d.length}`);
    pathData += d;
    cursorX += (g.advanceWidth / g.unitsPerEm) * cfg.size + cfg.em * cfg.size;
  });

  console.log('- pathData.length =', pathData.length);
  page.drawSvgPath(pathData, {
    fillColor: cfg.color,
    borderWidth: 0,
  });
  console.log('- drawSvgPath 완료');
  console.groupEnd();
}

export function drawFront(page, data, layout) {
  console.log('7) drawFront');
  drawTextPath(page, layout.kor_name,  data.kor_name,  'kor_name');
  drawTextPath(page, layout.kor_dept,  data.kor_dept,  'kor_dept');
  drawTextPath(page, layout.kor_title, data.kor_title, 'kor_title');
  drawTextPath(page, layout.phone,     data.phone,     'phone');
  drawTextPath(page, layout.email,     `${data.email_id}@alda.ai`, 'email');
}

export function drawBack(page, data, layout) {
  console.log('8) drawBack');
  drawTextPath(page, layout.eng_name, (data.eng_name||'').toUpperCase(), 'eng_name');
  const dt = [data.eng_dept, data.eng_title].filter(Boolean).join(' / ');
  drawTextPath(page, layout.eng_dept, dt, 'eng_dept');
}