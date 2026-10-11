import { esc, hash, won, josa, shuffle } from '../lib/util.mjs';
import { layout, sec } from '../lib/html.mjs';
import * as S from '../lib/schema.mjs';
import * as B from '../lib/blocks.mjs';
import { title, desc, clampDesc, SIDO_ISO } from '../lib/seo.mjs';

/** 코스마다 진행 방식을 다르게 적는다(한 틀을 여덟 번 쓰면 코스 페이지끼리 겹친다). */
const HOW = {
  swedish: ['오일을 데워 등부터 시작합니다. 넓은 면으로 길게 밀어내다가 어깨와 목으로 올라갑니다.',
            '압은 중간에서 시작해 반응을 보며 올립니다. 아프기 직전이 아니라 시원한 선에서 멈춥니다.',
            '끝에는 다리 뒤쪽을 정리하고 마칩니다. 오일이 남으면 닦아 드립니다.'],
  aroma:   ['향을 두세 가지 보여 드리고 고르신 것으로 씁니다. 향이 싫으면 무향으로도 가능합니다.',
            '속도를 일부러 늦춥니다. 자극보다 가라앉히는 쪽에 목적이 있어 압은 세지 않습니다.',
            '받다가 잠드셔도 됩니다. 깨우지 않고 남은 순서대로 마칩니다.'],
  thai:    ['오일 없이 옷을 입은 채 진행합니다. 활동복이 있으면 갈아입으시는 편이 편합니다.',
            '관리사가 체중을 실어 누르고, 팔다리를 잡아 가동 범위를 넓힙니다. 숨을 참지 않는 것이 중요합니다.',
            '소리가 나는 구간이 있는데 통증이 없으면 그냥 두셔도 됩니다. 불편하면 바로 말씀하십시오.'],
  dry:     ['옷을 입은 채로 지압 위주입니다. 샤워를 못 하는 상황에서도 받을 수 있습니다.',
            '손가락과 팔꿈치로 점을 눌러 갑니다. 한 점에 머무는 시간이 길어 압이 세게 느껴질 수 있습니다.',
            '오일을 안 쓰니 끝나고 바로 외출하셔도 됩니다.'],
  'deep-tissue': ['먼저 어디가 어떻게 아픈지 짚고 시작합니다. 전신을 고르게 하기보다 한두 군데에 시간을 몰아 씁니다.',
            '표층을 풀어 놓고 깊은 층으로 들어갑니다. 바로 세게 누르지 않습니다.',
            '다음 날 뻐근할 수 있습니다. 물을 평소보다 많이 드시는 편이 낫습니다.'],
  sports:  ['쓰는 부위를 먼저 확인합니다. 달리기와 웨이트는 보는 곳이 다릅니다.',
            '수축한 근육을 늘리고, 붙어 있는 자리를 떼어 놓는 순서로 갑니다.',
            '경기나 대회 전날이면 강도를 낮춥니다. 전날 깊게 들어가면 당일 몸이 무겁습니다.'],
  lymph:   ['압이 가장 약한 구성입니다. 쓸어 올리는 동작이 대부분이라 눌리는 느낌은 거의 없습니다.',
            '발끝과 손끝에서 몸통 쪽으로 방향을 잡습니다. 방향이 핵심이라 순서를 건너뛰지 않습니다.',
            '끝나고 물을 드시고, 한두 시간은 오래 서 있지 않는 편이 좋습니다.'],
  couple:  ['관리사 두 명이 같은 시각에 도착합니다. 방이 둘이면 따로, 하나면 간격을 두고 진행합니다.',
            '두 분이 서로 다른 코스를 고르셔도 됩니다. 시간만 맞추면 됩니다.',
            '공간이 좁으면 매트 두 장이 안 들어갈 수 있어 접수할 때 방 크기를 먼저 여쭙니다.'],
};

export function coursePage(ctx, c) {
  const { cfg, siteUrl, courses, regions } = ctx;
  const path = `/course/${c.slug}/`;
  const url = `${siteUrl}${path}`;
  const others = courses.filter((x) => x.slug !== c.slug);

  const lead = `<div class="lead">
    <p>${esc(`${c.ko} 출장은 ${c.line}`)}</p>
    <p>${esc(`${c.for} 고르시면 됩니다. ${c.min}분 ${won(c.price)}원부터이고, 지역에 따라 금액이 달라지지 않습니다.`)}</p>
  </div>`;

  const how = sec('how', `${esc(c.ko)}는 이렇게 진행합니다`,
    `<ol class="hw-ol">${HOW[c.slug].map((t) => `<li>${esc(t)}</li>`).join('')}</ol>`);

  const areaLinks = sec('area', `${esc(c.ko)}를 받을 수 있는 지역`,
    `<ul class="lt-ul">${regions.map((r) => `<li><a href="/${r.slug}/course/${c.slug}/">${esc(r.name)} ${esc(c.ko)} 출장</a></li>`).join('')}</ul>`,
    '시도를 누르면 그 지역 시군구까지 이어집니다.');

  const otherLinks = sec('oc', '다른 코스와 견주면',
    `<ul class="cs-ul">${others.map((x) => `<li class="cs">
      <a class="cs-a" href="/course/${x.slug}/"><span class="cs-k">${esc(x.ko)}</span><span class="cs-m">${x.min}분 ${won(x.price)}원~</span></a>
      <p class="cs-d">${esc(x.for)} 고릅니다.</p></li>`).join('')}</ul>`);

  const faqCtx = {
    place: '수도권·부산', unit: '지역', hours: cfg.hours, arrive: cfg.arrive, pay: cfg.pay,
    minPrice: won(Math.min(...courses.map((x) => x.price))),
    nearList: regions.map((r) => r.name).join('·'),
  };
  const faq = B.faqBlock(`course/${c.slug}`, faqCtx, 4);

  const body = [
    lead,
    B.factTable([
      ['코스', esc(c.ko)], ['기본 시간', `${c.min}분`], ['요금', `${won(c.price)}원부터`],
      ['결제', esc(cfg.pay)], ['접수', esc(cfg.hours)],
      ['지역', regions.map((r) => `<a href="/${r.slug}/course/${c.slug}/">${esc(r.name)}</a>`).join(' · ')],
    ]),
    how, areaLinks, B.stepList(path), otherLinks, faq.html, B.noticeBlock(`course/${c.slug}`),
  ].join('\n');

  const crumbs = [
    { name: '처음', url: `${siteUrl}/` },
    { name: '코스', url: `${siteUrl}/course/` },
    { name: c.ko, url },
  ];
  const jsonld = [
    S.service({ siteUrl, url, tel: cfg.tel, name: `${c.ko} 출장마사지`, desc: c.line,
      areaServed: regions.map((r) => ({ '@type': 'AdministrativeArea', name: r.name })), courses: [c] }),
    S.faqPage(url, faq.qa),
  ];

  return { path, html: layout(ctx, {
    path, title: title.course(c), desc: clampDesc(desc.course(c)),
    h1: `${esc(c.ko)} 출장마사지 · 홈타이`, body, jsonld, crumbs, pageKind: 'course',
  }) };
}

export function sidoCoursePage(ctx, sd, c) {
  const { cfg, siteUrl, courses } = ctx;
  const path = `/${sd.slug}/course/${c.slug}/`;
  const url = `${siteUrl}${path}`;
  const h = hash(sd.name, c.slug);
  const picked = shuffle(sd.gu, h).slice(0, 12);

  const lead = `<div class="lead">
    <p>${esc(`${sd.full}에서 ${c.ko} 출장을 받는 경우입니다. ${c.line}`)}</p>
    <p>${esc(`${sd.name} 시군구 ${sd.gu.length}곳 어디서든 같은 금액으로 접수합니다. ${c.min}분 ${won(c.price)}원부터이고, 이동 거리로 더 붙이지 않습니다.`)}</p>
  </div>`;

  const guLinks = sec('guc', `${esc(sd.name)} 시군구에서 ${esc(c.ko)} 접수`,
    `<ul class="lt-ul">${sd.gu.map((g) => `<li><a href="/${sd.slug}/${g.slug}/">${esc(g.name)} 방문 안내</a></li>`).join('')}</ul>`,
    `구 페이지에서 행정동까지 내려가면 그 동네 기준 안내가 나옵니다.`);

  const otherCourse = sec('oc', `${esc(sd.name)}의 다른 코스`,
    `<ul class="lt-ul">${courses.filter((x) => x.slug !== c.slug).map((x) =>
      `<li><a href="/${sd.slug}/course/${x.slug}/">${esc(sd.name)} ${esc(x.ko)} 출장</a></li>`).join('')}</ul>`);

  const faqCtx = {
    place: sd.name, unit: '시도', hours: cfg.hours, arrive: cfg.arrive, pay: cfg.pay,
    minPrice: won(c.price), nearList: picked.slice(0, 3).map((g) => g.name).join('·'),
  };
  const faq = B.faqBlock(`${sd.slug}/course/${c.slug}`, faqCtx, 4);

  const body = [
    lead,
    B.factTable([
      ['지역', esc(sd.full)], ['코스', esc(c.ko)], ['기본 시간', `${c.min}분`],
      ['요금', `${won(c.price)}원부터`], ['접수', esc(cfg.hours)], ['결제', esc(cfg.pay)],
    ]),
    guLinks, otherCourse, B.stepList(path), faq.html,
  ].join('\n');

  const crumbs = [
    { name: '처음', url: `${siteUrl}/` },
    { name: sd.name, url: `${siteUrl}/${sd.slug}/` },
    { name: `${c.ko} 코스`, url },
  ];
  const placeId = `${siteUrl}/${sd.slug}/#place`;
  const jsonld = [
    S.service({ siteUrl, url, tel: cfg.tel, name: `${sd.name} ${c.ko} 출장마사지`,
      desc: `${sd.full} 전역 ${c.ko} 방문 관리`, areaServed: { '@id': placeId }, courses: [c] }),
    S.faqPage(url, faq.qa),
    S.itemList(`${url}#gu`, `${sd.name} 시군구`, sd.gu.map((g) => ({ name: g.name, url: `${siteUrl}/${sd.slug}/${g.slug}/` }))),
  ];

  return { path, html: layout(ctx, {
    path, title: title.sidoCourse(sd, c), desc: clampDesc(desc.sidoCourse(sd, c)),
    h1: `${esc(sd.name)} ${esc(c.ko)} 출장마사지`, body, jsonld, crumbs, pageKind: 'sido-course',
    geo: { iso: SIDO_ISO[sd.name], placename: sd.full, lat: sd.lat, lng: sd.lng },
  }) };
}
