/**
 * 행정동 경계(admdongkor, CC BY 4.0)에서 서울·경기·인천·부산만 뽑아
 * data/regions.json 을 만든다. 결과물을 저장소에 커밋하므로 Netlify 빌드는
 * 이 스크립트를 돌리지 않는다. 경계 자료가 갱신되면 여기서 다시 돌린다.
 *
 *   node scripts/build-regions.mjs [경로/HangJeongDong.geojson]
 */
import fs from 'node:fs';
import readline from 'node:readline';
import path from 'node:path';
import { adminSlug } from './romanize.mjs';

const VERSION = 'HangJeongDong_ver20260701';
const SRC = process.argv[2] || `/tmp/hjd.geojson`;
const OUT = path.join(process.cwd(), 'data', 'regions.json');

const SIDO = {
  '서울특별시': { name: '서울', slug: 'seoul', full: '서울특별시', alias: '서울시' },
  '경기도': { name: '경기', slug: 'gyeonggi', full: '경기도', alias: '경기도' },
  '인천광역시': { name: '인천', slug: 'incheon', full: '인천광역시', alias: '인천시' },
  '부산광역시': { name: '부산', slug: 'busan', full: '부산광역시', alias: '부산시' },
};

// 경기도 자료의 `고양시덕양구` → `고양시 덕양구`
const CITY = ['고양시', '성남시', '수원시', '안산시', '안양시', '용인시', '부천시', '화성시'];
function splitGu(sggnm) {
  for (const c of CITY) if (sggnm.startsWith(c) && sggnm.length > c.length) return `${c} ${sggnm.slice(c.length)}`;
  return sggnm;
}

const R = 6371.0088;
const rad = (d) => (d * Math.PI) / 180;
export function haversine(a, b) {
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** 링 하나의 (부호 있는) 면적과 1차 모멘트. 위도에 따라 경도를 축소한 평면 근사. */
function ringStats(ring, lat0) {
  const kx = Math.cos(rad(lat0)) * 111.32, ky = 110.574;
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, n = ring.length - 1; i < n; i++) {
    const x1 = ring[i][0] * kx, y1 = ring[i][1] * ky;
    const x2 = ring[i + 1][0] * kx, y2 = ring[i + 1][1] * ky;
    const f = x1 * y2 - x2 * y1;
    a += f; cx += (x1 + x2) * f; cy += (y1 + y2) * f;
  }
  a /= 2;
  if (Math.abs(a) < 1e-12) return { area: 0, cx: 0, cy: 0 };
  return { area: a, cx: cx / (6 * a) / kx, cy: cy / (6 * a) / ky };
}

function polyStats(geom) {
  const polys = geom.type === 'MultiPolygon' ? geom.coordinates : [geom.coordinates];
  let lat0 = 0, n = 0;
  for (const p of polys) for (const pt of p[0]) { lat0 += pt[1]; n++; }
  lat0 = n ? lat0 / n : 37.5;
  let area = 0, sx = 0, sy = 0;
  for (const p of polys) {
    p.forEach((ring, idx) => {
      const s = ringStats(ring, lat0);
      const sign = idx === 0 ? 1 : -1;           // 0번은 외곽, 나머지는 구멍
      const w = sign * Math.abs(s.area);
      area += w; sx += s.cx * w; sy += s.cy * w;
    });
  }
  if (!area) return null;
  return { lat: +(sy / area).toFixed(6), lng: +(sx / area).toFixed(6), area: +Math.abs(area).toFixed(2) };
}

const COMPASS = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'];
function bearing(from, to) {
  const dx = (to.lng - from.lng) * Math.cos(rad(from.lat));
  const dy = to.lat - from.lat;
  const deg = (Math.atan2(dx, dy) * 180) / Math.PI;
  return COMPASS[Math.round(((deg + 360) % 360) / 45) % 8];
}

const rows = [];
const rl = readline.createInterface({ input: fs.createReadStream(SRC, { encoding: 'utf8' }), crlfDelay: Infinity });
for await (const raw of rl) {
  const line = raw.trim().replace(/,$/, '');
  if (!line.startsWith('{ "type": "Feature"')) continue;
  let f;
  try { f = JSON.parse(line); } catch { continue; }
  const meta = SIDO[f.properties.sidonm];
  if (!meta) continue;
  const st = polyStats(f.geometry);
  if (!st) continue;
  rows.push({
    sido: meta.name, gu: splitGu(f.properties.sggnm), dong: f.properties.adm_nm.split(' ').pop(),
    code: f.properties.adm_cd2, lat: st.lat, lng: st.lng, area: st.area,
  });
}

// 시도 → 구 → 동
const tree = [];
for (const key of Object.keys(SIDO)) {
  const meta = SIDO[key];
  const mine = rows.filter((r) => r.sido === meta.name);
  const guNames = [...new Set(mine.map((r) => r.gu))].sort((a, b) => a.localeCompare(b, 'ko'));
  const gus = guNames.map((gname) => {
    const dongs = mine.filter((r) => r.gu === gname).sort((a, b) => a.dong.localeCompare(b.dong, 'ko'));
    const area = dongs.reduce((s, d) => s + d.area, 0);
    const lat = dongs.reduce((s, d) => s + d.lat * d.area, 0) / area;
    const lng = dongs.reduce((s, d) => s + d.lng * d.area, 0) / area;
    return { name: gname, slug: adminSlug(gname), lat: +lat.toFixed(6), lng: +lng.toFixed(6), area: +area.toFixed(1), dong: dongs };
  });
  const area = gus.reduce((s, g) => s + g.area, 0);
  tree.push({
    name: meta.name, full: meta.full, alias: meta.alias, slug: meta.slug,
    lat: +(gus.reduce((s, g) => s + g.lat * g.area, 0) / area).toFixed(6),
    lng: +(gus.reduce((s, g) => s + g.lng * g.area, 0) / area).toFixed(6),
    area: +area.toFixed(1), gu: gus,
  });
}

// 슬러그 충돌 정리 (같은 시도 안에서만 유일하면 된다)
for (const sd of tree) {
  const seenGu = new Map();
  for (const g of sd.gu) {
    let s = g.slug, i = 2;
    while (seenGu.has(s)) s = `${g.slug}-${i++}`;
    seenGu.set(s, g); g.slug = s;
    const seenDong = new Map();
    for (const d of g.dong) {
      d.slug = adminSlug(d.dong);
      let t = d.slug, j = 2;
      while (seenDong.has(t)) t = `${d.slug}-${j++}`;
      seenDong.set(t, d); d.slug = t;
    }
  }
}

// 인접 관계 — 중심점 거리 기준 (같은 시도 안)
for (const sd of tree) {
  const all = [];
  for (const g of sd.gu) for (const d of g.dong) all.push({ g, d });
  for (const { g, d } of all) {
    const near = all
      .filter((o) => o.d !== d)
      .map((o) => ({ gu: o.g.name, guSlug: o.g.slug, dong: o.d.dong, slug: o.d.slug, same: o.g === g, km: +haversine(d, o.d).toFixed(2) }))
      .sort((a, b) => a.km - b.km);
    d.near = near.slice(0, 6);
    d.dir = bearing(g, d);
    d.rank = null;
  }
  for (const g of sd.gu) {
    g.near = sd.gu.filter((o) => o !== g).map((o) => ({ name: o.name, slug: o.slug, km: +haversine(g, o).toFixed(1) }))
      .sort((a, b) => a.km - b.km).slice(0, 5);
    g.dir = bearing(sd, g);
    // 구 안에서 동을 면적 순으로 세워 둔다 (본문에서 '넓은 편' 같은 표현의 근거)
    const byArea = [...g.dong].sort((a, b) => b.area - a.area);
    byArea.forEach((d, i) => { d.rank = i + 1; });
  }
}

const out = {
  version: VERSION,
  source: 'admdongkor (https://github.com/vuski/admdongkor) · CC BY 4.0 · 원자료 국가공간정보포털 행정동 경계',
  built: new Date().toISOString().slice(0, 10),
  counts: {
    sido: tree.length,
    gu: tree.reduce((s, x) => s + x.gu.length, 0),
    dong: tree.reduce((s, x) => s + x.gu.reduce((t, g) => t + g.dong.length, 0), 0),
  },
  sido: tree,
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out));
console.log('regions.json', out.counts, `${(fs.statSync(OUT).size / 1024 / 1024).toFixed(2)}MB`);
