# 루네사 (Lunessa) — 출장마사지·홈타이 방문 안내 사이트

서울·경기·인천·부산 **행정동 1,393곳**을 한 쪽씩 깔아 둔 정적 사이트다.
외부 라이브러리 없이 Node 표준 라이브러리만으로 빌드하며, Netlify 에 그대로 올라간다.

```
페이지 1,551쪽  =  홈 1 + 안내 7 + 글 7 + 코스 8 + 시도 4 + 시도·코스 32 + 시군구 99 + 행정동 1,393 + 404
```

## 1. 빠르게 돌려 보기

```bash
npm run build     # dist/ 생성 (약 2초)
npm run check     # 자체 검사 — 끊긴 링크·중복 타이틀·스키마·고아 페이지
npm run serve     # http://127.0.0.1:8788
node scripts/simil.mjs   # 같은 유형 페이지끼리 본문이 얼마나 겹치는지
```

## 2. Netlify 에 올리기

1. **GitHub 저장소를 Netlify 에 연결** — Netlify → *Add new site* → *Import an existing project* → GitHub → `a9sta/Lunessa-Massage`
2. 빌드 설정은 `netlify.toml` 에 적혀 있어 손댈 것이 없다.
   - Build command `npm run build` · Publish directory `dist` · Node 20
3. **도메인을 붙이면** *Site configuration → Environment variables* 에 `SITE_URL` 을 그 주소로 넣는다.
   안 넣으면 Netlify 가 주는 배포 주소(`URL`)를 canonical·사이트맵·스키마에 자동으로 쓴다.
4. 배포가 끝나면 다음을 확인한다.
   - `/sitemap.xml` · `/rss.xml` · `/robots.txt` · `/llms.txt`
   - 네이버 서치어드바이저 → 사이트 등록 → **소유확인 메타**를 받아
     `data/site.config.json` 의 `naverVerification` 에 넣고 다시 배포 → 사이트맵 제출

`netlify.toml` 이 함께 넣는 것: 보안 헤더(CSP·X-Frame-Options 등), `/assets/*` 1년 캐시,
XML 콘텐츠 타입, `/index.html` → `/` 301.

## 3. 바꿀 일이 있을 때 손대는 곳

| 바꿀 것 | 파일 |
|---|---|
| 브랜드명·대표번호·운영시간·후불 문구·사업자 정보 | `data/site.config.json` |
| 코스·시간·금액·설명 | `data/courses.json` |
| 타이틀/디스크립션 **공식** | `src/lib/seo.mjs` (머리 주석에 경쟁사 분석까지 적어 두었다) |
| 본문 문장 풀(리드·FAQ·주의·앵커) | `src/content/copy.mjs` |
| 글(매거진) | `src/content/posts.mjs` |
| 디자인(CSS·JS·로고) | `src/assets.mjs` |
| 행정구역 자료 갱신 | `node scripts/build-regions.mjs <geojson>` → `data/regions.json` |

`data/site.config.json` 의 `business` 는 비워 두면 푸터·스키마에서 그 줄을 빼고 출력한다.
사업자등록번호·주소·책임자를 채우면 **네이버 C랭크 '출처 명확성' 신호**가 켜진다. 채우는 쪽이 좋다.

## 4. 지역 자료

`data/regions.json` 은 공개 행정동 경계 자료에서 뽑았다.

- 출처: [admdongkor](https://github.com/vuski/admdongkor) `HangJeongDong_ver20260701` · **CC BY 4.0** (원자료 국가공간정보포털)
- 뽑아낸 값: 행정동 이름, 시군구, **면적 가중 중심점 좌표**, **면적(㎢)**, 중심점 거리순 **인접 행정동 6곳**, 구 중심 기준 방위
- 이 값들이 페이지마다 다른 문장을 만드는 재료다. 좌표는 `geo.position`·`ICBM`·`Place.geo` 로도 나간다.

## 5. 중복·도어웨이를 막는 장치

행정동 1,393쪽은 틀 하나로 찍으면 바로 도어웨이가 된다. 그래서:

- **리드 3문단**을 그 동네의 실제 값(방위·거리·인접 동·면적 순위)으로 조립한다 — 틀 8×6×5벌
- **접수 흐름 3벌 / 주의 10개 중 3 / FAQ 14문항 중 4, 답변은 각 2벌 / 코스 설명 3벌**을
  페이지 키의 md5 로 골라 끼운다
- **롱테일 앵커도 6틀을 돌린다** (`… 방문 안내`·`… 출장 접수` …)
- 결과: 동 페이지끼리 본문 겹침 **평균 28.5%** (손대기 전 55.7%)

**같은 주소면 늘 같은 HTML 이 나온다.** 난수를 쓰지 않고 md5 시드만 쓴다 — 두 번 빌드해 해시가 같은지 확인했다.

## 6. 하지 않는 것

- 후기·평점·체험담을 만들어 싣지 않는다 (`aggregateRating` 스키마도 쓰지 않는다)
- 사람 사진·AI 생성 실사 이미지를 쓰지 않는다
- 주소 없는 방문 사업이므로 `LocalBusiness` 를 쓰지 않는다 — `Organization` + `Service` + `Place` 로 나눈다
- 푸터에 키워드를 나열하지 않는다
- 외부 분석 스크립트·광고 추적 쿠키를 넣지 않는다 (CSP 로도 막아 두었다)

푸터에는 **AI 활용 고지**가 들어간다.
