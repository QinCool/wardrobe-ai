// 天气：多数据源，可在「天气设置」里切换。
// 默认 Open-Meteo（免费、无需 Key）；也可配彩云天气 Caiyun、
// OpenWeatherMap、和风天气 QWeather 的 Key。
// 各家返回字段不同，这里统一换算成 { tempMax, tempMin, precipProb, condition }
// 再交给穿搭逻辑。
//
// 定位回退链（每一步失败都会给用户一句明白的提示，绝不静默失败）：
// 1. 用户配了自己的天气源 Key → 用该源查天气；
// 2. 没配 Key（或所选源未配 Key / 请求失败）→ 自动回退到 Open-Meteo（免 Key）；
// 3. 城市留空时优先用浏览器定位（navigator.geolocation，需授权）拿经纬度；
// 4. 定位被拒 / 超时 / 不可用 → 请用户手动输入城市名，应用用 Open-Meteo
//    的 geocoding 接口（免 Key）转经纬度再查天气；
// 5. 还查不到 → 勾选「手动输入天气」填气温和有无雨。

const STORE_WEATHER = 'wardrobe-weather-settings-v1';

const WEATHER_SOURCES = {
  openmeteo: { label: 'Open-Meteo（默认，免费，无需 Key）', needsKey: false, hint: '默认源，免费、无需 Key，直接能用。' },
  caiyun: { label: '彩云天气 Caiyun', needsKey: true, hint: 'Key 去 caiyunapp.com 申请（彩云开放平台）。实时 + 逐日预报。' },
  openweathermap: { label: 'OpenWeatherMap', needsKey: true, hint: 'Key 去 openweathermap.org 申请。免费套餐预报最多未来 5 天。' },
  qweather: { label: '和风天气 QWeather', needsKey: true, hint: 'Key 去 qweather.com 申请（和风天气开发平台）。免费套餐预报最多未来 7 天，不含逐日降水概率。' },
};

function loadWeatherSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORE_WEATHER) || '{}');
  } catch { return {}; }
}

function saveWeatherSettings(s) {
  localStorage.setItem(STORE_WEATHER, JSON.stringify(s));
}

function getWeatherConfig() {
  const s = loadWeatherSettings();
  return { source: s.source || 'openmeteo', keys: s.keys || {} };
}

// ---------- 定位 ----------

// 城市名 → 经纬度（Open-Meteo geocoding 接口，免 Key）
async function geocodeCity(city) {
  const geoRes = await fetch(
    'https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(city) + '&count=1&language=zh&format=json'
  );
  if (!geoRes.ok) throw new Error('城市查询失败，请检查网络。');
  const geo = await geoRes.json();
  if (!geo.results || !geo.results.length) throw new Error('找不到城市「' + city + '」，请换个写法（例如只写城市名，不要带区县或场馆名）。');
  const place = geo.results[0];
  return {
    latitude: place.latitude,
    longitude: place.longitude,
    display: place.name + '（' + (place.admin1 || place.country || '') + '）',
  };
}

// 浏览器定位：拿经纬度。被拒 / 超时 / 不可用都会抛带原因的错，绝不静默失败。
function getBrowserCoords(timeoutMs) {
  const timeout = timeoutMs || 8000;
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('当前浏览器不支持定位（navigator.geolocation 不可用）'));
      return;
    }
    const timer = setTimeout(() => reject(new Error('定位超时（' + timeout / 1000 + ' 秒内没有返回位置）')), timeout);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, display: '当前位置' });
      },
      (err) => {
        clearTimeout(timer);
        const msg = err.code === 1 ? '定位被拒绝（未授权位置权限）'
          : err.code === 2 ? '定位不可用（设备无法获取位置）'
          : '定位超时';
        reject(new Error(msg));
      },
      { timeout, maximumAge: 600000 }
    );
  });
}

// 解析经纬度：填了城市就地理编码；留空就优先浏览器定位；
// 定位拿不到就抛错，提示用户手动输入城市名。
async function resolveCoords(city) {
  if (city && city.trim()) return await geocodeCity(city.trim());
  try {
    return await getBrowserCoords();
  } catch (e) {
    throw new Error('定位失败：' + e.message + '。请在城市框里手动输入城市名（如“南京”），应用会用它查天气。');
  }
}

// ---------- 各数据源（统一返回 { city, days: [{ date, tempMax, tempMin, precipProb, condition }], source }） ----------

const WEATHER_CODE_ZH = {
  0: '晴', 1: '多云', 2: '多云', 3: '阴',
  45: '有雾', 48: '有雾', 51: '毛毛雨', 53: '毛毛雨', 55: '毛毛雨',
  61: '小雨', 63: '中雨', 65: '大雨', 71: '小雪', 73: '中雪', 75: '大雪',
  80: '阵雨', 81: '阵雨', 82: '暴雨', 95: '雷阵雨',
};

async function fetchOpenMeteoByCoords(coords, days, startDate) {
  const startStr = startDate.toISOString().slice(0, 10);
  const end = new Date(startDate);
  end.setDate(end.getDate() + days - 1);
  const endStr = end.toISOString().slice(0, 10);
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + coords.latitude +
    '&longitude=' + coords.longitude +
    '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode' +
    '&timezone=auto&start_date=' + startStr + '&end_date=' + endStr;
  const wRes = await fetch(url);
  if (!wRes.ok) throw new Error('Open-Meteo 请求失败，请检查网络或改用手动输入天气。');
  const w = await wRes.json();
  const d = w.daily;
  const out = { city: coords.display || '', days: [], source: 'Open-Meteo' };
  if (!d || !d.time) return out;
  for (let i = 0; i < d.time.length; i++) {
    out.days.push({
      date: d.time[i],
      tempMax: d.temperature_2m_max[i],
      tempMin: d.temperature_2m_min[i],
      precipProb: d.precipitation_probability_max ? d.precipitation_probability_max[i] : null,
      condition: WEATHER_CODE_ZH[d.weathercode[i]] || '天气代码 ' + d.weathercode[i],
    });
  }
  return out;
}

const CAIYUN_SKYCON_ZH = {
  CLEAR_DAY: '晴', CLEAR_NIGHT: '晴',
  PARTLY_CLOUDY_DAY: '多云', PARTLY_CLOUDY_NIGHT: '多云', CLOUDY: '阴',
  LIGHT_HAZE: '轻度雾霾', MODERATE_HAZE: '中度雾霾', HEAVY_HAZE: '重度雾霾',
  LIGHT_RAIN: '小雨', MODERATE_RAIN: '中雨', HEAVY_RAIN: '大雨', STORM_RAIN: '暴雨',
  FOG: '雾', LIGHT_SNOW: '小雪', MODERATE_SNOW: '中雪', HEAVY_SNOW: '大雪', STORM_SNOW: '暴雪',
  DUST: '浮尘', SAND: '沙尘', WIND: '大风',
};

async function fetchCaiyunByCoords(key, coords, days, startDate) {
  if (!key) throw new Error('彩云天气需要 Key，请先在「天气设置」里填写。');
  const url = 'https://api.caiyunapp.com/v2.6/' + encodeURIComponent(key) + '/' +
    coords.longitude + ',' + coords.latitude + '/daily.json';
  const res = await fetch(url);
  if (!res.ok) throw new Error('彩云天气请求失败（HTTP ' + res.status + '），请检查 Key 是否正确。');
  const data = await res.json();
  if (data.status !== 'ok') throw new Error('彩云天气返回错误：' + (data.error || data.status || '未知错误') + '，请检查 Key。');
  const d = (data.result && data.result.daily) || {};
  const byDate = {};
  (d.temperature || []).forEach((t) => {
    byDate[t.date.slice(0, 10)] = { date: t.date.slice(0, 10), tempMax: t.max, tempMin: t.min, precipProb: null, condition: '' };
  });
  (d.skycon || []).forEach((s) => {
    const row = byDate[s.date.slice(0, 10)];
    if (row) row.condition = CAIYUN_SKYCON_ZH[s.value] || s.value;
  });
  (d.precipitation || []).forEach((p) => {
    const row = byDate[p.date.slice(0, 10)];
    if (row && p.probability !== undefined && p.probability !== null) row.precipProb = Math.round(p.probability * 100);
  });
  const startStr = startDate.toISOString().slice(0, 10);
  const out = { city: coords.display || '', days: [], source: '彩云天气 Caiyun' };
  Object.keys(byDate).sort().forEach((date) => {
    if (date < startStr || out.days.length >= days) return;
    const row = byDate[date];
    if (!row.condition) row.condition = '未知';
    out.days.push(row);
  });
  return out;
}

async function fetchOWMByCoords(key, coords, days, startDate) {
  if (!key) throw new Error('OpenWeatherMap 需要 Key，请先在「天气设置」里填写。');
  const url = 'https://api.openweathermap.org/data/2.5/forecast?lat=' + coords.latitude +
    '&lon=' + coords.longitude + '&appid=' + encodeURIComponent(key) + '&units=metric&lang=zh_cn';
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 401) throw new Error('OpenWeatherMap Key 无效（401），请检查 Key。');
    throw new Error('OpenWeatherMap 请求失败（HTTP ' + res.status + '）。');
  }
  const data = await res.json();
  const byDate = {};
  (data.list || []).forEach((item) => {
    const date = item.dt_txt.slice(0, 10);
    (byDate[date] = byDate[date] || []).push(item);
  });
  const startStr = startDate.toISOString().slice(0, 10);
  const out = { city: (data.city && data.city.name) || coords.display || '', days: [], source: 'OpenWeatherMap' };
  Object.keys(byDate).sort().forEach((date) => {
    if (date < startStr || out.days.length >= days) return;
    const group = byDate[date];
    const tempMax = Math.max.apply(null, group.map((i) => i.main.temp_max));
    const tempMin = Math.min.apply(null, group.map((i) => i.main.temp_min));
    const precipProb = Math.round(Math.max.apply(null, group.map((i) => i.pop || 0)) * 100);
    const counts = {};
    group.forEach((i) => {
      const desc = (i.weather && i.weather[0] && i.weather[0].description) || '';
      if (desc) counts[desc] = (counts[desc] || 0) + 1;
    });
    const condition = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || '';
    out.days.push({ date, tempMax: Math.round(tempMax), tempMin: Math.round(tempMin), precipProb, condition });
  });
  return out;
}

async function fetchQWeatherByCoords(key, coords, days, startDate) {
  if (!key) throw new Error('和风天气需要 Key，请先在「天气设置」里填写。');
  const url = 'https://api.qweather.com/v7/weather/7d?location=' + coords.longitude + ',' + coords.latitude +
    '&key=' + encodeURIComponent(key);
  const res = await fetch(url);
  if (!res.ok) throw new Error('和风天气请求失败（HTTP ' + res.status + '）。');
  const data = await res.json();
  if (data.code !== '200') throw new Error('和风天气返回错误（code ' + data.code + '），请检查 Key。');
  const startStr = startDate.toISOString().slice(0, 10);
  const out = { city: coords.display || '', days: [], source: '和风天气 QWeather' };
  (data.daily || []).forEach((d) => {
    if (d.fxDate < startStr || out.days.length >= days) return;
    out.days.push({
      date: d.fxDate,
      tempMax: Number(d.tempMax),
      tempMin: Number(d.tempMin),
      precipProb: null, // 和风天气 7 日预报不提供逐日降水概率
      condition: d.textDay || '',
    });
  });
  return out;
}

function fetchWeatherBySource(source, coords, days, startDate) {
  const cfg = getWeatherConfig();
  if (source === 'caiyun') return fetchCaiyunByCoords(cfg.keys.caiyun, coords, days, startDate);
  if (source === 'openweathermap') return fetchOWMByCoords(cfg.keys.openweathermap, coords, days, startDate);
  if (source === 'qweather') return fetchQWeatherByCoords(cfg.keys.qweather, coords, days, startDate);
  return fetchOpenMeteoByCoords(coords, days, startDate);
}

// ---------- 对外入口（带回退链） ----------

// 今日天气：返回 { weather: { city, tempMax, tempMin, precipProb, condition, source }, note }
// note 说明实际用的数据源与回退情况，界面会展示给用户。
async function fetchWeatherSmart(city) {
  const today = new Date();
  const coords = await resolveCoords(city);
  const cfg = getWeatherConfig();
  let source = cfg.source;
  let note = '';
  if (source !== 'openmeteo' && !cfg.keys[source]) {
    note = '未配置' + WEATHER_SOURCES[source].label + '的 Key，已自动回退到 Open-Meteo。';
    source = 'openmeteo';
  }
  try {
    const fc = await fetchWeatherBySource(source, coords, 1, today);
    if (!fc.days.length) throw new Error('所选天气源没有返回今日天气。');
    const w = { date: fc.days[0].date, city: fc.city, tempMax: fc.days[0].tempMax, tempMin: fc.days[0].tempMin, precipProb: fc.days[0].precipProb, condition: fc.days[0].condition, source: fc.source };
    return { weather: w, note: (note ? note + ' ' : '') + '天气来源：' + fc.source + '。' };
  } catch (e) {
    if (source !== 'openmeteo') {
      note += '所选天气源请求失败（' + e.message + '），已自动回退到 Open-Meteo。';
      const fc = await fetchOpenMeteoByCoords(coords, 1, today);
      if (!fc.days.length) throw new Error('Open-Meteo 也没有返回今日天气。');
      const w = { date: fc.days[0].date, city: fc.city, tempMax: fc.days[0].tempMax, tempMin: fc.days[0].tempMin, precipProb: fc.days[0].precipProb, condition: fc.days[0].condition, source: fc.source };
      return { weather: w, note: note + ' 天气来源：Open-Meteo。' };
    }
    throw e;
  }
}

// 多日预报（出差用）：返回 { forecast: { city, days, source }, note }
// 目的地城市必填（出差目的地不能靠定位猜）。各源预报天数不同，
// 超出部分只返回能查到的天数，由调用方提示用户。
async function fetchWeatherForecastSmart(city, days, startDate) {
  if (!city || !city.trim()) throw new Error('请填写目的地城市。');
  const coords = await geocodeCity(city.trim());
  const cfg = getWeatherConfig();
  let source = cfg.source;
  let note = '';
  if (source !== 'openmeteo' && !cfg.keys[source]) {
    note = '未配置' + WEATHER_SOURCES[source].label + '的 Key，已自动回退到 Open-Meteo。';
    source = 'openmeteo';
  }
  try {
    const fc = await fetchWeatherBySource(source, coords, days, startDate);
    return { forecast: fc, note: (note ? note + ' ' : '') + '天气来源：' + fc.source + '。' };
  } catch (e) {
    if (source !== 'openmeteo') {
      note += '所选天气源请求失败（' + e.message + '），已自动回退到 Open-Meteo。';
      const fc = await fetchOpenMeteoByCoords(coords, days, startDate);
      return { forecast: fc, note: note + ' 天气来源：Open-Meteo。' };
    }
    throw e;
  }
}

// ---------- 兼容旧入口（Open-Meteo，城市必填） ----------

async function fetchWeather(city) {
  const fc = await fetchOpenMeteoByCoords(await geocodeCity(city), 1, new Date());
  if (!fc.days.length) throw new Error('查不到今日天气。');
  const d = fc.days[0];
  return { date: d.date, city: fc.city, tempMax: d.tempMax, tempMin: d.tempMin, precipProb: d.precipProb, condition: d.condition, source: fc.source };
}

async function fetchWeatherForecast(city, days, startDate) {
  return fetchOpenMeteoByCoords(await geocodeCity(city), days, startDate);
}

function weatherSummary(w) {
  const rain = w.precipProb === null || w.precipProb === undefined ? '' : '，降水概率 ' + w.precipProb + '%';
  return w.city + ' 今天 ' + w.condition + '，' + w.tempMin + '～' + w.tempMax + '℃' + rain;
}

function forecastSummary(fc) {
  if (!fc.days.length) return fc.city + '：该日期超出天气预报范围。';
  return fc.city + '：\n' + fc.days.map((day) =>
    day.date + ' ' + day.condition + '，' + day.tempMin + '～' + day.tempMax + '℃' +
    (day.precipProb === null || day.precipProb === undefined ? '' : '，降水概率 ' + day.precipProb + '%')
  ).join('\n');
}
