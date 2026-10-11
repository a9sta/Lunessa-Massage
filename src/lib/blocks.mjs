import { esc, hash, shuffle, km, won } from './util.mjs';
import { sec } from './html.mjs';
import { ANCHOR, FAQ_POOL, STEP_SETS, NOTICE, SEC } from '../content/copy.mjs';

const at = (h, arr, slot = 0) => arr[parseInt(h.substr((slot * 3) % 29, 3), 16) % arr.length];

/* ── 코스 ─────────────────────────────────────────────────────── */
export function courseGrid(courses, seedKey, place) {
  const h = hash(seedKey, 'cg');
  // 설명을 전부 달면 어느 페이지나 같은 여덟 문장이 깔린다. 세 개만 시드로 골라 단다.
  const withText = new Set(shuffle(courses.map((c) => c.slug), h).slice(0, 3));
  const list = courses.map((c, i) => {
    const line = at(hash(seedKey, c.slug), c.lines || [c.line]);
    return `<li class="cs">
    <a class="cs-a" href="/course/${c.slug}/">
      <span class="cs-k">${esc(c.ko)}</span>
      <span class="cs-m">${c.min}분 ${won(c.price)}원~</span>
    </a>
    ${withText.has(c.slug) ? `<p class="cs-d">${esc(line)}</p>` : ''}
  </li>`;
  }).join('');
  return sec('course', `${esc(place)}에서 고를 수 있는 코스`,
    `<ul class="cs-ul">${list}</ul>
     <p class="sc-tail">코스를 못 고르겠으면 전화에서 몸 상태만 말씀해 주십시오. <a href="/course/">코스별 설명</a>과 <a href="/price/">요금표</a>를 따로 두었습니다.</p>`,
    at(h, SEC.courseSub, 1));
}

/* ── 접수 흐름 ────────────────────────────────────────────────── */
export function stepList(seedKey) {
  const h = hash(seedKey, 'st');
  const steps = at(h, STEP_SETS);
  return sec('step', esc(at(h, SEC.stepTitle, 1)),
    `<ol class="st-ol">${steps.map((s, i) => `<li class="st"><span class="st-n">${i + 1}</span><div><h3 class="st-t">${esc(s.t)}</h3><p class="st-d">${esc(s.d)}</p></div></li>`).join('')}</ol>`,
    at(h, SEC.stepSub, 2));
}

/* ── 빠른 정보 표 ─────────────────────────────────────────────── */
export function factTable(rows) {
  return `<dl class="ft-dl">${rows.map((r) => `<div class="ft-row"><dt>${esc(r[0])}</dt><dd>${r[1]}</dd></div>`).join('')}</dl>`;
}

/* ── FAQ ─────────────────────────────────────────────────────── */
export function faqBlock(seedKey, c, n = 4) {
  const h = hash(seedKey, 'faq');
  const idx = shuffle(FAQ_POOL.map((_, i) => i), h).slice(0, n);
  const qa = idx.map((i, k) => {
    const item = FAQ_POOL[i];
    const av = item.a[parseInt(hash(seedKey, 'av', i).substr(0, 3), 16) % item.a.length];
    return { q: item.q(c), a: av(c) };
  });
  const html = sec('faq', esc(at(h, SEC.faqTitle, 3)),
    qa.map((x) => `<div class="fq"><h3 class="fq-q">${esc(x.q)}</h3><p class="fq-a">${esc(x.a)}</p></div>`).join(''),
    at(h, SEC.faqSub, 4));
  return { html, qa };
}

/* ── 안내/주의 ────────────────────────────────────────────────── */
export function noticeBlock(seedKey) {
  const h = hash(seedKey, 'nt');
  const items = shuffle(NOTICE, h).slice(0, 3);
  return sec('notice', esc(at(h, SEC.noticeTitle, 5)),
    `<ul class="nt-ul">${items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`);
}

/* ── 롱테일 링크 격자 ─────────────────────────────────────────── */
export function longtail(pool, seedKey, n, heading, sub) {
  const h = hash(seedKey, 'lt');
  const picked = shuffle(pool, h).slice(0, n);
  const items = picked.map((p) => {
    const frame = ANCHOR[parseInt(hash(seedKey, p.label).substr(0, 3), 16) % ANCHOR.length];
    return `<li><a href="${p.href}">${esc(frame(p.label))}</a></li>`;
  }).join('');
  return sec('longtail', heading, `<ul class="lt-ul">${items}</ul>`, sub || at(h, SEC.ltSub, 6));
}

/* ── 가까운 동 목록 ───────────────────────────────────────────── */
export function nearList(sd, g, d) {
  const items = d.near.map((n) => `<li>
    <a href="/${sd.slug}/${n.guSlug}/${n.slug}/">
      <span class="nr-d">${esc(n.dong)}</span>
      <span class="nr-g">${n.same ? '같은 ' + esc(g.name) : esc(n.gu)}</span>
      <span class="nr-k">${km(n.km)}</span>
    </a></li>`).join('');
  return sec('near', `${esc(d.dong)}에서 가까운 동네`,
    `<ul class="nr-ul">${items}</ul>`,
    '중심점 사이 직선거리 기준입니다. 행정구역이 달라도 가까우면 같은 차가 갑니다.');
}

/* ── 구 안의 동 전체 ──────────────────────────────────────────── */
export function dongIndex(sd, g, currentSlug) {
  const items = g.dong.map((d) => `<li${d.slug === currentSlug ? ' class="on"' : ''}>
    <a href="/${sd.slug}/${g.slug}/${d.slug}/"${d.slug === currentSlug ? ' aria-current="page"' : ''}>${esc(d.dong)}</a></li>`).join('');
  return sec('dongidx', `${esc(g.name)} 행정동`,
    `<ul class="dx-ul">${items}</ul>`,
    `${esc(g.name)} 안쪽은 동 단위로 갈라 두었습니다. 사는 동을 누르면 그 동네 안내로 넘어갑니다.`);
}

/* ── 아래쪽 안내 링크 (글·약관 등 얕은 페이지용) ─────────────── */
export function siteLinks(ctx, seedKey) {
  const { regions } = ctx;
  const h = hash(seedKey, 'sl');
  const all = [];
  for (const r of regions) for (const g of r.gu) all.push({ r, g });
  const spots = shuffle(all, h).slice(0, 8);
  return sec('also', '이어서 볼 곳',
    `<ul class="lt-ul">
      <li><a href="/guide/">이용안내</a></li>
      <li><a href="/price/">요금표</a></li>
      <li><a href="/course/">코스 안내</a></li>
      <li><a href="/magazine/">소식</a></li>
      ${regions.map((r) => `<li><a href="/${r.slug}/">${esc(r.name)} 지역</a></li>`).join('')}
      ${spots.map((x) => `<li><a href="/${x.r.slug}/${x.g.slug}/">${esc(x.r.name)} ${esc(x.g.name)}</a></li>`).join('')}
    </ul>`,
    '지역은 시도 → 시군구 → 행정동 순서로 내려갑니다.');
}
