/** 빌드 결과 자체 검사. 실패가 있으면 종료코드 1. */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.join(process.cwd(), 'dist');
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    e.isDirectory() ? walk(p) : files.push(p);
  }
})(DIST);
const htmls = files.filter((f) => f.endsWith('.html'));
const rel = (f) => '/' + path.relative(DIST, f).replace(/\\/g, '/');
const urlOf = (f) => rel(f).replace(/index\.html$/, '');
const exists = new Set(htmls.map(urlOf));

let fail = 0;
const bad = (msg) => { console.log('  ✗ ' + msg); fail++; };
const ok = (msg) => console.log('  ✓ ' + msg);

/* 1. 금지 문자열 */
const JUNK = ['undefined', 'NaN', '[object Object]', 'null원', '${'];
let junkHits = 0;
for (const f of htmls) {
  const s = fs.readFileSync(f, 'utf8');
  for (const j of JUNK) if (s.includes(j)) { if (junkHits < 6) bad(`${urlOf(f)} 에 '${j}'`); junkHits++; }
}
junkHits ? bad(`쓰레기 문자열 ${junkHits}건`) : ok('쓰레기 문자열 0건');

/* 2. 내부 링크가 전부 실제 파일인가 */
const missing = new Map();
for (const f of htmls) {
  const s = fs.readFileSync(f, 'utf8');
  for (const m of s.matchAll(/href="(\/[^"#?]*)"/g)) {
    const h = m[1];
    if (h.startsWith('/assets/') || /\.(xml|txt|svg|webmanifest|css|js)$/.test(h)) {
      if (!files.some((x) => rel(x) === h)) missing.set(h, (missing.get(h) || 0) + 1);
      continue;
    }
    if (!exists.has(h)) missing.set(h, (missing.get(h) || 0) + 1);
  }
}
missing.size ? [...missing].slice(0, 10).forEach(([h, n]) => bad(`끊긴 링크 ${h} (${n}곳)`)) : ok('끊긴 내부 링크 0건');
if (missing.size) bad(`끊긴 링크 ${missing.size}종`);

/* 3. 타이틀·디스크립션 중복 */
const t = new Map(), d = new Map();
for (const f of htmls) {
  const s = fs.readFileSync(f, 'utf8');
  const tt = (s.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  const dd = (s.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  t.set(tt, (t.get(tt) || 0) + 1);
  d.set(dd, (d.get(dd) || 0) + 1);
}
const dupT = [...t].filter(([, n]) => n > 1), dupD = [...d].filter(([, n]) => n > 1);
dupT.length ? dupT.slice(0, 5).forEach(([x, n]) => bad(`타이틀 중복 ${n}회: ${x}`)) : ok(`타이틀 ${t.size}종 전부 고유`);
dupD.length ? dupD.slice(0, 5).forEach(([x, n]) => bad(`설명 중복 ${n}회: ${x}`)) : ok(`설명 ${d.size}종 전부 고유`);

/* 4. 한 페이지 한 개 규칙 */
let h1bad = 0, canbad = 0;
for (const f of htmls) {
  const s = fs.readFileSync(f, 'utf8');
  if ((s.match(/<h1[ >]/g) || []).length !== 1) h1bad++;
  if ((s.match(/rel="canonical"/g) || []).length !== 1) canbad++;
}
h1bad ? bad(`h1 개수 이상 ${h1bad}쪽`) : ok('h1 전 페이지 1개');
canbad ? bad(`canonical 이상 ${canbad}쪽`) : ok('canonical 전 페이지 1개');

/* 5. JSON-LD 파싱 */
let ldbad = 0, ldTypes = new Set();
for (const f of htmls) {
  const s = fs.readFileSync(f, 'utf8');
  const m = s.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!m) { ldbad++; continue; }
  try {
    const j = JSON.parse(m[1]);
    for (const n of j['@graph']) ldTypes.add(n['@type']);
  } catch (e) { if (ldbad < 3) bad(`${urlOf(f)} JSON-LD 파싱 실패`); ldbad++; }
}
ldbad ? bad(`JSON-LD 이상 ${ldbad}쪽`) : ok(`JSON-LD 전 페이지 정상 · 타입 ${[...ldTypes].sort().join(', ')}`);

/* 6. 사이트맵 URL 이 전부 존재하는가 */
const smFiles = files.filter((f) => /sitemap-.*\.xml$/.test(f));
let smTotal = 0, smMiss = 0;
for (const f of smFiles) {
  const s = fs.readFileSync(f, 'utf8');
  for (const m of s.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)) {
    smTotal++;
    if (!exists.has(m[1])) { if (smMiss < 5) bad(`사이트맵에만 있는 주소 ${m[1]}`); smMiss++; }
  }
}
smMiss ? bad(`사이트맵 불일치 ${smMiss}건`) : ok(`사이트맵 ${smTotal} URL 전부 실재`);

/* 7. noindex 가 사이트맵에 끼지 않았는가 */
let nidx = 0;
for (const f of htmls) {
  const s = fs.readFileSync(f, 'utf8');
  if (s.includes('name="robots" content="noindex')) {
    nidx++;
    for (const sf of smFiles) if (fs.readFileSync(sf, 'utf8').includes(`<loc>`) && fs.readFileSync(sf, 'utf8').includes(urlOf(f) + '</loc>')) bad(`noindex 인데 사이트맵에 있음 ${urlOf(f)}`);
  }
}
ok(`noindex ${nidx}쪽 (사이트맵 제외 확인)`);

/* 8. 고아 페이지 — 홈에서 링크를 타고 닿는가 */
const graph = new Map();
for (const f of htmls) {
  const s = fs.readFileSync(f, 'utf8');
  const outs = new Set();
  for (const m of s.matchAll(/href="(\/[^"#?]*)"/g)) if (exists.has(m[1])) outs.add(m[1]);
  graph.set(urlOf(f), outs);
}
const seen = new Set(['/']); const q = ['/'];
while (q.length) { const cur = q.shift(); for (const n of graph.get(cur) || []) if (!seen.has(n)) { seen.add(n); q.push(n); } }
const orphan = [...exists].filter((u) => !seen.has(u) && u !== '/404.html');
orphan.length ? bad(`고아 ${orphan.length}쪽 (예: ${orphan.slice(0, 3).join(', ')})`) : ok(`고아 0쪽 · 홈에서 ${seen.size}쪽 도달`);

/* 9. 본문 링크 수 분포 */
const counts = htmls.map((f) => {
  const s = fs.readFileSync(f, 'utf8');
  const main = (s.match(/<main id="main">([\s\S]*?)<\/main>/) || ['', ''])[1];
  return (main.match(/href="/g) || []).length;
});
const thin = counts.filter((c) => c < 20).length;
ok(`본문 링크 최소 ${Math.min(...counts)} · 중앙 ${counts.slice().sort((a, b) => a - b)[Math.floor(counts.length / 2)]} · 20개 미만 ${thin}쪽`);

/* 10. 본문 글자수 */
const chars = htmls.map((f) => {
  const s = fs.readFileSync(f, 'utf8');
  const main = (s.match(/<main id="main">([\s\S]*?)<\/main>/) || ['', ''])[1];
  return main.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length;
});
const short = chars.filter((c) => c < 900).length;
ok(`본문 글자수 최소 ${Math.min(...chars)} · 중앙 ${chars.slice().sort((a, b) => a - b)[Math.floor(chars.length / 2)]} · 900자 미만 ${short}쪽`);

console.log(fail ? `\n■ 실패 ${fail}건` : `\n■ 전부 통과 (HTML ${htmls.length}쪽)`);
process.exit(fail ? 1 : 0);
