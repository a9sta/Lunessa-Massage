import { esc } from './util.mjs';
import * as S from './schema.mjs';

export const ASSET_V = '1';

/** 공통 레이아웃. head 에 SEO·GEO 메타, 푸터에 네이버 C랭크 4신호 + AI 고지. */
export function layout(ctx, opts) {
  const { cfg, siteUrl, updated, latestPosts } = ctx;
  const {
    path, title, desc, h1, body, jsonld = [], geo, crumbs = [],
    noindex = false, bodyClass = '', pageKind = '',
  } = opts;
  const url = `${siteUrl}${path}`;
  const graph = S.graph([
    S.organization(cfg, siteUrl),
    S.website(cfg, siteUrl),
    crumbs.length ? S.breadcrumb(url, crumbs) : null,
    S.webpage({ url, siteUrl, title, desc, updated, breadcrumbId: crumbs.length ? `${url}#crumb` : null }),
    ...jsonld,
  ]);

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
${cfg.naverVerification ? `<meta name="naver-site-verification" content="${esc(cfg.naverVerification)}"/>` : ''}
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
${noindex ? '<meta name="robots" content="noindex,follow">' : '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">'}
<meta name="format-detection" content="telephone=yes">
<meta name="author" content="${esc(cfg.brand.ko)}">
${geo ? `<meta name="geo.region" content="${esc(geo.iso)}">
<meta name="geo.placename" content="${esc(geo.placename)}">
<meta name="geo.position" content="${geo.lat};${geo.lng}">
<meta name="ICBM" content="${geo.lat}, ${geo.lng}">` : `<meta name="geo.region" content="KR">`}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(cfg.brand.ko)} 출장마사지">
<meta property="og:locale" content="ko_KR">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${siteUrl}/assets/og.svg">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<link rel="sitemap" type="application/xml" href="/sitemap.xml">
<link rel="alternate" type="application/rss+xml" title="${esc(cfg.rssTitle)}" href="${siteUrl}/rss.xml">
<link rel="sitemap" type="application/xml" href="${siteUrl}/sitemap.xml">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/favicon.svg">
<link rel="manifest" href="/site.webmanifest">
<link rel="stylesheet" href="/assets/lunessa.css?v=${ASSET_V}">
<script type="application/ld+json">${graph}</script>
</head>
<body class="${bodyClass}" data-kind="${pageKind}">
<a class="skip" href="#main">본문으로 건너뛰기</a>
${header(ctx, path)}
${crumbs.length > 1 ? crumbHtml(crumbs) : ''}
<main id="main">
<h1 class="pg-h1">${h1}</h1>
${body}
</main>
${footer(ctx, latestPosts)}
${callbar(cfg)}
<script src="/assets/lunessa.js?v=${ASSET_V}" defer></script>
</body>
</html>`;
}

function header(ctx, path) {
  const { cfg, siteUrl, regions } = ctx;
  const on = (p) => (path === p || (p !== '/' && path.startsWith(p)) ? ' aria-current="page"' : '');
  return `<header class="hd">
  <div class="hd-in">
    <a class="bi" href="/" aria-label="${esc(cfg.brand.ko)} 처음으로">
      ${moonMark()}<span class="bi-t">${esc(cfg.brand.ko)}</span><span class="bi-s">${esc(cfg.brand.en)}</span>
    </a>
    <nav class="gnb" aria-label="지역">
      ${regions.map((r) => `<a href="/${r.slug}/"${on(`/${r.slug}/`)}>${r.name}</a>`).join('')}
      <a href="/course/"${on('/course/')}>코스</a>
      <a href="/price/"${on('/price/')}>요금</a>
      <a href="/guide/"${on('/guide/')}>이용안내</a>
    </nav>
    <a class="hd-tel" href="tel:${cfg.telRaw}"><span>${esc(cfg.tel)}</span></a>
  </div>
</header>`;
}

function crumbHtml(crumbs) {
  return `<nav class="crumb" aria-label="현재 위치"><ol>${crumbs
    .map((c, i) => (i === crumbs.length - 1
      ? `<li><span aria-current="page">${esc(c.name)}</span></li>`
      : `<li><a href="${c.url.replace(/^https?:\/\/[^/]+/, '')}">${esc(c.name)}</a></li>`))
    .join('')}</ol></nav>`;
}

/**
 * 푸터 = 네이버 C랭크 4신호.
 * ① 출처 명확성 ② 최신성(최근 글 직접 링크 + 갱신일) ③ 수집 경로(RSS·사이트맵) ④ 정보량
 */
function footer(ctx, latestPosts = []) {
  const { cfg, siteUrl, regions, counts, updated } = ctx;
  const b = cfg.business;
  const biz = [
    b.name ? `상호 ${esc(b.name)}` : '',
    b.owner ? `대표 ${esc(b.owner)}` : '',
    b.regNo ? `사업자등록번호 ${esc(b.regNo)}` : '',
    b.address ? `주소 ${esc(b.address)}` : '',
    b.privacyOfficer ? `개인정보 책임자 ${esc(b.privacyOfficer)}` : '',
    b.email ? `문의 ${esc(b.email)}` : '',
  ].filter(Boolean).join(' · ');

  return `<footer class="ft">
  <div class="ft-in">
    <section class="ft-col">
      <h2 class="ft-h">${esc(cfg.brand.ko)}</h2>
      <p class="ft-p">${esc(cfg.coverage.sido.join('·'))} 전 행정동을 대상으로 하는 출장마사지·홈타이 방문 관리입니다. 접수는 전화로만 받습니다.</p>
      <p class="ft-tel"><a href="tel:${cfg.telRaw}">${esc(cfg.tel)}</a><span class="ft-h2">${esc(cfg.hours)} · ${esc(cfg.pay)}</span></p>
      ${biz ? `<p class="ft-biz">${biz}</p>` : '<p class="ft-biz ft-dim">사업자 정보는 확인되는 대로 이 자리에 표기합니다.</p>'}
    </section>
    <nav class="ft-col" aria-label="지역 바로가기">
      <h2 class="ft-h">지역</h2>
      <ul class="ft-ul">${regions.map((r) => `<li><a href="/${r.slug}/">${r.name}</a></li>`).join('')}</ul>
      <p class="ft-note">시도 ${counts.sido} · 시군구 ${counts.gu} · 행정동 ${counts.dong}개를 따로 적어 두었습니다.</p>
    </nav>
    <nav class="ft-col" aria-label="안내">
      <h2 class="ft-h">안내</h2>
      <ul class="ft-ul">
        <li><a href="/guide/">이용안내</a></li>
        <li><a href="/price/">요금표</a></li>
        <li><a href="/course/">코스</a></li>
        <li><a href="/company/">회사소개</a></li>
        <li><a href="/terms/">이용약관</a></li>
        <li><a href="/privacy/">개인정보처리방침</a></li>
      </ul>
    </nav>
    <nav class="ft-col" aria-label="최근 글과 수집 경로">
      <h2 class="ft-h">최근 글</h2>
      <ul class="ft-ul">${latestPosts.slice(0, 3).map((p) => `<li><a href="${p.path}">${esc(p.title)}</a><time datetime="${p.date}">${p.date}</time></li>`).join('')}</ul>
      <ul class="ft-ul ft-feed">
        <li><a href="/rss.xml">RSS</a></li>
        <li><a href="/sitemap.xml">사이트맵</a></li>
        <li><a href="/llms.txt">llms.txt</a></li>
      </ul>
      <p class="ft-note">마지막 갱신 <time datetime="@@LM@@">@@LM@@</time></p>
    </nav>
  </div>
  <div class="ft-bar">
    <p class="ft-ai">이 사이트의 지역 안내 문장은 행정동 경계 자료(좌표·면적·인접 관계)를 바탕으로 <strong>AI 도구의 도움을 받아 작성</strong>하고 사람이 확인했습니다. 후기·체험담은 싣지 않습니다. 행정동 경계 자료 출처: admdongkor(CC BY 4.0).</p>
    <p class="ft-cr">© ${new Date(ctx.updated).getFullYear()} ${esc(cfg.brand.ko)}. 성적 서비스를 제공하지 않으며, 그런 요청은 받지 않습니다.</p>
  </div>
</footer>`;
}

function callbar(cfg) {
  return `<div class="cbar">
  <a class="cbar-tel" href="tel:${cfg.telRaw}"><span class="cbar-k">예약 문의</span><span class="cbar-n">${esc(cfg.tel)}</span></a>
  <span class="cbar-s">${esc(cfg.hours)}</span>
</div>`;
}

export function moonMark() {
  return `<svg class="mk" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15.2 2.4a9.6 9.6 0 1 0 6.4 11.9A7.8 7.8 0 0 1 15.2 2.4Z"/><circle cx="18.6" cy="5.2" r="1.1"/></svg>`;
}

/** 섹션 틀 */
export function sec(id, h2, inner, sub) {
  return `<section class="sc" id="${id}" aria-labelledby="${id}-h">
  <div class="sc-hd"><h2 id="${id}-h">${h2}</h2>${sub ? `<p class="sc-sub">${sub}</p>` : ''}</div>
  ${inner}
</section>`;
}
