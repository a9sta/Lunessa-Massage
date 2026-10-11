import { esc, hash, shuffle, km, josa, won } from '../lib/util.mjs';
import { layout, sec } from '../lib/html.mjs';
import * as S from '../lib/schema.mjs';
import * as B from '../lib/blocks.mjs';
import { title, desc, clampDesc, SIDO_ISO, BRAND } from '../lib/seo.mjs';
import { DONG_LEAD_A, DONG_LEAD_B, DONG_LEAD_C, GU_LEAD } from '../content/copy.mjs';

const at = (h, arr, slot = 0) => arr[parseInt(h.substr((slot * 3) % 29, 3), 16) % arr.length];
const R = 6371.0088, rad = (d) => (d * Math.PI) / 180;
function dist(a, b) {
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

function sizeWord(d, g) {
  const n = g.dong.length;
  if (d.rank <= Math.ceil(n / 3)) return '넓은';
  if (d.rank > Math.ceil((n * 2) / 3)) return '아담한';
  return '중간쯤 되는';
}

function leadCtx(sd, g, d) {
  const cross = d.near.find((x) => !x.same);
  return {
    sido: sd.name, gu: g.name, dong: d.dong, dir: d.dir,
    n0: d.near[0].dong, n1: d.near[1].dong, n2: d.near[2].dong,
    k0: d.near[0].km, k1: d.near[1].km, k2: d.near[2].km,
    kc: +dist(g, d).toFixed(2),
    sizeWord: sizeWord(d, g),
    crossGu: cross ? cross.gu : '', crossDong: cross ? cross.dong : '', crossKm: cross ? cross.km : 0,
    josa_eun: josa(d.dong, '은/는'), josa_i: josa(d.dong, '이/가'),
  };
}

/* ── 동 페이지 ──────────────────────────────────────────────── */
export function dongPage(ctx, sd, g, d) {
  const { cfg, siteUrl, courses } = ctx;
  const path = `/${sd.slug}/${g.slug}/${d.slug}/`;
  const url = `${siteUrl}${path}`;
  const h = hash(sd.name, g.name, d.dong, 'lead');
  const c = leadCtx(sd, g, d);
  const minPrice = Math.min(...courses.map((x) => x.price));

  const lead = `<div class="lead">
    <p>${esc(at(h, DONG_LEAD_A, 0)(c))}</p>
    <p>${esc(at(h, DONG_LEAD_B, 1)(c))}</p>
    <p>${esc(at(h, DONG_LEAD_C, 2)(c))}</p>
  </div>`;

  const facts = B.factTable([
    ['지역', `${esc(sd.name)} ${esc(g.name)} ${esc(d.dong)}`],
    ['접수 시간', esc(cfg.hours)],
    ['도착까지', `${esc(cfg.arrive)} 기준`],
    ['결제', `${esc(cfg.pay)} · ${won(minPrice)}원부터`],
    ['가까운 동', d.near.slice(0, 3).map((n) => `<a href="/${sd.slug}/${n.guSlug}/${n.slug}/">${esc(n.dong)}</a>`).join(' · ')],
    ['자리', `${esc(g.name)} ${esc(d.dir)}편 · 구 중심에서 ${km(c.kc)}`],
  ]);

  const faqCtx = {
    place: `${g.name} ${d.dong}`, unit: '동', hours: cfg.hours, arrive: cfg.arrive, pay: cfg.pay,
    minPrice: won(minPrice), nearList: d.near.slice(0, 3).map((n) => n.dong).join('·'),
  };
  const faq = B.faqBlock(`${sd.name}/${g.name}/${d.dong}`, faqCtx, 4);

  const pool = ctx.longtailPool(sd, g, d);
  const lt = B.longtail(pool, `${sd.name}/${g.name}/${d.dong}`, 14,
    '다른 동네도 같은 방식으로 갑니다',
    `${esc(sd.name)}을 비롯해 네 개 시도에서 행정동 단위로 안내합니다.`);

  const body = [
    lead, facts,
    B.courseGrid(courses, path, `${g.name} ${d.dong}`),
    B.stepList(path),
    B.nearList(sd, g, d),
    B.dongIndex(sd, g, d.slug),
    faq.html,
    B.noticeBlock(`${sd.name}/${g.name}/${d.dong}`),
    lt,
  ].join('\n');

  const crumbs = [
    { name: '처음', url: `${siteUrl}/` },
    { name: sd.name, url: `${siteUrl}/${sd.slug}/` },
    { name: g.name, url: `${siteUrl}/${sd.slug}/${g.slug}/` },
    { name: d.dong, url },
  ];
  const placeId = `${url}#place`;
  const jsonld = [
    S.place(placeId, `${sd.full} ${g.name} ${d.dong}`, d, { '@type': 'AdministrativeArea', name: `${sd.name} ${g.name}` }),
    S.service({
      siteUrl, url, tel: cfg.tel,
      name: `${g.name} ${d.dong} 출장마사지·홈타이 방문`,
      desc: `${sd.name} ${g.name} ${d.dong}에서 받는 방문 관리`,
      areaServed: { '@id': placeId }, courses,
    }),
    S.faqPage(url, faq.qa),
    S.itemList(`${url}#near`, `${d.dong}에서 가까운 행정동`,
      d.near.map((n) => ({ name: n.dong, url: `${siteUrl}/${sd.slug}/${n.guSlug}/${n.slug}/` }))),
  ];

  return {
    path,
    html: layout(ctx, {
      path, title: title.dong(sd, g, d), desc: clampDesc(desc.dong(sd, g, d)),
      h1: `${esc(g.name)} ${esc(d.dong)} 출장마사지 · 홈타이 방문`,
      body, jsonld, crumbs, pageKind: 'dong',
      geo: { iso: SIDO_ISO[sd.name], placename: `${sd.name} ${g.name} ${d.dong}`, lat: d.lat, lng: d.lng },
    }),
  };
}

/* ── 구 페이지 ──────────────────────────────────────────────── */
export function guPage(ctx, sd, g) {
  const { cfg, siteUrl, courses } = ctx;
  const path = `/${sd.slug}/${g.slug}/`;
  const url = `${siteUrl}${path}`;
  const h = hash(sd.name, g.name, 'gulead');
  const minPrice = Math.min(...courses.map((x) => x.price));
  const c = {
    sido: sd.name, gu: g.name, dir: g.dir, dongCount: g.dong.length,
    near0: g.near[0].name, near1: g.near[1].name, josa_eun: josa(g.name, '은/는'),
  };
  const lead = `<div class="lead">
    <p>${esc(at(h, GU_LEAD, 0)(c))}</p>
    <p>${esc(`${g.name} 전체 면적은 약 ${g.area}㎢이고, 가장 가까운 자치구는 ${g.near[0].name}(${km(g.near[0].km)})입니다. 구를 넘나드는 주소여도 실제 거리로 배차하므로 경계 쪽은 옆 구 차가 올 수 있습니다.`)}</p>
  </div>`;

  const facts = B.factTable([
    ['지역', `${esc(sd.name)} ${esc(g.name)}`],
    ['행정동', `${g.dong.length}개`],
    ['접수 시간', esc(cfg.hours)],
    ['결제', `${esc(cfg.pay)} · ${won(minPrice)}원부터`],
    ['가까운 구', g.near.slice(0, 3).map((n) => `<a href="/${sd.slug}/${n.slug}/">${esc(n.name)}</a>`).join(' · ')],
  ]);

  const faqCtx = {
    place: g.name, unit: '구', hours: cfg.hours, arrive: cfg.arrive, pay: cfg.pay,
    minPrice: won(minPrice), nearList: g.near.slice(0, 3).map((n) => n.name).join('·'),
  };
  const faq = B.faqBlock(`${sd.name}/${g.name}`, faqCtx, 5);

  const pool = ctx.longtailPool(sd, g, null);
  const lt = B.longtail(pool, `${sd.name}/${g.name}`, 16,
    `${esc(g.name)} 바깥 동네`, '가까운 자치구부터 차례로 걸어 두었습니다.');

  const courseLinks = sec('cby', `${esc(g.name)}에서 코스로 찾기`,
    `<ul class="lt-ul">${courses.map((x) => `<li><a href="/${sd.slug}/course/${x.slug}/">${esc(sd.name)} ${esc(x.ko)} 방문</a></li>`).join('')}</ul>`,
    `코스별 설명은 ${esc(sd.name)} 전역 기준으로 따로 모아 두었습니다.`);

  const body = [
    lead, facts,
    B.dongIndex(sd, g, null),
    B.courseGrid(courses, path, g.name),
    courseLinks,
    B.stepList(path),
    faq.html,
    B.noticeBlock(`${sd.name}/${g.name}`),
    lt,
  ].join('\n');

  const crumbs = [
    { name: '처음', url: `${siteUrl}/` },
    { name: sd.name, url: `${siteUrl}/${sd.slug}/` },
    { name: g.name, url },
  ];
  const placeId = `${url}#place`;
  const jsonld = [
    S.place(placeId, `${sd.full} ${g.name}`, g, { '@type': 'AdministrativeArea', name: sd.full }),
    S.service({
      siteUrl, url, tel: cfg.tel, name: `${g.name} 출장마사지·홈타이 방문`,
      desc: `${sd.name} ${g.name} 전역 방문 관리`, areaServed: { '@id': placeId }, courses,
    }),
    S.faqPage(url, faq.qa),
    S.itemList(`${url}#dong`, `${g.name} 행정동`,
      g.dong.map((d) => ({ name: d.dong, url: `${siteUrl}/${sd.slug}/${g.slug}/${d.slug}/` }))),
  ];

  return {
    path,
    html: layout(ctx, {
      path, title: title.gu(sd, g), desc: clampDesc(desc.gu(sd, g)),
      h1: `${esc(sd.name)} ${esc(g.name)} 출장마사지 · 홈타이 방문`,
      body, jsonld, crumbs, pageKind: 'gu',
      geo: { iso: SIDO_ISO[sd.name], placename: `${sd.name} ${g.name}`, lat: g.lat, lng: g.lng },
    }),
  };
}

/* ── 시도 페이지 ────────────────────────────────────────────── */
export function sidoPage(ctx, sd) {
  const { cfg, siteUrl, courses } = ctx;
  const path = `/${sd.slug}/`;
  const url = `${siteUrl}${path}`;
  const dongCount = sd.gu.reduce((s, g) => s + g.dong.length, 0);
  const minPrice = Math.min(...courses.map((x) => x.price));

  const lead = `<div class="lead">
    <p>${esc(`${sd.full} 전역에서 접수합니다. 시군구 ${sd.gu.length}곳과 그 아래 행정동 ${dongCount}곳을 따로 적어 두었으니, 구를 고른 뒤 사는 동까지 눌러 보시면 그 동네 기준으로 안내가 바뀝니다.`)}</p>
    <p>${esc(`${sd.name}은 구마다 길이 달라 같은 시도라도 걸리는 시간이 같지 않습니다. 그래서 거리 계산을 구가 아니라 행정동 중심점으로 합니다. 주소를 들으면 어느 차가 가장 가까운지 바로 나옵니다.`)}</p>
  </div>`;

  const guCards = sec('guidx', `${esc(sd.name)} 시군구`,
    `<ul class="gx-ul">${sd.gu.map((g) => `<li><a href="/${sd.slug}/${g.slug}/">
       <span class="gx-n">${esc(g.name)}</span>
       <span class="gx-s">${esc(g.dong[0].dong)} 외 ${g.dong.length - 1}개 동</span></a></li>`).join('')}</ul>`,
    '구를 누르면 그 구의 행정동이 전부 펼쳐집니다.');

  const faqCtx = {
    place: sd.name, unit: '시도', hours: cfg.hours, arrive: cfg.arrive, pay: cfg.pay,
    minPrice: won(minPrice), nearList: sd.gu.slice(0, 3).map((g) => g.name).join('·'),
  };
  const faq = B.faqBlock(sd.name, faqCtx, 5);

  const courseLinks = sec('cby', `${esc(sd.name)} 코스별 안내`,
    `<ul class="lt-ul">${courses.map((x) => `<li><a href="/${sd.slug}/course/${x.slug}/">${esc(sd.name)} ${esc(x.ko)} 출장</a></li>`).join('')}</ul>`);

  const body = [
    lead,
    B.factTable([
      ['지역', esc(sd.full)],
      ['시군구', `${sd.gu.length}곳`],
      ['행정동', `${dongCount}곳`],
      ['접수 시간', esc(cfg.hours)],
      ['결제', `${esc(cfg.pay)} · ${won(minPrice)}원부터`],
    ]),
    guCards,
    B.courseGrid(courses, path, sd.name),
    courseLinks,
    B.stepList(path),
    faq.html,
    B.noticeBlock(sd.name),
  ].join('\n');

  const crumbs = [{ name: '처음', url: `${siteUrl}/` }, { name: sd.name, url }];
  const placeId = `${url}#place`;
  const jsonld = [
    S.place(placeId, sd.full, sd, { '@type': 'Country', name: '대한민국' }),
    S.service({ siteUrl, url, tel: cfg.tel, name: `${sd.name} 출장마사지·홈타이 방문`,
      desc: `${sd.full} 전역 방문 관리`, areaServed: { '@id': placeId }, courses }),
    S.faqPage(url, faq.qa),
    S.itemList(`${url}#gu`, `${sd.name} 시군구`,
      sd.gu.map((g) => ({ name: g.name, url: `${siteUrl}/${sd.slug}/${g.slug}/` }))),
  ];

  return {
    path,
    html: layout(ctx, {
      path, title: title.sido(sd), desc: clampDesc(desc.sido(sd)),
      h1: `${esc(sd.name)} 출장마사지 · 홈타이 방문`,
      body, jsonld, crumbs, pageKind: 'sido',
      geo: { iso: SIDO_ISO[sd.name], placename: sd.full, lat: sd.lat, lng: sd.lng },
    }),
  };
}
