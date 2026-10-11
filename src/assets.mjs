import fs from 'node:fs';
import path from 'node:path';

const INK = '#12172B';      // 밤 네이비 — 바탕
const INK2 = '#1C2340';     // 한 단 밝은 네이비
const GOLD = '#E3C083';     // 샴페인 골드 — 강조
const PAPER = '#F6F3EC';    // 종이
const TEXT = '#22262F';     // 종이 위 본문
const DIM = '#5E6473';
const LINE = '#DED7C8';
const GOLD_D = '#7A6436';   // 밝은 바탕에 올리는 금빛 — WCAG AA 를 맞춘 어두운 값

export const CSS = `
:root{--ink:${INK};--ink2:${INK2};--gold:${GOLD};--paper:${PAPER};--text:${TEXT};--dim:${DIM};--line:${LINE};--goldd:${GOLD_D};
--wrap:1120px;--r:4px}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--text);word-break:keep-all;line-height:1.72;
font-family:"Pretendard","Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",system-ui,sans-serif;font-size:16px}
img,svg{max-width:100%}
a{color:inherit}
h1,h2,h3{line-height:1.42;letter-spacing:-.01em;margin:0}
p{margin:0 0 .9em}
ul,ol{margin:0;padding:0;list-style:none}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.skip{position:absolute;left:-9999px;top:0;z-index:99;background:var(--gold);color:var(--ink);padding:.6rem 1rem;font-weight:700}
.skip:focus{left:0}
:focus-visible{outline:2px solid var(--gold);outline-offset:2px}

/* 머리 */
.hd{background:var(--ink);color:#fff;position:sticky;top:0;z-index:30;border-bottom:1px solid rgba(227,192,131,.28)}
.hd-in{max-width:var(--wrap);margin:0 auto;padding:.55rem 1rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap}
.bi{display:flex;align-items:center;gap:.45rem;text-decoration:none;font-weight:800;letter-spacing:-.02em}
.mk{width:22px;height:22px;fill:var(--gold);flex:none}
.bi-t{font-size:1.12rem;color:#fff}
.bi-s{font-size:.66rem;color:var(--gold);letter-spacing:.14em;text-transform:uppercase;font-weight:600}
.gnb{display:flex;gap:.1rem;flex:1 1 auto;flex-wrap:wrap}
.gnb a{padding:.4rem .62rem;font-size:.9rem;text-decoration:none;color:#D9DCE6;border-radius:var(--r)}
.gnb a:hover{background:rgba(255,255,255,.08);color:#fff}
.gnb a[aria-current]{color:var(--ink);background:var(--gold);font-weight:700}
.hd-tel{display:none;text-decoration:none;color:var(--gold);font-weight:700;font-variant-numeric:tabular-nums;
border:1px solid rgba(227,192,131,.5);padding:.34rem .7rem;border-radius:999px;font-size:.92rem}
@media(min-width:900px){.hd-tel{display:inline-block}}

/* 빵부스러기 */
.crumb{max-width:var(--wrap);margin:0 auto;padding:.7rem 1rem 0;font-size:.8rem;color:var(--dim)}
.crumb ol{display:flex;flex-wrap:wrap;gap:.3rem}
.crumb li+li::before{content:"›";margin-right:.3rem;color:var(--line)}
.crumb a{text-decoration:none;color:var(--dim)}
.crumb a:hover{color:var(--text);text-decoration:underline}

main{max-width:var(--wrap);margin:0 auto;padding:1.1rem 1rem 4.5rem}
.pg-h1{font-size:clamp(1.4rem,4.4vw,2.05rem);font-weight:800;margin:.5rem 0 1rem;letter-spacing:-.025em}
.lead{border-left:3px solid var(--gold);padding:.1rem 0 .1rem 1rem;margin:0 0 1.6rem;max-width:62rem}
.lead p{margin:0 0 .75em}
.lead p:last-child{margin-bottom:0}

/* 대문 */
.is-home .pg-h1{margin-bottom:.4rem}
.hero{background:var(--ink);color:#EDEFF5;border-radius:var(--r);padding:1.4rem 1.2rem;margin:0 0 1.6rem}
.hero-k{color:var(--gold);font-weight:700;letter-spacing:.02em;margin:0 0 .5em}
.hero-l{margin:0 0 1.1em;max-width:46rem;color:#D4D8E4}
.hero-cta{display:flex;gap:.6rem;flex-wrap:wrap;margin:0 0 1.2em}
.btn{display:inline-block;background:var(--gold);color:var(--ink);text-decoration:none;font-weight:800;
padding:.7rem 1.1rem;border-radius:999px;font-variant-numeric:tabular-nums}
.btn-l{background:transparent;color:var(--gold);border:1px solid rgba(227,192,131,.55);font-weight:600}
.hero-sg{display:grid;grid-template-columns:repeat(2,1fr);gap:.7rem;border-top:1px solid rgba(255,255,255,.12);padding-top:1rem}
.hero-sg strong{display:block;color:var(--gold);font-size:1rem}
.hero-sg span{font-size:.8rem;color:#A8AFC2}
@media(min-width:760px){.hero{padding:2.2rem 2rem}.hero-sg{grid-template-columns:repeat(4,1fr)}}

/* 구역 */
.sc{margin:0 0 2.2rem}
.sc-hd{margin:0 0 .9rem;border-bottom:1px solid var(--line);padding-bottom:.55rem}
.sc-hd h2{font-size:clamp(1.08rem,2.6vw,1.3rem);font-weight:800;letter-spacing:-.02em;position:relative;padding-left:.95rem}
.sc-hd h2::before{content:"";position:absolute;left:0;top:.52em;width:.52rem;height:.52rem;border-radius:50%;
background:var(--gold);box-shadow:inset -2px -1px 0 0 var(--paper)}
.sc-sub{margin:.35rem 0 0 .95rem;font-size:.86rem;color:var(--dim)}
.sc-p{max-width:62rem}
.sc-tail{margin-top:.9rem;font-size:.9rem;color:var(--dim)}
.sc-tail a{color:var(--text)}

/* 표 */
.ft-dl{display:grid;gap:0;border:1px solid var(--line);border-radius:var(--r);overflow:hidden;margin:0 0 2.2rem;background:#fff}
.ft-row{display:grid;grid-template-columns:7.5rem 1fr;border-bottom:1px solid var(--line)}
.ft-row:last-child{border-bottom:0}
.ft-row dt{background:#FBF9F4;padding:.62rem .8rem;font-size:.85rem;font-weight:700;color:var(--dim)}
.ft-row dd{margin:0;padding:.62rem .8rem;font-size:.92rem}
.ft-row dd a{color:var(--text)}
.tw{overflow-x:auto}
table.pr{width:100%;border-collapse:collapse;background:#fff;font-size:.92rem}
table.pr th,table.pr td{border:1px solid var(--line);padding:.56rem .7rem;text-align:left}
table.pr thead th{background:var(--ink);color:#fff;font-weight:700;font-size:.86rem}
table.pr tbody th{background:#FBF9F4;white-space:nowrap}

/* 코스 */
.cs-ul{display:grid;gap:.7rem;grid-template-columns:1fr}
@media(min-width:600px){.cs-ul{grid-template-columns:repeat(2,1fr)}}
@media(min-width:960px){.cs-ul{grid-template-columns:repeat(4,1fr)}}
.cs{border:1px solid var(--line);border-radius:var(--r);padding:.8rem;background:#fff}
.cs-a{display:flex;flex-direction:column;gap:.15rem;text-decoration:none;margin-bottom:.4rem}
.cs-k{font-weight:800;font-size:1.02rem}
.cs-m{font-size:.82rem;color:var(--goldd);font-variant-numeric:tabular-nums;font-weight:700}
.cs-d{margin:0;font-size:.84rem;color:var(--dim);line-height:1.6}

/* 절차 */
.st-ol{display:grid;gap:.8rem}
@media(min-width:800px){.st-ol{grid-template-columns:repeat(4,1fr)}}
.st{display:flex;gap:.65rem;border-top:2px solid var(--ink);padding-top:.7rem}
.st-n{flex:none;width:1.55rem;height:1.55rem;border-radius:50%;background:var(--ink);color:var(--gold);
display:grid;place-items:center;font-weight:800;font-size:.82rem}
.st-t{font-size:.97rem;font-weight:800;margin:0 0 .25rem}
.st-d{margin:0;font-size:.85rem;color:var(--dim)}

/* 목록 격자 */
.lt-ul,.dx-ul{display:grid;gap:.4rem;grid-template-columns:repeat(2,1fr)}
@media(min-width:620px){.lt-ul,.dx-ul{grid-template-columns:repeat(3,1fr)}}
@media(min-width:960px){.lt-ul,.dx-ul{grid-template-columns:repeat(4,1fr)}}
.lt-ul a,.dx-ul a{display:block;padding:.5rem .65rem;background:#fff;border:1px solid var(--line);
border-radius:var(--r);text-decoration:none;font-size:.88rem}
.lt-ul a:hover,.dx-ul a:hover{border-color:var(--ink);background:#FFFDF8}
.dx-ul li.on a{background:var(--ink);color:#fff;border-color:var(--ink);font-weight:700}

/* 가까운 동 */
.nr-ul{display:grid;gap:.5rem;grid-template-columns:1fr}
@media(min-width:620px){.nr-ul{grid-template-columns:repeat(3,1fr)}}
.nr-ul a{display:grid;grid-template-columns:1fr auto;gap:.15rem .5rem;padding:.6rem .75rem;background:#fff;
border:1px solid var(--line);border-radius:var(--r);text-decoration:none}
.nr-d{font-weight:700}
.nr-g{grid-column:1;font-size:.78rem;color:var(--dim)}
.nr-k{grid-row:1/3;align-self:center;font-size:.82rem;font-weight:700;color:var(--dim);font-variant-numeric:tabular-nums}

/* 시도·구 고르기 */
.pk-ul,.gx-ul{display:grid;gap:.6rem;grid-template-columns:1fr}
@media(min-width:620px){.pk-ul{grid-template-columns:repeat(2,1fr)}.gx-ul{grid-template-columns:repeat(3,1fr)}}
@media(min-width:960px){.pk-ul{grid-template-columns:repeat(4,1fr)}.gx-ul{grid-template-columns:repeat(4,1fr)}}
.pk-ul a,.gx-ul a{display:block;padding:.8rem;background:#fff;border:1px solid var(--line);border-radius:var(--r);text-decoration:none}
.pk-ul a:hover,.gx-ul a:hover{border-color:var(--ink)}
.pk-n,.gx-n{display:block;font-weight:800;font-size:1.05rem;margin-bottom:.18rem}
.pk-s,.gx-s{display:block;font-size:.8rem;color:var(--goldd);font-weight:700}
.pk-g{display:block;font-size:.78rem;color:var(--dim);margin-top:.3rem}

/* 바로가기 */
.qk{display:grid;gap:1rem;grid-template-columns:repeat(2,1fr)}
@media(min-width:860px){.qk{grid-template-columns:repeat(4,1fr)}}
.qk-h{font-size:.95rem;margin:0 0 .4rem;border-bottom:1px solid var(--line);padding-bottom:.3rem}
.qk-h a{text-decoration:none}
.qk ul li a{display:block;padding:.26rem 0;font-size:.85rem;color:var(--dim);text-decoration:none}
.qk ul li a:hover{color:var(--text);text-decoration:underline}

/* 문답 */
.fq{border-bottom:1px dashed var(--line);padding:.75rem 0}
.fq:last-child{border-bottom:0}
.fq-q{font-size:.98rem;font-weight:800;margin:0 0 .3rem;padding-left:1.15rem;position:relative}
.fq-q::before{content:"Q";position:absolute;left:0;color:var(--goldd);font-weight:800}
.fq-a{margin:0;font-size:.92rem;color:#3A3F4C;padding-left:1.15rem}

/* 알림 */
.nt-ul{display:grid;gap:.45rem}
.nt-ul li{background:#fff;border:1px solid var(--line);border-left:3px solid var(--gold);
border-radius:var(--r);padding:.6rem .8rem;font-size:.9rem}

/* 글 */
.rc-ul{display:grid;gap:.55rem}
.rc-ul li{display:flex;justify-content:space-between;gap:.8rem;align-items:baseline;
background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:.65rem .8rem}
.rc-ul a{text-decoration:none;flex:1}
.rc-t{display:block;font-weight:700}
.rc-s{display:block;font-size:.84rem;color:var(--dim);margin-top:.15rem}
.rc-ul time{font-size:.78rem;color:var(--dim);white-space:nowrap;font-variant-numeric:tabular-nums}
.po-meta{font-size:.82rem;color:var(--dim)}
.po-sum{font-size:1.02rem;font-weight:700;border-left:3px solid var(--gold);padding-left:.85rem;margin-bottom:1.4rem}
.po{max-width:44rem}
.po h2{font-size:1.1rem;margin:1.6rem 0 .5rem;padding-top:.9rem;border-top:1px solid var(--line)}
.art{max-width:50rem;margin:0 0 1.5rem}
.art h2{font-size:1.02rem;margin:0 0 .35rem}
.hw-ol{display:grid;gap:.5rem;counter-reset:hw}
.hw-ol li{background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:.6rem .8rem .6rem 2.4rem;position:relative;font-size:.92rem}
.hw-ol li::before{counter-increment:hw;content:counter(hw);position:absolute;left:.8rem;top:.6rem;
color:var(--goldd);font-weight:800}

/* 꼬리 */
.ft{background:var(--ink);color:#C9CEDC;margin-top:2rem;padding-bottom:4.2rem}
.ft-in{max-width:var(--wrap);margin:0 auto;padding:2rem 1rem 1.4rem;display:grid;gap:1.6rem;grid-template-columns:1fr}
@media(min-width:760px){.ft-in{grid-template-columns:1.5fr 1fr 1fr 1.3fr}.ft{padding-bottom:0}}
.ft-h{font-size:.92rem;color:var(--gold);margin:0 0 .6rem;letter-spacing:.02em}
.ft-p{font-size:.85rem;margin:0 0 .7em;color:#AEB5C7}
.ft-tel a{font-size:1.18rem;font-weight:800;color:#fff;text-decoration:none;font-variant-numeric:tabular-nums}
.ft-h2{display:block;font-size:.8rem;color:var(--gold);margin-top:.2rem}
.ft-biz{font-size:.78rem;color:#8E95A8;margin-top:.8em;line-height:1.75}
.ft-dim{color:#8E95A8}
.ft-ul li{padding:.16rem 0}
.ft-ul a{font-size:.86rem;color:#C9CEDC;text-decoration:none}
.ft-ul a:hover{color:#fff;text-decoration:underline}
.ft-ul time{display:block;font-size:.72rem;color:#8E95A8}
.ft-feed{display:flex;gap:.8rem;margin-top:.7rem;border-top:1px solid rgba(255,255,255,.1);padding-top:.6rem}
.ft-note{font-size:.76rem;color:#8E95A8;margin-top:.6rem}
.ft-bar{border-top:1px solid rgba(255,255,255,.1)}
.ft-bar p{max-width:var(--wrap);margin:0 auto;padding:.7rem 1rem;font-size:.76rem;color:#8E95A8;line-height:1.7}
.ft-ai strong{color:#B9C0D2}
.ft-cr{border-top:1px solid rgba(255,255,255,.07)}

/* 전화 바 */
.cbar{position:fixed;left:0;right:0;bottom:0;z-index:40;display:flex;align-items:center;justify-content:space-between;
gap:.6rem;background:var(--gold);color:var(--ink);padding:.5rem .9rem;box-shadow:0 -2px 10px rgba(0,0,0,.18)}
.cbar-tel{text-decoration:none;color:var(--ink);display:flex;align-items:baseline;gap:.5rem}
.cbar-k{font-weight:800;font-size:.86rem}
.cbar-n{font-weight:800;font-size:1.08rem;font-variant-numeric:tabular-nums}
.cbar-s{font-size:.74rem;font-weight:700;opacity:.78}
@media(min-width:900px){.cbar{display:none}}

/* 찾기 상자 */
.flt{margin:0 0 .7rem}
.flt input{width:100%;max-width:22rem;padding:.55rem .75rem;border:1px solid var(--line);border-radius:var(--r);
font-size:.92rem;font-family:inherit;background:#fff}
.flt input:focus{outline:2px solid var(--gold);outline-offset:1px}
.is-hide{display:none !important}
@media print{.hd,.cbar,.ft{display:none}}
`;

export const JS = `/* 구 페이지의 행정동 목록을 눌러서 찾기 — 서버가 보낸 HTML 은 건드리지 않는다. */
(function () {
  var list = document.querySelector('#dongidx .dx-ul') || document.querySelector('#guidx .gx-ul');
  if (!list || list.children.length < 12) return;
  var wrap = document.createElement('div');
  wrap.className = 'flt';
  var input = document.createElement('input');
  input.type = 'search';
  input.setAttribute('aria-label', '동네 이름으로 추리기');
  input.placeholder = '동네 이름 일부를 적으면 추려집니다';
  wrap.appendChild(input);
  list.parentNode.insertBefore(wrap, list);
  input.addEventListener('input', function () {
    var q = input.value.trim();
    for (var i = 0; i < list.children.length; i++) {
      var li = list.children[i];
      li.classList.toggle('is-hide', q !== '' && li.textContent.indexOf(q) === -1);
    }
  });
})();
`;

function favicon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="${INK}"/><path d="M40 12a20 20 0 1 0 13.3 24.8A16.3 16.3 0 0 1 40 12Z" fill="${GOLD}"/><circle cx="47" cy="19" r="2.6" fill="${GOLD}"/></svg>`;
}
function logo(cfg) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 64"><rect width="260" height="64" fill="${INK}"/><path d="M34 14a18 18 0 1 0 12 22.3A14.7 14.7 0 0 1 34 14Z" fill="${GOLD}"/><circle cx="40" cy="20" r="2.3" fill="${GOLD}"/><text x="62" y="34" font-family="system-ui,sans-serif" font-size="22" font-weight="700" fill="#ffffff">${cfg.brand.ko}</text><text x="62" y="49" font-family="system-ui,sans-serif" font-size="10" letter-spacing="3" fill="${GOLD}">${cfg.brand.en.toUpperCase()}</text></svg>`;
}
function og(cfg) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="${INK}"/><path d="M980 90a150 150 0 1 0 100 186A122 122 0 0 1 980 90Z" fill="${GOLD}" opacity=".16"/><text x="80" y="300" font-family="system-ui,sans-serif" font-size="78" font-weight="800" fill="#ffffff">${cfg.brand.ko} 출장마사지</text><text x="80" y="380" font-family="system-ui,sans-serif" font-size="40" fill="${GOLD}">${cfg.coverage.sido.join(' · ')} 홈타이 방문</text><text x="80" y="460" font-family="system-ui,sans-serif" font-size="30" fill="#AEB5C7">${cfg.hours} · ${cfg.pay} · 행정동 단위 안내</text></svg>`;
}

export function writeAssets(dist, cfg) {
  const dir = path.join(dist, 'assets');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'lunessa.css'), CSS.trim());
  fs.writeFileSync(path.join(dir, 'lunessa.js'), JS);
  fs.writeFileSync(path.join(dir, 'favicon.svg'), favicon());
  fs.writeFileSync(path.join(dir, 'logo.svg'), logo(cfg));
  fs.writeFileSync(path.join(dir, 'og.svg'), og(cfg));
}
