export async function loadFonts(map) {
  console.log('4) loadFonts 시작');
  const result = {};
  for (const [key, url] of Object.entries(map)) {
    console.log(`  • ${key}: ${url}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`폰트 로드 실패 ${key}: ${res.status}`);
    const bytes = await res.arrayBuffer();
    const font = fontkit.create(bytes);
    console.log(`    ↳ ${key}.unitsPerEm =`, font.unitsPerEm);
    result[key] = font;
  }
  console.log('4) loadFonts 완료');
  return result;
}