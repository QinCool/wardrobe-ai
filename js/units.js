// 单位换算与币种符号：厘米/英寸显示切换、价格符号。
// 衣柜内所有尺寸一律以厘米（cm）存，显示时可按偏好切换成英寸（inch）。
// 尺码建议、鞋码对照、天气、日历、行程等交互都在 Personal Agent 聊天里
// 由 Skill 完成，不在本页做。

const INCH_TO_CM = 2.54;

function cmToInch(v) {
  const n = parseFloat(v);
  if (Number.isNaN(n)) return '';
  return String(Math.round((n / INCH_TO_CM) * 10) / 10);
}

// ---------- 币种 ----------
const CURRENCY_SYMBOLS = { CNY: '¥', USD: '$', EUR: '€', GBP: '£', JPY: '¥', KRW: '₩' };

function formatPrice(value, currency) {
  if (value === undefined || value === null || String(value).trim() === '') return '';
  const symbol = CURRENCY_SYMBOLS[currency] || '';
  return symbol + value + (currency && currency !== 'CNY' ? ' ' + currency : '');
}
