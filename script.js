function drawTextPath(page, cfg, text, key) {
  console.group(`▶ drawTextPath [${key}]`);
  console.log('- text:', `"${text}"`);
  if (!text) {
    console.warn('  (빈 문자열, 스킵)');
    console.groupEnd();
    return;
  }

  const glyphs = cfg.font.stringToGlyphs(text);
  console.log('- glyphs:', glyphs.length);
  if (!glyphs.length) {
    console.error('  (glyphs 없음!)');
    console.groupEnd();
    return;
  }

  let cursorX = mm2pt(cfg.x);
  const y = page.getHeight() - mm2pt(cfg.y);
  let pathData = '';

  glyphs.forEach((g, i) => {
    const p = g.getPath(cursorX, y, cfg.size);
    console.log(`  [${key}] glyph ${i} path 길이:`, p.commands.length);
    pathData += p.toPathData(2);
    cursorX += g.advanceWidth * (cfg.size / cfg.font.unitsPerEm) + cfg.em * cfg.size;
  });

  if (!pathData) {
    console.error('  pathData 없음 ❌');
    console.groupEnd();
    return;
  }

  page.drawSvgPath(pathData, {
    fillColor: cfg.color,
    borderColor: PDFLib.rgb(1, 0, 0), // 빨간 외곽선
    borderWidth: 0.3,
  });

  console.log(`✓ drawSvgPath 성공 (${key})`);
  console.groupEnd();
}
