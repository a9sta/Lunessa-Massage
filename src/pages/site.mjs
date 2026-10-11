import { esc, hash, shuffle, won, km } from '../lib/util.mjs';
import { layout, sec, moonMark } from '../lib/html.mjs';
import * as S from '../lib/schema.mjs';
import * as B from '../lib/blocks.mjs';
import { title, desc, clampDesc, BRAND } from '../lib/seo.mjs';
import { POSTS } from '../content/posts.mjs';
import { STEPS } from '../content/copy.mjs';

/* ── 홈 ─────────────────────────────────────────────────────── */
export function homePage(ctx) {
  const { cfg, siteUrl, courses, regions, counts, latestPosts } = ctx;
  const path = '/';
  const url = `${siteUrl}/`;
  const minPrice = Math.min(...courses.map((c) => c.price));

  const hero = `<div class="hero">
    <p class="hero-k">${esc(cfg.slogan || cfg.brand.slogan)}</p>
    <p class="hero-l">${esc(`집이든 숙소든, 주소를 말씀하시면 가장 가까운 관리사가 그리로 갑니다. ${cfg.hours} 전화로만 접수하고 비용은 끝난 뒤에 치릅니다.`)}</p>
    <p class="hero-cta"><a class="btn" href="tel:${cfg.telRaw}">${esc(cfg.tel)} 예약 문의</a><a class="btn btn-l" href="/guide/">이용안내 먼저 보기</a></p>
    <ul class="hero-sg">
      <li><strong>${esc(cfg.pay)}</strong><span>끝난 뒤 결제</span></li>
      <li><strong>${esc(cfg.arrive)}</strong><span>도착 기준</span></li>
      <li><strong>${counts.dong}개 행정동</strong><span>동 단위 안내</span></li>
      <li><strong>${won(minPrice)}원~</strong><span>심야 할증 없음</span></li>
    </ul>
  </div>`;

  const picker = sec('pick', '사는 지역부터 고르십시오',
    `<ul class="pk-ul">${regions.map((r) => {
      const dongCount = r.gu.reduce((s, g) => s + g.dong.length, 0);
      return `<li><a href="/${r.slug}/">
        <span class="pk-n">${esc(r.name)}</span>
        <span class="pk-s">${r.gu.length}개 시군구 · ${dongCount}개 행정동</span>
        <span class="pk-g">${r.gu.slice(0, 4).map((g) => esc(g.name)).join(' · ')} …</span></a></li>`;
    }).join('')}</ul>`,
    '시도 → 시군구 → 행정동 순서로 세 번만 누르면 그 동네 기준 안내가 나옵니다.');

  // 시도마다 행정동 몇 개를 시드로 뽑아 홈에서 바로 걸어 둔다(깊은 페이지의 수집 경로).
  const quick = sec('quick', '행정동 바로 가기',
    `<div class="qk">${regions.map((r) => {
      const all = [];
      for (const g of r.gu) for (const d of g.dong) all.push({ g, d });
      const picked = shuffle(all, hash('home', r.slug)).slice(0, 10);
      return `<div class="qk-col"><h3 class="qk-h"><a href="/${r.slug}/">${esc(r.name)}</a></h3>
        <ul>${picked.map(({ g, d }) => `<li><a href="/${r.slug}/${g.slug}/${d.slug}/">${esc(g.name)} ${esc(d.dong)}</a></li>`).join('')}</ul></div>`;
    }).join('')}</div>`,
    '네 개 시도에서 몇 곳씩 추려 걸어 둔 것입니다. 전체 목록은 시도 페이지에 있습니다.');

  const faqCtx = {
    place: '서울·경기·인천·부산', unit: '지역', hours: cfg.hours, arrive: cfg.arrive, pay: cfg.pay,
    minPrice: won(minPrice), nearList: regions.map((r) => r.name).join('·'),
  };
  const faq = B.faqBlock('home', faqCtx, 6);

  const recent = sec('recent', '최근 올린 글',
    `<ul class="rc-ul">${latestPosts.map((p) => `<li>
      <a href="${p.path}"><span class="rc-t">${esc(p.title)}</span><span class="rc-s">${esc(p.summary)}</span></a>
      <time datetime="${p.date}">${p.date}</time></li>`).join('')}</ul>`,
    '후기 대신, 부르기 전에 알아 두면 되는 것만 적습니다.');

  const lead = `<div class="lead">
    <p>${esc(`${cfg.brand.ko}는 ${cfg.coverage.sido.join('·')} 네 개 시도에서 받는 출장마사지·홈타이 방문 관리입니다. 매장으로 오시는 방식이 아니라 관리사가 주소로 찾아가는 방식입니다.`)}</p>
    <p>${esc(`지역 안내를 구가 아니라 행정동 ${counts.dong}곳으로 갈라 두었습니다. 같은 구 안에서도 끝과 끝은 걸리는 시간이 크게 다르기 때문에, 동 중심점 좌표로 거리를 재서 가장 가까운 차를 붙입니다.`)}</p>
  </div>`;

  const body = [
    hero, lead, picker,
    B.courseGrid(courses, path, '수도권과 부산'),
    B.stepList('/'), quick, faq.html, recent, B.noticeBlock('home'),
  ].join('\n');

  const jsonld = [
    S.service({
      siteUrl, url, tel: cfg.tel, name: `${cfg.brand.ko} 출장마사지·홈타이 방문`,
      desc: `${cfg.coverage.sido.join('·')} 전 행정동 방문 관리`,
      areaServed: regions.map((r) => ({ '@type': 'AdministrativeArea', name: r.name })), courses,
    }),
    S.faqPage(url, faq.qa),
    S.itemList(`${url}#area`, '서비스 지역', regions.map((r) => ({ name: r.name, url: `${siteUrl}/${r.slug}/` }))),
  ];

  return { path, html: layout(ctx, {
    path, title: title.home(), desc: clampDesc(desc.home()),
    h1: '서울·경기·인천·부산 출장마사지 · 홈타이 방문',
    body, jsonld, crumbs: [], pageKind: 'home', bodyClass: 'is-home',
  }) };
}

/* ── 단순 페이지 틀 ─────────────────────────────────────────── */
function simple(ctx, { path, t, d, h1, body, jsonld = [], crumbName, noindex = false }) {
  const { siteUrl } = ctx;
  const crumbs = [{ name: '처음', url: `${siteUrl}/` }, { name: crumbName, url: `${siteUrl}${path}` }];
  return { path, html: layout(ctx, { path, title: t, desc: clampDesc(d), h1, body, jsonld, crumbs, noindex, pageKind: 'page' }) };
}

/* ── 이용안내 ───────────────────────────────────────────────── */
export function guidePage(ctx) {
  const { cfg, courses, siteUrl, counts } = ctx;
  const minPrice = Math.min(...courses.map((c) => c.price));
  const faqCtx = { place: '서울·경기·인천·부산', unit: '지역', hours: cfg.hours, arrive: cfg.arrive, pay: cfg.pay, minPrice: won(minPrice), nearList: '서울·경기·인천' };
  const faq = B.faqBlock('guide', faqCtx, 6);
  const body = [
    `<div class="lead"><p>${esc('접수부터 결제까지 어떻게 돌아가는지 한 장에 적었습니다. 전화하시기 전에 여기만 읽으셔도 됩니다.')}</p></div>`,
    B.stepList('/guide/'),
    sec('pay', '결제',
      `<ul class="nt-ul">
        <li>${esc(`${cfg.pay}입니다. 관리가 끝난 뒤 그 자리에서 치릅니다.`)}</li>
        <li>${esc('예약금·보증금·교통비 명목으로 미리 보내 달라고 하지 않습니다. 그런 요구를 받으셨다면 저희가 아닙니다.')}</li>
        <li>${esc('코스를 중간에 늘리면 늘어난 분량만 더합니다. 처음 안내한 금액 외에 붙는 항목은 없습니다.')}</li>
        <li>${esc('심야라고 더 받지 않습니다. 이동 거리로도 더 받지 않습니다.')}</li>
      </ul>`),
    sec('change', '변경과 취소',
      `<ul class="nt-ul">
        <li>${esc('출발 전이면 전화 한 통으로 시간을 다시 잡습니다. 위약금은 없습니다.')}</li>
        <li>${esc('이미 출발했으면 어디쯤 왔는지 알려 드린 뒤 정합니다.')}</li>
        <li>${esc('주소가 바뀌었으면 미리 알려 주십시오. 이동 시간이 그만큼 늘어납니다.')}</li>
      </ul>`),
    sec('ban', '받지 않는 요청',
      `<ul class="nt-ul">
        <li>${esc('성적 서비스는 제공하지 않습니다. 그런 요청이 확인되면 그 자리에서 중단하고 돌아갑니다.')}</li>
        <li>${esc('음주 상태에서는 진행하지 않습니다.')}</li>
        <li>${esc('관리사의 개인 연락처를 묻거나 촬영하는 일은 할 수 없습니다.')}</li>
      </ul>`),
    sec('cover', '다루는 지역',
      `<p class="sc-p">${esc(`시도 ${counts.sido}곳, 시군구 ${counts.gu}곳, 행정동 ${counts.dong}곳을 각각 한 페이지씩 두었습니다. 행정동 경계와 좌표는 공개된 행정동 경계 자료를 기준으로 삼았습니다.`)}</p>
       <ul class="lt-ul">${ctx.regions.map((r) => `<li><a href="/${r.slug}/">${esc(r.name)} 지역 안내</a></li>`).join('')}</ul>`),
    faq.html,
    B.siteLinks(ctx, '/guide/'),
  ].join('\n');
  return simple(ctx, {
    path: '/guide/', crumbName: '이용안내',
    t: title.page('이용안내'),
    d: '출장마사지 접수부터 결제까지의 절차 안내. 후불제 원칙, 변경·취소 방법, 받지 않는 요청을 한 장에 적었습니다.',
    h1: '이용안내', body, jsonld: [S.faqPage(`${siteUrl}/guide/`, faq.qa)],
  });
}

/* ── 요금 ───────────────────────────────────────────────────── */
export function pricePage(ctx) {
  const { cfg, courses, siteUrl } = ctx;
  const rows = courses.map((c) => `<tr>
    <th scope="row"><a href="/course/${c.slug}/">${esc(c.ko)}</a></th>
    <td>${c.min}분</td><td>${won(c.price)}원</td><td>${esc(c.for)}</td></tr>`).join('');
  const body = [
    `<div class="lead"><p>${esc('지역에 따라 금액이 달라지지 않습니다. 심야 할증도 없습니다. 아래 금액이 전부이고, 결제는 끝난 뒤에 합니다.')}</p></div>`,
    sec('tbl', '코스별 요금',
      `<div class="tw"><table class="pr">
        <caption class="sr">코스별 기본 시간과 요금</caption>
        <thead><tr><th scope="col">코스</th><th scope="col">기본 시간</th><th scope="col">요금</th><th scope="col">이럴 때 고릅니다</th></tr></thead>
        <tbody>${rows}</tbody></table></div>
       <p class="sc-tail">${esc('시간을 늘리면 30분 단위로 더합니다. 늘릴지 말지는 받는 중에 정하셔도 됩니다.')}</p>`),
    sec('extra', '따로 붙는 비용',
      `<ul class="nt-ul">
        <li>${esc('없습니다. 출장비·교통비·심야 할증 모두 받지 않습니다.')}</li>
        <li>${esc('커플 코스는 관리사가 두 명 들어가므로 인원 기준으로 책정되어 있습니다.')}</li>
        <li>${esc('도착한 뒤 처음 듣는 명목이 붙는다면 치르지 않으셔도 됩니다.')}</li>
      </ul>`),
    B.siteLinks(ctx, '/price/'),
  ].join('\n');
  return simple(ctx, {
    path: '/price/', crumbName: '요금표',
    t: title.page('요금표'),
    d: `출장마사지·홈타이 코스별 요금표. ${won(Math.min(...courses.map((c) => c.price)))}원부터이며 출장비·심야 할증 없이 후불로 치릅니다.`,
    h1: '요금표', body,
    jsonld: [S.service({ siteUrl, url: `${siteUrl}/price/`, tel: cfg.tel, name: '출장마사지 코스 요금', desc: '코스별 기본 시간과 요금', areaServed: ctx.regions.map((r) => ({ '@type': 'AdministrativeArea', name: r.name })), courses })],
  });
}

/* ── 코스 허브 ──────────────────────────────────────────────── */
export function courseHub(ctx) {
  const { courses, siteUrl, regions } = ctx;
  const body = [
    `<div class="lead"><p>${esc('코스는 여덟 가지입니다. 오일을 쓰는지, 압이 센지, 전신을 고르게 하는지 한 부위에 몰아 쓰는지로 갈립니다. 고르기 어려우면 통화에서 몸 상태만 말씀하셔도 됩니다.')}</p></div>`,
    B.courseGrid(courses, '/course/', '수도권과 부산'),
    sec('byarea', '지역별로 보기',
      `<ul class="lt-ul">${regions.flatMap((r) => courses.slice(0, 4).map((c) => `<li><a href="/${r.slug}/course/${c.slug}/">${esc(r.name)} ${esc(c.ko)} 출장</a></li>`)).join('')}</ul>`,
      '시도와 코스를 묶은 안내도 따로 있습니다.'),
    B.siteLinks(ctx, '/course/'),
  ].join('\n');
  return simple(ctx, {
    path: '/course/', crumbName: '코스',
    t: title.page('코스 안내'),
    d: '스웨디시·아로마·타이·건식·딥티슈·스포츠·림프·커플 여덟 가지 코스의 차이와 고르는 기준을 정리했습니다.',
    h1: '코스 안내', body,
    jsonld: [S.itemList(`${siteUrl}/course/#list`, '코스 목록', courses.map((c) => ({ name: c.ko, url: `${siteUrl}/course/${c.slug}/` })))],
  });
}

/* ── 회사소개 ───────────────────────────────────────────────── */
export function companyPage(ctx) {
  const { cfg, counts, siteUrl, regions, data } = ctx;
  const b = cfg.business;
  const bizRows = [
    ['상호', b.name], ['대표', b.owner], ['사업자등록번호', b.regNo],
    ['주소', b.address], ['개인정보 책임자', b.privacyOfficer], ['문의', b.email || cfg.tel],
  ].filter((r) => r[1]);
  const body = [
    `<div class="lead">
      <p>${esc(`${cfg.brand.ko}는 ${cfg.coverage.sido.join('·')} 네 개 시도를 대상으로 하는 출장마사지·홈타이 방문 관리입니다. 매장을 두지 않고 관리사가 주소로 찾아가는 방식만 운영합니다.`)}</p>
      <p>${esc('접수는 전화로만 받습니다. 게시판이나 메신저로는 받지 않으며, 그 경로로 오는 요청에는 답하지 않습니다.')}</p>
    </div>`,
    sec('rule', '지키는 것',
      `<ul class="nt-ul">
        <li>${esc('후불제입니다. 어떤 명목으로도 선입금을 요구하지 않습니다.')}</li>
        <li>${esc('성적 서비스를 제공하지 않습니다. 관리 범위를 벗어난 요청은 중단 사유입니다.')}</li>
        <li>${esc('후기와 체험담을 싣지 않습니다. 지어낸 평가로 판단을 흐리지 않기 위해서입니다.')}</li>
        <li>${esc('사람 사진을 쓰지 않습니다. 실제와 다른 인상을 만들 수 있기 때문입니다.')}</li>
        <li>${esc('안내한 금액 밖의 비용을 현장에서 요구하지 않습니다.')}</li>
      </ul>`),
    sec('cover', '다루는 범위',
      `<div class="tw"><table class="pr">
        <caption class="sr">지역 커버리지</caption>
        <thead><tr><th scope="col">시도</th><th scope="col">시군구</th><th scope="col">행정동</th></tr></thead>
        <tbody>${regions.map((r) => `<tr><th scope="row"><a href="/${r.slug}/">${esc(r.name)}</a></th><td>${r.gu.length}곳</td><td>${r.gu.reduce((s, g) => s + g.dong.length, 0)}곳</td></tr>`).join('')}
        <tr><th scope="row">합계</th><td>${counts.gu}곳</td><td>${counts.dong}곳</td></tr></tbody></table></div>`),
    sec('data', '지역 자료 출처',
      `<p class="sc-p">${esc(`행정동 이름·경계·중심점 좌표·면적은 공개 행정동 경계 자료(${data.version})를 내려받아 계산했습니다. 인접 동네는 중심점 사이 직선거리로 정렬한 것이며, 도로 사정을 반영한 값이 아닙니다.`)}</p>
       <p class="sc-p">${esc(data.source)}</p>`),
    bizRows.length
      ? sec('biz', '사업자 정보', B.factTable(bizRows.map((r) => [r[0], esc(r[1])])))
      : sec('biz', '사업자 정보', `<p class="sc-p">${esc('확인되는 대로 이 자리에 표기합니다. 그때까지는 전화로 문의해 주십시오.')} <a href="tel:${cfg.telRaw}">${esc(cfg.tel)}</a></p>`),
    B.siteLinks(ctx, '/company/'),
  ].join('\n');
  return simple(ctx, {
    path: '/company/', crumbName: '회사소개',
    t: title.page('회사소개'),
    d: `${cfg.brand.ko}가 어떤 방식으로 운영되는지, 다루는 지역 범위와 지역 자료의 출처를 밝혀 둔 문서입니다.`,
    h1: '회사소개', body,
  });
}

/* ── 약관·개인정보 ──────────────────────────────────────────── */
export function termsPage(ctx) {
  const { cfg } = ctx;
  const arts = [
    ['제1조 (목적)', `이 약관은 ${cfg.brand.ko}(이하 "회사")가 제공하는 출장 방문 관리 서비스의 이용 조건과 절차, 회사와 이용자의 권리·의무를 정하는 것을 목적으로 합니다.`],
    ['제2조 (서비스의 내용)', '회사는 이용자가 지정한 장소로 관리사가 방문하여 코스에 따른 관리를 제공합니다. 서비스는 전화 예약 문의로만 성립하며, 이 웹사이트는 지역·코스·요금을 안내하는 용도로만 운영됩니다.'],
    ['제3조 (접수와 성립)', '이용자가 전화로 코스·시각·장소를 알리고 회사가 이를 확인한 때에 이용 계약이 성립합니다. 회사는 배차 사정에 따라 요청한 시각을 조정하여 안내할 수 있습니다.'],
    ['제4조 (요금과 결제)', '요금은 요금표에 따르며 관리 종료 후 현장에서 지급합니다. 회사는 예약금·보증금 등 명목의 선지급을 요구하지 않습니다. 코스를 추가한 경우 추가분만 가산합니다.'],
    ['제5조 (변경과 취소)', '이용자는 관리사 출발 전까지 전화로 일정을 변경하거나 취소할 수 있으며 위약금은 발생하지 않습니다. 관리사가 이미 출발한 경우 회사는 진행 상황을 알린 뒤 이용자와 협의합니다.'],
    ['제6조 (서비스 제공의 거절·중단)', '다음 각 호에 해당하면 회사는 서비스를 제공하지 않거나 중단할 수 있습니다. 1. 이용자가 음주 등으로 관리를 받기 어려운 상태인 경우 2. 관리 범위를 벗어난 성적 요구가 있는 경우 3. 관리사의 신체·인격에 대한 위해나 모욕이 있는 경우 4. 이용자가 알린 장소와 실제 장소가 현저히 다른 경우.'],
    ['제7조 (건강 상태의 고지)', '이용자는 임신, 급성 염증, 발열, 최근 수술 부위 등 관리에 영향을 주는 사정을 접수 시 알려야 합니다. 고지하지 않아 생긴 결과에 대하여 회사는 책임지지 않습니다.'],
    ['제8조 (면책)', '천재지변, 교통 통제 등 회사가 통제할 수 없는 사유로 방문이 지연되거나 불가능한 경우 회사는 즉시 이를 알리고 일정을 다시 정합니다. 이 경우 회사는 지연 자체에 대한 손해를 배상하지 않습니다.'],
    ['제9조 (약관의 변경)', '회사는 필요한 경우 이 약관을 변경할 수 있으며, 변경된 약관은 이 페이지에 게시한 때부터 적용됩니다.'],
  ];
  const body = arts.map(([h, p]) => `<section class="art"><h2>${esc(h)}</h2><p>${esc(p)}</p></section>`).join('\n')
    + '\n' + B.siteLinks(ctx, '/terms/');
  return simple(ctx, {
    path: '/terms/', crumbName: '이용약관',
    t: title.page('이용약관'), d: `${cfg.brand.ko} 출장 방문 관리 서비스의 이용 조건과 절차, 결제·변경·거절 사유를 정한 약관입니다.`,
    h1: '이용약관', body,
  });
}

export function privacyPage(ctx) {
  const { cfg } = ctx;
  const arts = [
    ['수집하는 항목', '예약 문의 과정에서 연락처와 방문 주소를 듣습니다. 그 밖의 항목은 받지 않으며, 주민등록번호와 결제 수단 정보는 어떤 경우에도 수집하지 않습니다.'],
    ['수집 목적', '방문할 장소를 찾고 도착 시각을 알리기 위해서입니다. 다른 목적으로는 쓰지 않습니다.'],
    ['보유 기간', '방문이 끝나면 연락처와 주소는 지웁니다. 분쟁이 생긴 경우에 한해 해결될 때까지만 보관합니다.'],
    ['제3자 제공', '제공하지 않습니다. 배정된 관리사에게 방문에 필요한 범위에서만 전달하며, 관리가 끝나면 전달한 정보를 파기하도록 하고 있습니다.'],
    ['이용자의 권리', '보관 중인 정보의 확인·삭제를 요구하실 수 있습니다. 대표 번호로 알려 주시면 확인 후 처리합니다.'],
    ['쿠키와 추적', '이 웹사이트는 광고 추적 쿠키나 외부 분석 스크립트를 쓰지 않습니다. 방문 기록을 개인 단위로 저장하지 않습니다.'],
    ['문의', `개인정보에 관한 문의는 대표 번호 ${cfg.tel}로 받습니다.`],
  ];
  const body = arts.map(([h, p]) => `<section class="art"><h2>${esc(h)}</h2><p>${esc(p)}</p></section>`).join('\n')
    + '\n' + B.siteLinks(ctx, '/privacy/');
  return simple(ctx, {
    path: '/privacy/', crumbName: '개인정보처리방침',
    t: title.page('개인정보처리방침'), d: '예약 문의에서 받는 연락처와 주소를 어떻게 쓰고 언제 지우는지, 제3자 제공과 쿠키 사용 여부를 밝힌 문서입니다.',
    h1: '개인정보처리방침', body,
  });
}

/* ── 매거진 ─────────────────────────────────────────────────── */
export function magazineIndex(ctx) {
  const { siteUrl } = ctx;
  const items = POSTS.slice().sort((a, b) => b.date.localeCompare(a.date));
  const body = [
    `<div class="lead"><p>${esc('후기나 체험담은 싣지 않습니다. 부르기 전에 알아 두면 되는 것, 코스를 고르는 기준, 요금과 결제 방식처럼 실제로 쓰이는 내용만 적습니다.')}</p></div>`,
    sec('list', '글 목록',
      `<ul class="rc-ul">${items.map((p) => `<li>
        <a href="/magazine/${p.slug}/"><span class="rc-t">${esc(p.title)}</span><span class="rc-s">${esc(p.summary)}</span></a>
        <time datetime="${p.date}">${p.date}</time></li>`).join('')}</ul>`),
    B.siteLinks(ctx, '/magazine/'),
  ].join('\n');
  return simple(ctx, {
    path: '/magazine/', crumbName: '소식',
    t: title.page('방문 관리 소식'),
    d: '출장마사지를 부르기 전에 알아 두면 되는 것들. 코스 차이, 후불제의 뜻, 행정동 단위 배차처럼 실제로 쓰이는 설명만 모았습니다.',
    h1: '방문 관리 소식', body,
    jsonld: [S.itemList(`${siteUrl}/magazine/#list`, '글 목록', items.map((p) => ({ name: p.title, url: `${siteUrl}/magazine/${p.slug}/` })))],
  });
}

export function postPage(ctx, p) {
  const { siteUrl, cfg } = ctx;
  const path = `/magazine/${p.slug}/`;
  const url = `${siteUrl}${path}`;
  const html = p.body.map((b) => (Array.isArray(b) ? `<h2>${esc(b[1])}</h2>` : `<p>${esc(b)}</p>`)).join('\n');
  const idx = POSTS.findIndex((x) => x.slug === p.slug);
  const sib = [POSTS[idx - 1], POSTS[idx + 1]].filter(Boolean);
  const body = [
    `<p class="po-meta"><time datetime="${p.date}">${p.date}</time> · ${esc(cfg.brand.ko)}</p>`,
    `<p class="po-sum">${esc(p.summary)}</p>`,
    `<article class="po">${html}</article>`,
    sec('more', '이어서 볼 글',
      `<ul class="rc-ul">${sib.map((s) => `<li><a href="/magazine/${s.slug}/"><span class="rc-t">${esc(s.title)}</span><span class="rc-s">${esc(s.summary)}</span></a><time datetime="${s.date}">${s.date}</time></li>`).join('')}</ul>`),
    B.siteLinks(ctx, path),
  ].join('\n');
  const crumbs = [
    { name: '처음', url: `${siteUrl}/` },
    { name: '소식', url: `${siteUrl}/magazine/` },
    { name: p.title, url },
  ];
  const jsonld = [{
    '@type': 'Article', '@id': `${url}#article`, headline: p.title, description: p.summary,
    datePublished: p.date, dateModified: p.date, inLanguage: 'ko-KR',
    author: { '@id': `${siteUrl}/#org` }, publisher: { '@id': `${siteUrl}/#org` },
    mainEntityOfPage: { '@id': `${url}#page` },
  }];
  return { path, html: layout(ctx, {
    path, title: `${p.title} - ${BRAND} 출장마사지`, desc: clampDesc(p.summary + ' ' + String(p.body[0]).slice(0, 60)),
    h1: esc(p.title), body, jsonld, crumbs, pageKind: 'post',
  }) };
}

/* ── 404 ────────────────────────────────────────────────────── */
export function notFound(ctx) {
  const { regions } = ctx;
  const body = [
    `<div class="lead"><p>${esc('주소가 바뀌었거나 없는 페이지입니다. 아래에서 지역을 다시 고르시거나 전화로 바로 접수하셔도 됩니다.')}</p></div>`,
    sec('pick', '지역 다시 고르기',
      `<ul class="lt-ul">${regions.map((r) => `<li><a href="/${r.slug}/">${esc(r.name)} 지역 안내</a></li>`).join('')}
        <li><a href="/course/">코스 안내</a></li><li><a href="/price/">요금표</a></li><li><a href="/guide/">이용안내</a></li></ul>`),
  ].join('\n');
  return { path: '/404.html', html: layout(ctx, {
    path: '/404.html', title: title.page('찾는 페이지가 없습니다'),
    desc: '요청하신 주소를 찾지 못했습니다. 지역이나 코스 안내로 다시 들어가 주십시오.',
    h1: '찾는 페이지가 없습니다', body, crumbs: [], noindex: true, pageKind: '404',
  }) };
}
