/**
 * 구조화 데이터. 전 페이지에 BreadcrumbList + WebPage 를 깔고, 계층별로
 * Service·Place·ItemList·FAQPage 를 더한다.
 *
 * ★주소가 없는 출장(방문) 사업이라 LocalBusiness 는 쓰지 않는다.
 *   LocalBusiness 는 address 를 요구하는데 지어내면 허위 신호가 된다.
 *   대신 Organization(사업 주체) + Service(areaServed) + Place(지역 자체) 로 나눈다.
 */
const CTX = 'https://schema.org';

export function organization(cfg, url) {
  const o = {
    '@type': 'Organization', '@id': `${url}/#org`,
    name: cfg.brand.ko, alternateName: cfg.brand.en, url: `${url}/`,
    description: `${cfg.coverage.sido.join('·')} 전 행정동에서 받는 출장마사지·홈타이 방문 관리`,
    telephone: cfg.tel, logo: `${url}/assets/logo.svg`,
    areaServed: cfg.coverage.sido.map((s) => ({ '@type': 'AdministrativeArea', name: s })),
    contactPoint: {
      '@type': 'ContactPoint', telephone: cfg.tel, contactType: '예약·상담',
      availableLanguage: ['ko'], areaServed: 'KR',
      hoursAvailable: { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], opens: '00:00', closes: '23:59' },
    },
  };
  if (cfg.business.address) o.address = { '@type': 'PostalAddress', streetAddress: cfg.business.address, addressCountry: 'KR' };
  if (cfg.business.regNo) o.identifier = { '@type': 'PropertyValue', name: '사업자등록번호', value: cfg.business.regNo };
  if (cfg.business.email) o.email = cfg.business.email;
  return o;
}

export function website(cfg, url) {
  return {
    '@type': 'WebSite', '@id': `${url}/#site`,
    url: `${url}/`, name: `${cfg.brand.ko} 출장마사지`, inLanguage: 'ko-KR',
    publisher: { '@id': `${url}/#org` },
  };
}

export function webpage({ url, siteUrl, title, desc, updated, breadcrumbId }) {
  return {
    '@type': 'WebPage', '@id': `${url}#page`, url, name: title, description: desc,
    inLanguage: 'ko-KR', isPartOf: { '@id': `${siteUrl}/#site` },
    dateModified: '@@LM@@', ...(breadcrumbId ? { breadcrumb: { '@id': breadcrumbId } } : {}),
  };
}

export function breadcrumb(url, items) {
  return {
    '@type': 'BreadcrumbList', '@id': `${url}#crumb`,
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
  };
}

export function place(id, name, geo, containedIn) {
  const p = { '@type': 'Place', '@id': id, name, geo: { '@type': 'GeoCoordinates', latitude: geo.lat, longitude: geo.lng } };
  if (containedIn) p.containedInPlace = containedIn;
  return p;
}

export function service({ siteUrl, url, name, desc, areaServed, courses, tel }) {
  return {
    '@type': 'Service', '@id': `${url}#service`,
    name, description: desc, serviceType: '출장마사지·홈타이 방문 관리',
    provider: { '@id': `${siteUrl}/#org` },
    areaServed,
    availableChannel: { '@type': 'ServiceChannel', serviceUrl: url, servicePhone: { '@type': 'ContactPoint', telephone: tel } },
    ...(courses ? {
      hasOfferCatalog: {
        '@type': 'OfferCatalog', name: '코스',
        itemListElement: courses.map((c) => ({
          '@type': 'Offer', name: `${c.ko} ${c.min}분`,
          price: String(c.price), priceCurrency: 'KRW',
          availability: 'https://schema.org/InStock',
          itemOffered: { '@type': 'Service', name: `${c.ko} 출장마사지`, description: c.line },
        })),
      },
    } : {}),
  };
}

export function itemList(id, name, items) {
  return {
    '@type': 'ItemList', '@id': id, name, numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, url: it.url })),
  };
}

export function faqPage(url, qa) {
  return {
    '@type': 'FAQPage', '@id': `${url}#faq`,
    mainEntity: qa.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })),
  };
}

export function graph(nodes) {
  return JSON.stringify({ '@context': CTX, '@graph': nodes.filter(Boolean) });
}
