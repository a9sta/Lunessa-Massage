/** 같은 유형 페이지끼리 본문 문장이 얼마나 겹치는지 — 도어웨이 자가진단. */
import fs from 'node:fs';
import path from 'node:path';
const DIST = path.join(process.cwd(), 'dist');
const htmls = [];
(function w(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? w(p) : p.endsWith('.html') && htmls.push(p); } })(DIST);
const url = (f) => '/' + path.relative(DIST, f).replace(/\\/g, '/').replace(/index\.html$/, '');

function sentences(f) {
  const s = fs.readFileSync(f, 'utf8');
  const main = (s.match(/<main id="main">([\s\S]*?)<\/main>/) || ['', ''])[1];
  return main.replace(/<[^>]+>/g, '\n').split(/[\n.]/).map((x) => x.trim())
    .filter((x) => x.length >= 10);
}
function overlap(a, b) {
  const sb = new Set(b);
  let hit = 0, tot = 0;
  for (const s of a) { tot += s.length; if (sb.has(s)) hit += s.length; }
  return tot ? hit / tot : 0;
}
const cache = new Map();
const get = (f) => { if (!cache.has(f)) cache.set(f, sentences(f)); return cache.get(f); };

function report(label, list, pairs = 400) {
  if (list.length < 2) return;
  let sum = 0, max = 0, n = 0, worst = '';
  for (let i = 0; i < pairs; i++) {
    const a = list[(i * 7919) % list.length], b = list[(i * 104729 + 3) % list.length];
    if (a === b) continue;
    const r = overlap(get(a), get(b));
    sum += r; n++;
    if (r > max) { max = r; worst = `${url(a)} ↔ ${url(b)}`; }
  }
  console.log(`${label.padEnd(26)} 표본 ${String(n).padStart(4)} · 평균 ${(sum / n * 100).toFixed(1)}% · 최대 ${(max * 100).toFixed(1)}%  ${worst}`);
}

const dong = htmls.filter((f) => url(f).split('/').filter(Boolean).length === 3 && !url(f).includes('/course/'));
const gu = htmls.filter((f) => url(f).split('/').filter(Boolean).length === 2 && !url(f).includes('course'));
const sc = htmls.filter((f) => url(f).includes('/course/') && url(f).split('/').filter(Boolean).length === 3);
report('동 (전체)', dong);
for (const sd of ['seoul', 'gyeonggi', 'incheon', 'busan']) report(`동 (${sd})`, dong.filter((f) => url(f).startsWith('/' + sd + '/')));
const oneGu = dong.filter((f) => url(f).startsWith('/seoul/gangnam-gu/'));
report('동 (서울 강남구 안)', oneGu, 200);
report('구', gu);
report('시도+코스', sc, 100);
