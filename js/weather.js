// 天气：默认用 Open-Meteo（免费、无需 Key）；
// 拿不到天气时，页面提供手动输入温度 / 是否下雨的兜底。

const WEATHER_CODE_ZH = {
  0: '晴', 1: '多云', 2: '多云', 3: '阴',
  45: '有雾', 48: '有雾', 51: '毛毛雨', 53: '毛毛雨', 55: '毛毛雨',
  61: '小雨', 63: '中雨', 65: '大雨', 71: '小雪', 73: '中雪', 75: '大雪',
  80: '阵雨', 81: '阵雨', 82: '暴雨', 95: '雷阵雨',
};

async function fetchWeather(city) {
  const geoRes = await fetch(
    'https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(city) + '&count=1&language=zh&format=json'
  );
  if (!geoRes.ok) throw new Error('城市查询失败，请检查网络或改用手动输入天气。');
  const geo = await geoRes.json();
  if (!geo.results || !geo.results.length) throw new Error('找不到城市「' + city + '」，请换个写法或改用手动输入天气。');
  const place = geo.results[0];
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + place.latitude +
    '&longitude=' + place.longitude +
    '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode' +
    '&timezone=auto&forecast_days=1';
  const wRes = await fetch(url);
  if (!wRes.ok) throw new Error('天气接口请求失败，请改用手动输入天气。');
  const w = await wRes.json();
  const d = w.daily;
  const code = d.weathercode[0];
  return {
    city: place.name + '（' + (place.admin1 || place.country || '') + '）',
    tempMax: d.temperature_2m_max[0],
    tempMin: d.temperature_2m_min[0],
    precipProb: d.precipitation_probability_max ? d.precipitation_probability_max[0] : null,
    condition: WEATHER_CODE_ZH[code] || '天气代码 ' + code,
  };
}

function weatherSummary(w) {
  const rain = w.precipProb === null || w.precipProb === undefined ? '' : '，降水概率 ' + w.precipProb + '%';
  return w.city + ' 今天 ' + w.condition + '，' + w.tempMin + '～' + w.tempMax + '℃' + rain;
}
