// 单位换算与尺码体系：英寸/厘米互换、鞋码 US/EU/UK/JP 对照（以脚长为准）、币种符号、国际站点识别。
// 衣柜内所有尺寸一律以厘米（cm）存，显示时可按偏好切换成英寸（inch）。

const INCH_TO_CM = 2.54;

// ---------- 长度单位 ----------
function inchToCm(v) {
  const n = parseFloat(v);
  if (Number.isNaN(n)) return '';
  return String(Math.round(n * INCH_TO_CM * 10) / 10);
}

function cmToInch(v) {
  const n = parseFloat(v);
  if (Number.isNaN(n)) return '';
  return String(Math.round((n / INCH_TO_CM) * 10) / 10);
}

// 从一段尺码表文字里判断它用的单位：inch / cm / unknown
function detectUnitFromText(text) {
  const t = (text || '').toLowerCase();
  if (/(inch|inches|\bin\b|″|"|英寸)/.test(t)) return 'inch';
  if (/(cm|厘米|公分)/.test(t)) return 'cm';
  return 'unknown';
}

// ---------- 鞋码对照表（男款 / 女款，以脚长 cm 为准） ----------
// 说明：各品牌鞋楦略有差异，同一脚长在不同品牌间常差半码；表内为常见对照，
// 最终以品牌官方尺码表为准。JP 可写成厘米（25.5）或毫米（255）；中国码 = 脚长 cm × 10。
const SHOE_SIZE_TABLE_MEN = [
  { foot: 24.0, us: '6',    eu: '38.5', uk: '5.5',  jp: '24' },
  { foot: 24.5, us: '6.5',  eu: '39',   uk: '6',    jp: '24.5' },
  { foot: 25.0, us: '7',    eu: '40',   uk: '6.5',  jp: '25' },
  { foot: 25.5, us: '7.5',  eu: '40.5', uk: '7',    jp: '25.5' },
  { foot: 26.0, us: '8',    eu: '41',   uk: '7.5',  jp: '26' },
  { foot: 26.5, us: '8.5',  eu: '42',   uk: '8',    jp: '26.5' },
  { foot: 27.0, us: '9',    eu: '42.5', uk: '8.5',  jp: '27' },
  { foot: 27.5, us: '9.5',  eu: '43',   uk: '9',    jp: '27.5' },
  { foot: 28.0, us: '10',   eu: '44',   uk: '9.5',  jp: '28' },
  { foot: 28.5, us: '10.5', eu: '44.5', uk: '10',   jp: '28.5' },
  { foot: 29.0, us: '11',   eu: '45',   uk: '10.5', jp: '29' },
  { foot: 29.5, us: '11.5', eu: '45.5', uk: '11',   jp: '29.5' },
  { foot: 30.0, us: '12',   eu: '46',   uk: '11.5', jp: '30' },
  { foot: 30.5, us: '12.5', eu: '47',   uk: '12',   jp: '30.5' },
  { foot: 31.0, us: '13',   eu: '47.5', uk: '12.5', jp: '31' },
];

const SHOE_SIZE_TABLE_WOMEN = [
  { foot: 22.0, us: '5',    eu: '35.5', uk: '3',    jp: '22' },
  { foot: 22.5, us: '5.5',  eu: '36',   uk: '3.5',  jp: '22.5' },
  { foot: 23.0, us: '6',    eu: '36.5', uk: '4',    jp: '23' },
  { foot: 23.5, us: '6.5',  eu: '37.5', uk: '4.5',  jp: '23.5' },
  { foot: 24.0, us: '7',    eu: '38',   uk: '5',    jp: '24' },
  { foot: 24.5, us: '7.5',  eu: '38.5', uk: '5.5',  jp: '24.5' },
  { foot: 25.0, us: '8',    eu: '39',   uk: '6',    jp: '25' },
  { foot: 25.5, us: '8.5',  eu: '40',   uk: '6.5',  jp: '25.5' },
  { foot: 26.0, us: '9',    eu: '40.5', uk: '7',    jp: '26' },
  { foot: 26.5, us: '9.5',  eu: '41',   uk: '7.5',  jp: '26.5' },
  { foot: 27.0, us: '10',   eu: '42',   uk: '8',    jp: '27' },
  { foot: 27.5, us: '10.5', eu: '42.5', uk: '8.5',  jp: '27.5' },
  { foot: 28.0, us: '11',   eu: '43',   uk: '9',    jp: '28' },
];

// 按脚长（cm）查对照表：取最接近的一行；超出表范围时按最接近的一端返回并标注
function shoeSizesFromFootLength(footCm, gender) {
  const foot = parseFloat(footCm);
  if (Number.isNaN(foot)) return null;
  const table = gender === 'women' ? SHOE_SIZE_TABLE_WOMEN : SHOE_SIZE_TABLE_MEN;
  let best = table[0];
  let bestDiff = Math.abs(foot - table[0].foot);
  for (const row of table) {
    const diff = Math.abs(foot - row.foot);
    if (diff < bestDiff) { best = row; bestDiff = diff; }
  }
  const outOfRange = foot < table[0].foot - 0.25 || foot > table[table.length - 1].foot + 0.25;
  return {
    foot: String(best.foot),
    us: best.us,
    eu: best.eu,
    uk: best.uk,
    jp: best.jp,
    cn: String(Math.round(foot * 10)),
    approximate: bestDiff > 0.26 || outOfRange,
  };
}

// 按任意一个体系的鞋码反查脚长（用于只知道 US 码时推算其他体系）
function shoeSizesFromCode(system, code) {
  const key = String(code).trim();
  for (const table of [SHOE_SIZE_TABLE_MEN, SHOE_SIZE_TABLE_WOMEN]) {
    const row = table.find((r) => r[system] === key);
    if (row) return { foot: String(row.foot), us: row.us, eu: row.eu, uk: row.uk, jp: row.jp, cn: String(Math.round(row.foot * 10)), approximate: false };
  }
  return null;
}

// ---------- 币种 ----------
const CURRENCY_SYMBOLS = { CNY: '¥', USD: '$', EUR: '€', GBP: '£', JPY: '¥', KRW: '₩' };
const CURRENCIES = ['CNY', 'USD', 'EUR', 'GBP', 'JPY', 'KRW'];

function formatPrice(value, currency) {
  if (value === undefined || value === null || String(value).trim() === '') return '';
  const symbol = CURRENCY_SYMBOLS[currency] || '';
  return symbol + value + (currency && currency !== 'CNY' ? ' ' + currency : '');
}

// ---------- 国际站点识别 ----------
const INTL_SITES = [
  { host: 'amazon.com', label: 'Amazon 美国' },
  { host: 'nike.com', label: 'Nike 美国' },
  { host: 'adidas.com', label: 'adidas 美国' },
  { host: 'uniqlo.com', label: 'Uniqlo 美国' },
  { host: 'gap.com', label: 'Gap 美国' },
  { host: 'oldnavy.com', label: 'Old Navy 美国' },
  { host: 'hm.com', label: 'H&M 国际' },
  { host: 'zara.com', label: 'Zara 国际' },
  { host: 'nordstrom.com', label: 'Nordstrom 美国' },
  { host: 'macys.com', label: "Macy's 美国" },
  { host: 'ssense.com', label: 'SSENSE 国际' },
  { host: 'farfetch.com', label: 'Farfetch 国际' },
  { host: 'rei.com', label: 'REI 美国' },
  { host: 'shop.lululemon.com', label: 'lululemon 美国' },
];

const CN_SITES = [
  { host: 'taobao.com', label: '淘宝' },
  { host: 'tmall.com', label: '天猫' },
  { host: 'jd.com', label: '京东' },
  { host: 'pinduoduo.com', label: '拼多多' },
  { host: 'douyin.com', label: '抖音' },
  { host: 'xiaohongshu.com', label: '小红书' },
  { host: 'dewu.com', label: '得物' },
];

// 从商品链接里识别站点；返回 { label, region: 'intl' | 'cn' | 'unknown' }
function detectSite(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    for (const s of INTL_SITES) if (host.endsWith(s.host)) return { label: s.label, region: 'intl' };
    for (const s of CN_SITES) if (host.endsWith(s.host)) return { label: s.label, region: 'cn' };
  } catch { /* 不是合法 URL */ }
  return { label: '', region: 'unknown' };
}
