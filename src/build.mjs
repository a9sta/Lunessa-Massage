/**
 * 정적 사이트 빌드. 외부 의존성 없이 Node 표준 라이브러리만 쓴다.
 *   node src/build.mjs   →  dist/
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hash, shuffle, esc } from './lib/util.mjs';
import { dongPage, guPage, sidoPage } from './pages/region.mjs';
import { coursePage, sidoCoursePage } from './pages/course.mjs';
import {
  homePage, guidePage, pricePage, courseHub, companyPage,
  termsPage, privacyPage, magazineIndex, postPage, notFound,
} from './pages/site.mjs';
import { POSTS } from './content/posts.mjs';
import { writeAssets } from './assets.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

const cfg = read('data/site.config.json');
const courses = read('data/courses.json');
const data = read('data/regions.json');

// Netlify 가 넣어 주는 주소를 우선 쓴다(배포 미리보기에서도 canonical 이 맞게 나온다).
const siteUrl = (process.env.SITE_URL || process.env.URL || cfg.siteUrl).replace(/\/+$/, '');
const updated = new Date().toISOString().slice(0, 10);

const regions = data.sido;
const counts = data.counts;

/** 모든 동을 한 줄로 펴 둔다 — 롱테일 후보 풀. */
const ALL = [];
for (const sd of regions) for (const g of sd.gu) for (const d of g.dong) ALL.push({ sd, g, d });

/**
 * 롱테일 후보. 같은 시도를 조금 더 많이 섞되 네 시도를 모두 걸어
 * 깊은 페이지끼리 서로 이어지게 한다(고아 페이지 방지).
 */
function longtailPool(sd, g, d) {
  const same = ALL.filter((x) => x.sd === sd && x.d !== d && x.g !== g);
  const other = ALL.filter((x) => x.sd !== sd);
  const h = hash(sd.slug, g ? g.slug : '', d ? d.slug : '', 'pool');
  const pick = [...shuffle(same, h).slice(0, 40), ...shuffle(other, hash(h, 'o')).slice(0, 30)];
  return pick.map((x) => ({
    label: `${x.g.name} ${x.d.dong}`,
    href: `/${x.sd.slug}/${x.g.slug}/${x.d.slug}/`,
  }));
}

const latestPosts = POSTS.slice().sort((a, b) => b.date.localeCompare(a.date))
  .slice(0, 3).map((p) => ({ ...p, path: `/magazine/${p.slug}/` }));

const ctx = { cfg, siteUrl, updated, regions, counts, courses, data, latestPosts, longtailPool };

/* ── 페이지 생성 ──────────────────────────────────────────── */
const pages = [];
pages.push(homePage(ctx));
pages.push(guidePage(ctx), pricePage(ctx), courseHub(ctx), companyPage(ctx), termsPage(ctx), privacyPage(ctx));
pages.push(magazineIndex(ctx));
for (const p of POSTS) pages.push(postPage(ctx, p));
for (const c of courses) pages.push(coursePage(ctx, c));
for (const sd of regions) {
  pages.push(sidoPage(ctx, sd));
  for (const c of courses) pages.push(sidoCoursePage(ctx, sd, c));
  for (const g of sd.gu) {
    pages.push(guPage(ctx, sd, g));
    for (const d of g.dong) pages.push(dongPage(ctx, sd, g, d));
  }
}
pages.push(notFound(ctx));

/* ── 쓰기 ────────────────────────────────────────────────── */
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
for (const pg of pages) {
  const out = pg.path.endsWith('.html') ? path.join(DIST, pg.path) : path.join(DIST, pg.path, 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, pg.html);
}

/* ── 사이트맵 ────────────────────────────────────────────── */
const indexable = pages.filter((p) => !p.path.endsWith('.html'));
const dataDate = data.built;
function lastmodFor(p) {
  const m = p.path.match(/^\/magazine\/([^/]+)\/$/);
  if (m) { const post = POSTS.find((x) => x.slug === m[1]); if (post) return post.date; }
  if (p.path === '/magazine/') return POSTS.map((x) => x.date).sort().pop();
  if (/^\/(seoul|gyeonggi|incheon|busan)\//.test(p.path)) return dataDate;
  return updated;
}
function urlset(list) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${list.map((p) => `<url><loc>${siteUrl}${p.path}</loc><lastmod>${lastmodFor(p)}</lastmod><changefreq>${p.path === '/' ? 'daily' : 'weekly'}</changefreq><priority>${p.path === '/' ? '1.0' : p.path.split('/').length <= 3 ? '0.8' : '0.6'}</priority></url>`).join('\n')}
</urlset>`;
}
const shards = { core: indexable.filter((p) => !/^\/(seoul|gyeonggi|incheon|busan)\//.test(p.path)) };
for (const sd of regions) shards[sd.slug] = indexable.filter((p) => p.path.startsWith(`/${sd.slug}/`));
for (const [k, list] of Object.entries(shards)) fs.writeFileSync(path.join(DIST, `sitemap-${k}.xml`), urlset(list));
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Object.keys(shards).map((k) => `<sitemap><loc>${siteUrl}/sitemap-${k}.xml</loc><lastmod>${updated}</lastmod></sitemap>`).join('\n')}
</sitemapindex>`);

/* ── RSS ─────────────────────────────────────────────────── */
const rssItems = POSTS.slice().sort((a, b) => b.date.localeCompare(a.date)).map((p) => `  <item>
    <title>${esc(p.title)}</title>
    <link>${siteUrl}/magazine/${p.slug}/</link>
    <guid isPermaLink="true">${siteUrl}/magazine/${p.slug}/</guid>
    <pubDate>${new Date(`${p.date}T09:00:00+09:00`).toUTCString()}</pubDate>
    <description>${esc(p.summary)}</description>
  </item>`).join('\n');
fs.writeFileSync(path.join(DIST, 'rss.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${esc(cfg.rssTitle)}</title>
  <link>${siteUrl}/magazine/</link>
  <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
  <description>${esc(cfg.brand.ko)} 출장마사지·홈타이 방문 관리 안내 글</description>
  <language>ko</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${rssItems}
</channel>
</rss>`);

/* ── robots · llms.txt · manifest ────────────────────────── */
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *
Allow: /
Disallow: /404.html

User-agent: Yeti
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`);

fs.writeFileSync(path.join(DIST, 'llms.txt'), `# ${cfg.brand.ko} (${cfg.brand.en})

> ${cfg.coverage.sido.join('·')} 네 개 시도의 행정동 ${counts.dong}곳을 대상으로 하는 출장마사지·홈타이 방문 관리 안내 사이트. 매장이 없고 관리사가 이용자 주소로 방문한다.

## 사실 요약
- 지역: ${regions.map((r) => `${r.name}(시군구 ${r.gu.length}·행정동 ${r.gu.reduce((s, g) => s + g.dong.length, 0)})`).join(', ')}
- 접수: 전화 ${cfg.tel} · ${cfg.hours}
- 결제: ${cfg.pay}. 예약금·보증금·교통비 선입금 없음. 심야 할증 없음.
- 코스와 요금: ${courses.map((c) => `${c.ko} ${c.min}분 ${c.price.toLocaleString('ko-KR')}원`).join(' / ')}
- 거리 산정: 행정동 중심점 좌표 기준 직선거리. 행정구역보다 실제 거리로 배차한다.
- 제공하지 않는 것: 성적 서비스, 후기·체험담 게시, 인물 사진.

## 주요 문서
- [이용안내](${siteUrl}/guide/): 접수·결제·변경·거절 사유
- [요금표](${siteUrl}/price/): 코스별 기본 시간과 금액
- [코스 안내](${siteUrl}/course/): 여덟 가지 코스의 차이
- [회사소개](${siteUrl}/company/): 운영 원칙과 지역 자료 출처
${regions.map((r) => `- [${r.name} 지역](${siteUrl}/${r.slug}/): 시군구 → 행정동 순으로 내려간다`).join('\n')}

## 자료 출처
행정동 이름·경계·중심점 좌표·면적: ${data.source} (${data.version})

## 전체 주소 목록
${siteUrl}/sitemap.xml
`);

/* ── _headers · _redirects ──────────────────────────────────
   netlify.toml 은 깃 연동 빌드에서만 읽힌다. zip 을 직접 올리는 배포에서도
   같은 규칙이 걸리도록 publish 폴더 안에 파일로도 떨어뜨린다. */
fs.writeFileSync(path.join(DIST, '_headers'), `/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=(), interest-cohort=()
  Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/sitemap.xml
  Content-Type: application/xml; charset=utf-8
/sitemap-*.xml
  Content-Type: application/xml; charset=utf-8
/rss.xml
  Content-Type: application/rss+xml; charset=utf-8
/llms.txt
  Content-Type: text/plain; charset=utf-8
`);

fs.writeFileSync(path.join(DIST, '_redirects'), `/index.html   /   301!
`);

fs.writeFileSync(path.join(DIST, 'site.webmanifest'), JSON.stringify({
  name: `${cfg.brand.ko} 출장마사지`, short_name: cfg.brand.ko,
  description: `${cfg.coverage.sido.join('·')} 출장마사지·홈타이 방문 관리`,
  start_url: '/', display: 'standalone', background_color: '#12172B', theme_color: '#12172B',
  lang: 'ko-KR', icons: [{ src: '/assets/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
}, null, 2));

/* IndexNow(네이버 웹페이지 수집 요청) 키 파일 — 루트에 그대로 떨어져야 통보가 받아들여진다. */
if (cfg.indexNowKey) fs.writeFileSync(path.join(DIST, `${cfg.indexNowKey}.txt`), cfg.indexNowKey);

writeAssets(DIST, cfg);

const bytes = (function size(dir) {
  let t = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    t += e.isDirectory() ? size(p) : fs.statSync(p).size;
  }
  return t;
})(DIST);

console.log(`빌드 완료 · 페이지 ${pages.length} · 사이트맵 ${indexable.length} URL · ${(bytes / 1024 / 1024).toFixed(1)}MB`);
console.log(`  시도 ${counts.sido} · 시군구 ${counts.gu} · 행정동 ${counts.dong} · 기준 주소 ${siteUrl}`);
