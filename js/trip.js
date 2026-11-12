// 出差 / 旅行行程来源：手动、日历、粘贴订票文字、航班号查询、截图识别、邮箱。
// 所有来源统一生成行程对象 { destination, startDate, endDate, transport, hotel, notes, source }，
// 再填进已有的出差 / 旅行表单，走同一套目的地天气 + 每天穿搭 + 行李清单流程。
// 注意：国内外订票平台（携程、飞猪、12306、Skyscanner、Expedia、Booking.com 等）
// 大多没有面向个人的公开 API，所以邮箱、粘贴文字、截图这三条是主路子；
// 本应用不直连任何订票平台的账号、不保存账号密码。

function normalizeTripObject(t) {
  return {
    destination: (t.destination || '').trim(),
    startDate: (t.startDate || '').slice(0, 10),
    endDate: (t.endDate || '').slice(0, 10),
    transport: (t.transport || '').trim(),
    hotel: (t.hotel || '').trim(),
    notes: (t.notes || '').trim(),
    source: t.source || '手动',
  };
}

// 把行程对象填进出差 / 旅行表单（交通、住宿并进“当地行程说明”）
function fillTripForm(trip) {
  const t = normalizeTripObject(trip);
  if (t.destination) $('trip-city').value = t.destination;
  if (t.startDate) $('trip-start').value = t.startDate;
  if (t.endDate) $('trip-end').value = t.endDate;
  const notes = [
    t.transport && ('交通：' + t.transport),
    t.hotel && ('住宿：' + t.hotel),
    t.notes,
  ].filter(Boolean).join('；');
  if (notes) $('trip-notes').value = notes;
  return t;
}

function tripSummaryText(t) {
  const parts = [];
  if (t.destination) parts.push('目的地：' + t.destination);
  if (t.startDate) parts.push('出发：' + t.startDate);
  if (t.endDate) parts.push('返回：' + t.endDate);
  if (t.transport) parts.push('交通：' + t.transport);
  if (t.hotel) parts.push('住宿：' + t.hotel);
  if (t.notes) parts.push('备注：' + t.notes);
  return parts.join('\n');
}

// ---------- 1. 粘贴订票确认文字（携程、飞猪、12306、航司、Skyscanner、Expedia、Booking.com 等，中英文都行） ----------
// 不接任何接口，哪个平台都行；提取不到的字段留空，提取错的让用户改。
async function aiExtractTripFromText(text) {
  if (!aiConfigured()) throw new Error('请先在「AI 设置」里配置好 AI。');
  const prompt = '你是一名行程提取助手。下面是用户粘贴的订票确认文字（可能来自携程、飞猪、12306、航司 App、Skyscanner、Expedia、Kayak、Google Flights、Trip.com、CheapOair、Booking.com、Agoda、Hotels.com、Airbnb、Hostelworld、Trainline、Amtrak、Eurail、Deutsche Bahn、MakeMyTrip 等平台，可能是中文或英文订单）。\n\n' + text + '\n\n请从中提取一次出差 / 旅行行程，只返回一个 JSON 对象，不要加任何解释文字：\n{"destination": "目的地城市（英文订单保留英文原文），没有就空字符串", "startDate": "出发日期 YYYY-MM-DD，没有就空字符串", "endDate": "返回日期 YYYY-MM-DD，没有就空字符串", "transport": "航班号/车次，如 CA1831、BA249、G1234，没有就空字符串", "hotel": "酒店名，没有就空字符串", "notes": "其他有用信息，如出发/到达时间、航站楼，没有就空字符串"}\n\n规则：日期要换算成 YYYY-MM-DD；只取第一次出行（往返算一次）；提取不到的字段留空字符串，不要编造；拿不准的字段也留空。';
  const reply = await chatCompletion([
    { role: 'system', content: '你是行程提取助手，只输出 JSON。' },
    { role: 'user', content: prompt },
  ]);
  const parsed = extractJSON(reply);
  return normalizeTripObject({ destination: parsed.destination, startDate: parsed.startDate, endDate: parsed.endDate, transport: parsed.transport, hotel: parsed.hotel, notes: parsed.notes, source: '粘贴订票文字' });
}

// ---------- 2. 航班号查询（国内 / 国际航班，如 CA1831、BA249、UA857） ----------
// 用 AviationStack 免费档（每月 100 次，Key 去 aviationstack.com 申请）。
// 注意：免费档只支持 HTTP，从 HTTPS 页面（GitHub Pages）访问会被浏览器拦截；
// 遇上这种情况请改用本地 http://localhost 打开，或改粘贴文字 / 截图识别。
const STORE_TRIP = 'wardrobe-trip-settings-v1';

function loadTripSettings() {
  try { return JSON.parse(localStorage.getItem(STORE_TRIP) || '{}'); } catch { return {}; }
}

function saveTripSettings(s) {
  localStorage.setItem(STORE_TRIP, JSON.stringify(s));
}

async function lookupFlight(flightNo) {
  const s = loadTripSettings();
  const key = (s.aviationstackKey || '').trim();
  if (!key) throw new Error('航班查询需要 AviationStack 的 Key，请先在航班号查询旁填写（免费档每月 100 次，见 aviationstack.com）。');
  const m = (flightNo || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!/^[A-Z]{2,3}\d{1,4}[A-Z]?$/.test(m)) throw new Error('航班号格式不对，例如 CA1831、BA249、UA857。');
  const url = 'http://api.aviationstack.com/v1/flights?access_key=' + encodeURIComponent(key) + '&flight_iata=' + m;
  let res;
  try {
    res = await fetch(url);
  } catch (e) {
    throw new Error('航班接口请求失败（可能是 HTTPS 页面拦截了免费档的 HTTP 请求）。请改用本地 http://localhost 打开页面，或改粘贴订票文字 / 截图识别。');
  }
  if (!res.ok) throw new Error('航班接口请求失败（HTTP ' + res.status + '）。');
  const data = await res.json();
  if (data.error) throw new Error('航班接口返回错误：' + (data.error.message || data.error.code || '未知错误') + '。');
  const flights = data.data || [];
  if (!flights.length) throw new Error('没查到航班 ' + m + '，请确认航班号与日期（免费档一般只查得到近期 / 当日航班），或手动填写行程。');
  const f = flights[0];
  const dep = f.departure || {};
  const arr = f.arrival || {};
  const depTime = (dep.scheduled || '').slice(11, 16);
  const arrTime = (arr.scheduled || '').slice(11, 16);
  return normalizeTripObject({
    destination: arr.city || arr.airport || '',
    startDate: (dep.scheduled || '').slice(0, 10),
    endDate: '',
    transport: m + '（' + (dep.iata || '') + ' → ' + (arr.iata || '') +
      (depTime ? '，计划起飞 ' + depTime : '') + (arrTime ? '，到达 ' + arrTime : '') + '）',
    hotel: '',
    notes: '航班状态：' + (f.flight_status || '未知') + '；航空公司：' + ((f.airline && f.airline.name) || '') +
      '；返程日期请手动补填。',
    source: '航班号查询',
  });
}

// ---------- 3. 截图识别（12306、航旅纵横、携程、Skyscanner、Expedia 等订单截图） ----------
// 用已配置的 AI 读图，需要支持 vision 的模型（如 GPT-4o、Gemini）；
// 模型不支持时明确提示改粘贴文字。图片只在浏览器本地处理后发给已配置的 AI，不进仓库。
async function aiExtractTripFromImage(dataUrl) {
  if (!aiConfigured()) throw new Error('请先在「AI 设置」里配置好 AI。');
  const prompt = '你是一名行程提取助手。这是一张订票确认截图（可能来自 12306、航旅纵横、携程、飞猪、Skyscanner、Expedia、Kayak、Booking.com、Agoda、Airbnb、Trainline 等平台，中文或英文）。请读出其中的出差 / 旅行信息，只返回一个 JSON 对象，不要加任何解释文字：\n{"destination": "目的地城市（英文订单保留英文原文），没有就空字符串", "startDate": "出发日期 YYYY-MM-DD，没有就空字符串", "endDate": "返回日期 YYYY-MM-DD，没有就空字符串", "transport": "航班号/车次，如 CA1831、BA249、G1234，没有就空字符串", "hotel": "酒店名，没有就空字符串", "notes": "其他有用信息，如出发/到达时间，没有就空字符串"}\n\n规则：日期换算成 YYYY-MM-DD；看不清或没有的字段留空字符串，不要编造。';
  let reply;
  try {
    reply = await chatCompletionVision(prompt, dataUrl);
  } catch (e) {
    throw new Error('图片识别失败：' + e.message + '。当前 AI 模型可能不支持图片识别（需要支持 vision 的模型，如 GPT-4o、Gemini），请改粘贴订票文字。');
  }
  const parsed = extractJSON(reply);
  return normalizeTripObject({ destination: parsed.destination, startDate: parsed.startDate, endDate: parsed.endDate, transport: parsed.transport, hotel: parsed.hotel, notes: parsed.notes, source: '截图识别' });
}
