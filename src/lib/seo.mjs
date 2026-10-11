/**
 * 타이틀·디스크립션 정본.
 *
 * ── 경쟁사 SERP 분석(2026-10-11, 사용자 제공 캡처) ──────────────────────────
 *  A) wich-therapy.netlify.app / metroheal.netlify.app
 *     제목  `{시도} {구} {동} 출장 {수식어} 마사지 - {브랜드} ,{지역범위} 프리미엄…`
 *     설명  감성 카피 1문장 + 신호 3개를 가운뎃점으로(후불제·빠른 도착·상시 대기)
 *     특징  ① 지역경로를 시도부터 동까지 **다 적는다**  ② 동마다 **수식어를 바꿔**
 *           같은 구 안에서도 제목이 안 겹치게 한다(신길7동 '케어' / 신길6동 '웰니스'
 *           / 신길4동 '전신 피로회복 힐링 테라피')  ③ 꼬리에 브랜드와 커버리지
 *     약점  설명이 형용사 위주라 **지역어가 한 번도 안 나온다**(동 이름이 설명에 없다).
 *  B) bangmuncare.com / caremap24.com
 *     제목  `{동} 출장 {코스} 마사지·홈타이 | {구} 안마 방문 | {브랜드}` — 3토막 파이프
 *     설명  `{시도} {구} {동} 출장 마사지·홈타이·안마.` + 셀링 1문장 + 요금/시간 1문장
 *     특징  ① 키워드 묶음 `마사지·홈타이·안마` 를 제목과 설명에 **같이** 넣는다
 *           ② 설명 첫머리에 **지역경로 전체**를 둬서 계층마다 설명이 저절로 갈린다
 *     약점  모든 동의 설명 2·3문장이 **글자까지 같다**(요금·시간 고정문).
 *
 * ── 루네사가 가져갈 것 / 바꿀 것 ────────────────────────────────────────────
 *  가져간다: A의 '전체 지역경로 + 동마다 코스어 교체', B의 '3토막 + 키워드 묶음'
 *  바꾼다  : ① 설명 **첫머리에 지역경로**(A의 약점 보완)
 *            ② 설명 가운데 문장을 **그 동네의 실제 사실**(인접 행정동·방위·거리)로 채워
 *               동마다 글자가 달라지게 한다(B의 약점 보완)
 *            ③ 꼬리 문장도 시드로 돌려 고정문이 생기지 않게 한다
 *            ④ `마사지` 는 제목에 **한 번만**(스터핑 방지)
 */
import { hash, km } from './util.mjs';

/** 해시 문자열에서 slot 번째 3자리를 떼어 배열 길이로 나눈 나머지. */
function at(h, arr, slot = 0) {
  return arr[parseInt(h.substr((slot * 3) % 29, 3), 16) % arr.length];
}

export const BRAND = '루네사';

/** 제목에 끼우는 코스어 — 동·구마다 돌려 가며 쓴다. */
const COURSE_WORD = ['스웨디시', '아로마', '타이', '건식', '딥티슈', '경락', '스포츠', '림프', '전신', '릴렉스'];
/** 동 제목 꼬리 */
const DONG_TAIL = ['24시 방문', '심야 방문 예약', '당일 방문 접수', '24시 홈케어 접수'];
/** 구 제목 행동어 */
const GU_ACT = ['안마 방문 예약', '안마 방문 상담', '안마 방문 접수', '안마 방문 안내'];

export const SIDO_ISO = { 서울: 'KR-11', 부산: 'KR-26', 인천: 'KR-28', 경기: 'KR-41' };

export function courseWord(seed, slot = 0) {
  return at(hash(seed, 'cw'), COURSE_WORD, slot);
}

/* ── 제목 ─────────────────────────────────────────────────────────── */
export const title = {
  home: () => `${BRAND} 출장마사지 - 서울·경기·인천·부산 홈타이·안마 24시 방문`,
  sido: (sd) => `${sd.name} 출장마사지·홈타이 방문 - ${BRAND} | ${sd.name} 구·동별 안마 안내`,
  gu: (sd, g) =>
    `${g.name} 출장 ${courseWord(`${sd.name}/${g.name}`)} 마사지·홈타이 - ${BRAND} | ${sd.name} ${at(hash(sd.name, g.name, 'act'), GU_ACT)}`,
  dong: (sd, g, d) => {
    const h = hash(sd.name, g.name, d.dong);
    return `${sd.name} ${g.name} ${d.dong} 출장 ${at(h, COURSE_WORD, 0)} 마사지·홈타이 - ${BRAND} | ${at(h, DONG_TAIL, 1)}`;
  },
  course: (c) => `${c.ko} 출장마사지·홈타이 - ${BRAND} | 수도권·부산 24시 방문 관리`,
  sidoCourse: (sd, c) => `${sd.name} ${c.ko} 출장마사지·홈타이 - ${BRAND} | ${sd.name} 안마 방문 예약`,
  page: (t) => `${t} - ${BRAND} 출장마사지·홈타이`,
};

/* ── 디스크립션 ───────────────────────────────────────────────────── */
const KEY = '출장마사지·홈타이·안마 방문';

/** 동 설명 가운데 문장 — 그 동네의 실제 값(인접 동·방위·거리)으로 짠다. */
function dongMiddle(sd, g, d, h) {
  const n0 = d.near[0], n1 = d.near[1];
  const frames = [
    () => `${n0.dong}·${n1.dong} 방면도 같은 동선입니다`,
    () => `${g.name} ${d.dir}쪽이라 ${n0.dong}까지 ${km(n0.km)} 거리입니다`,
    () => `${n0.dong} 방향 접수와 묶어 움직입니다`,
    () => `${g.name} 안에서도 ${d.dir}편에 있어 ${n1.dong}과 함께 돕니다`,
    () => `가까운 ${n0.dong}·${n1.dong}까지 ${km(n1.km)} 안쪽입니다`,
    () => `${d.dir}편 ${n0.dong} 경계까지 한 동선으로 봅니다`,
  ];
  return frames[parseInt(h.substr(6, 3), 16) % frames.length]();
}
const TAIL = [
  '후불제로 접수하고 24시간 받습니다',
  '요금은 끝나고 치르며 밤에도 접수합니다',
  '후불제·연중무휴로 상담합니다',
  '24시간 접수하고 비용은 마친 뒤 치릅니다',
];

export const desc = {
  home: () => '서울·경기·인천·부산 전 행정동 출장마사지·홈타이·안마 방문 안내. 사는 동 이름으로 바로 찾고, 후불제로 접수해 24시간 연중무휴 상담합니다.',
  sido: (sd, stat) =>
    `${sd.name} 전역 ${KEY} 안내. ${sd.gu[0].name}부터 ${sd.gu[sd.gu.length - 1].name}까지 시군구와 행정동을 따로 적어 뒀습니다. 후불제·24시간 접수.`,
  gu: (sd, g) => {
    const h = hash(sd.name, g.name, 'desc');
    const d0 = g.dong[parseInt(h.substr(0, 3), 16) % g.dong.length];
    const d1 = g.dong[parseInt(h.substr(3, 3), 16) % g.dong.length];
    const two = d0.dong === d1.dong ? g.dong[(g.dong.indexOf(d0) + 1) % g.dong.length].dong : d1.dong;
    return `${sd.name} ${g.name} ${KEY} 안내. ${d0.dong}·${two} 등 ${g.name} 안쪽으로 이동합니다. ${TAIL[parseInt(h.substr(6, 3), 16) % TAIL.length]}.`;
  },
  dong: (sd, g, d) => {
    const h = hash(sd.name, g.name, d.dong, 'desc');
    return `${sd.name} ${g.name} ${d.dong} ${KEY} 안내. ${dongMiddle(sd, g, d, h)}. ${TAIL[parseInt(h.substr(9, 3), 16) % TAIL.length]}.`;
  },
  course: (c) => `${c.ko} 출장마사지 방문 안내. ${c.line} ${c.min}분 ${c.price.toLocaleString('ko-KR')}원부터이며 서울·경기·인천·부산에서 접수합니다.`,
  sidoCourse: (sd, c) => `${sd.name} ${c.ko} ${KEY} 안내. ${c.for} 고르는 구성입니다. ${sd.name} 시군구 어디든 후불제로 접수합니다.`,
};

/** 80자 예산을 넘기면 문장 단위로 자른다(어중간하게 끊기지 않게). */
export function clampDesc(s, limit = 95) {
  if (s.length <= limit) return s;
  const parts = s.split(/(?<=\.)\s+/);
  let out = '';
  for (const p of parts) {
    if ((out + p).length > limit) break;
    out += (out ? ' ' : '') + p;
  }
  return out || s.slice(0, limit - 1) + '…';
}
