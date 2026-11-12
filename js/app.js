// 主逻辑：衣柜渲染、添加单品、AI 辅助录入、尺码建议、每日穿搭、导入导出、AI 设置。

let items = loadItems();
let profile = loadProfile();
let currentFilter = '全部';
let pendingPhoto = ''; // 待保存单品的照片（data URL，存本地）

const $ = (id) => document.getElementById(id);

// ---------- 单位显示：库里一律存厘米，显示可切英寸 ----------
function unitSuffix() { return profile.unit === 'inch' ? '″' : ''; }
function displayLen(cmValue) {
  if (cmValue === undefined || cmValue === null || cmValue === '') return '';
  return profile.unit === 'inch' ? cmToInch(cmValue) : String(cmValue);
}
function displayLenWithUnit(cmValue) {
  const v = displayLen(cmValue);
  return v === '' ? '' : v + (profile.unit === 'inch' ? '″' : 'cm');
}

// 长度类字段（显示时按单位换算）；鞋码等码数字段不换算
const LENGTH_KEYS = ['length', 'chest', 'shoulder', 'sleeve', 'collar', 'waist', 'pantsLength', 'hip', 'thigh', 'hem', 'rise', 'inseam', 'footLength'];

// ---------- 渲染 ----------
function renderQuickbar() {
$('quickbar').innerHTML =
'<span>脚长 <b>' + (profile.footLength ? displayLenWithUnit(profile.footLength) : '—') + '</b></span>' +
'<span>中国码 <b>' + (profile.sizeCN || '—') + '</b></span>' +
'<span>美国码 <b>' + (profile.sizeUS || '—') + '</b></span>' +
'<span>长裤腰围 <b>' + (profile.pantsWaist ? displayLenWithUnit(profile.pantsWaist) : '—') + '</b></span>' +
'<span>上衣常穿 <b>' + (profile.topSize || '—') + '</b></span>' +
'<button class="edit-link" id="edit-profile-btn" type="button">修改</button>';
$('edit-profile-btn').onclick = () => {
profile.footLength = prompt('脚长（cm）', profile.footLength || '') || profile.footLength;
profile.sizeCN = prompt('鞋子中国码', profile.sizeCN || '') || profile.sizeCN;
profile.sizeUS = prompt('鞋子美国码 US（可选）', profile.sizeUS || '') || profile.sizeUS;
profile.pantsWaist = prompt('长裤腰围（cm）', profile.pantsWaist || '') || profile.pantsWaist;
profile.topSize = prompt('上衣常穿码（如 L）', profile.topSize || '') || profile.topSize;
saveProfile(profile);
renderQuickbar();
};
}

function itemSizesHTML(item) {
const fields = SIZE_FIELDS[item.category] || [];
return fields
.filter(([label, key]) => item.measurements && item.measurements[key]!== undefined && item.measurements[key]!== '')
.map(([label, key]) => {
const raw = item.measurements[key];
const shown = LENGTH_KEYS.includes(key) ? displayLen(raw) + unitSuffix() : raw;
return '<span>' + label + ' ' + shown + '</span>';
})
.join('');
}

function renderItems() {
const list = currentFilter === '全部'? items: items.filter((i) => i.category === currentFilter);
$('item-count').textContent = '共 ' + items.length + ' 件' + (currentFilter === '全部'? '': '，当前分类 ' + list.length + ' 件');
if (!list.length) {
$('items').innerHTML = '<p class="hint">这里还是空的。用下面「添加单品」录入第一件，或点「载入示例数据」看看模板长什么样。</p>';
return;
}
$('items').innerHTML = list.map((item) => {
const fitCls = item.fit && item.fit!== '合身'? ' loose': '';
const photo = item.photo
? '<img src="' + item.photo + '" alt="">'
: '<span>示例图片 / 点添加时上传实拍图</span>';
return '<article class="card item-card">' +
'<div class="item-photo">' + photo + '</div>' +
'<div class="item-body">' +
'<h3>' + escapeHTML(item.name || '未命名单品') + '</h3>' +
'<div class="meta">' + escapeHTML(item.category || '') +
(item.brand? ' · ' + escapeHTML(item.brand): '') +
(item.price? ' · ' + escapeHTML(formatPrice(item.price, item.priceCurrency || 'CNY')): '') + '</div>' +
(item.fit? '<span class="badge' + fitCls + '">' + escapeHTML(item.fit) + '</span>': '') +
'<div class="sizes">' + itemSizesHTML(item) + '</div>' +
(item.note? '<div class="meta">' + escapeHTML(item.note) + '</div>': '') +
'<div class="item-actions"><button type="button" data-del="' + item.id + '">删除</button></div>' +
'</div></article>';
}).join('');
$('items').querySelectorAll('[data-del]').forEach((btn) => {
btn.onclick = () => {
if (!confirm('确定删除这件单品吗？')) return;
items = items.filter((i) => i.id!== btn.dataset.del);
saveItems(items);
renderItems();
};
});
}

function escapeHTML(s) {
return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
}

// ---------- 添加单品表单 ----------
function renderSizeInputs(category) {
const fields = SIZE_FIELDS[category] || [];
$('size-inputs').innerHTML = fields.map(([label, key]) =>
'<div><label>' + label + (category === '鞋子' && key!== 'footLength'? '（码数）': '（cm，存库单位）') + '</label>' +
'<input data-size-key="' + key + '" inputmode="decimal" placeholder="留空表示没有"></div>'
).join('') +
(category === '鞋子'
? '<div><label>快捷换算</label><div class="row" style="gap:8px;"><select id="shoe-autofill-gender" style="flex:0 0 84px;"><option value="men">男款</option><option value="women">女款</option></select><button type="button" id="shoe-autofill-btn" class="narrow">按脚长换算填码</button></div><div class="hint" id="shoe-autofill-status" style="margin-top:4px;">按上方脚长查 US / EU / UK / JP 对照表自动填码。</div></div>'
: '');
const btn = $('shoe-autofill-btn');
if (btn) btn.onclick = () => {
const footEl = $('size-inputs').querySelector('[data-size-key="footLength"]');
const foot = footEl ? footEl.value.trim() : '';
const gender = $('shoe-autofill-gender').value;
const row = shoeSizesFromFootLength(foot, gender);
const st = $('shoe-autofill-status');
if (!row) { st.textContent = '请先在上方脚长栏填入脚长（cm）。'; return; }
const set = (key, val) => { const el = $('size-inputs').querySelector('[data-size-key="' + key + '"]'); if (el) el.value = val; };
set('sizeCN', row.cn); set('sizeEU', row.eu); set('sizeUS', row.us); set('sizeUK', row.uk); set('sizeJP', row.jp);
st.textContent = '已按脚长 ' + foot + 'cm 填好' + (gender === 'women' ? '女款' : '男款') + '对照（US ' + row.us + ' / EU ' + row.eu + ' / UK ' + row.uk + ' / JP ' + row.jp + '）' + (row.approximate ? '，脚长超出对照表范围，为最接近值，请核对官方表。' : '，请核对官方表。');
};
}

function readSizeInputs() {
const out = {};
$('size-inputs').querySelectorAll('[data-size-key]').forEach((el) => {
if (el.value.trim()!== '') out[el.dataset.sizeKey] = el.value.trim();
});
return out;
}

function fillSizeInputs(measurements) {
$('size-inputs').querySelectorAll('[data-size-key]').forEach((el) => {
if (measurements[el.dataset.sizeKey]!== undefined) el.value = measurements[el.dataset.sizeKey];
});
}

function collectForm() {
return {
id: uid(),
name: $('f-name').value.trim(),
category: $('f-category').value,
brand: $('f-brand').value.trim(),
price: $('f-price').value.trim(),
priceCurrency: $('f-currency').value,
fit: $('f-fit').value,
note: $('f-note').value.trim(),
photo: pendingPhoto || '',
measurements: readSizeInputs(),
};
}

function resetForm() {
$('f-name').value = '';
$('f-brand').value = '';
$('f-price').value = '';
$('f-currency').value = 'CNY';
$('f-note').value = '';
$('ai-paste').value = '';
$('ai-link').value = '';
$('ai-parse-status').textContent = '';
pendingPhoto = '';
$('photo-preview').innerHTML = '';
$('f-photo').value = '';
renderSizeInputs($('f-category').value);
}

// ---------- AI 辅助录入 ----------
async function tryFetchProductPage(url) {
try {
const ctrl = new AbortController();
const t = setTimeout(() => ctrl.abort(), 8000);
const res = await fetch(url, { signal: ctrl.signal});
clearTimeout(t);
if (!res.ok) return '';
const text = await res.text();
return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 6000);
} catch {
return ''; // 多数电商页跨域或需登录，读不到是常态，走粘贴文字兜底
}
}

async function aiParseSizeChart() {
const category = $('f-category').value;
const pasted = $('ai-paste').value.trim();
const link = $('ai-link').value.trim();
const status = $('ai-parse-status');
if (!pasted &&!link) { status.textContent = '请先粘贴尺码表文字，或粘贴商品链接。'; return;}
if (!aiConfigured()) { status.textContent = '请先在「AI 设置」里配置好 AI 再用解析功能。'; return;}

status.textContent = 'AI 解析中…';
let pageText = '';
if (link &&!pasted) {
pageText = await tryFetchProductPage(link);
if (!pageText) {
status.textContent = '没能直接读取该商品页（平台多半需登录或防跨域）。请把商品页里的尺码表文字复制粘贴到上方文本框，或把购买截图发给助手查尺码表后再填。';
return;
}
}
const fields = (SIZE_FIELDS[category] || []).map(([label, key]) => label + '(' + key + ')').join('、');
const site = link ? detectSite(link) : { label: '', region: 'unknown' };
const chartUnit = detectUnitFromText(pasted || pageText);
const prompt = '你是一名服装尺码录入助手。下面是用户粘贴的商品尺码表文字' +
(link? '（商品链接：' + link + (site.label? '，站点：' + site.label + '，' + (site.region === 'intl'? '美国/国际站点': site.region === 'cn'? '国内平台': '未知站点') : '') + '）': '') + '，商品分类是「' + category + '」。\n\n' +
'\n' + (pasted || pageText) + '\n\n' +
'请从中提取这件商品的尺码信息，只返回一个 JSON 对象，不要加任何解释文字：\n' +
'{"name": "商品名（没有就空字符串）", "measurements": {' +
(SIZE_FIELDS[category] || []).map(([, key]) => '"' + key + '": "数值，没有就空字符串"').join(', ') +
'}, "fit": "版型描述，如修身/宽松，没有就空字符串", "sourceUnit": "尺码表原单位，cm 或 inch", "siteSizeSystem": "尺码体系，如 US/EU/UK/CN，没有就空字符串"}\n\n' +
'字段说明：' + fields + '。' +
'单位规则（重要）：所有尺寸数值必须换算成厘米（cm）再填；如果尺码表用英寸（inch），按 1 英寸 = 2.54 厘米换算（例如胸围 22 英寸 = 55.9 厘米）；裤腰等以英寸标的（如 32"）同样换算成厘米；' +
'鞋子：如果尺码表给的是 US / EU / UK / JP 任一体系的码数，请按脚长对照换算，把中国码、EU、US、UK、JP 五个字段都尽量填上，脚长填厘米；' +
'如果文字里有多个码数，取最接近常规尺码表的那一行，不要把 S/M/L/2XL 等多个码混成一个数；拿不准的字段留空字符串。';
try {
const reply = await chatCompletion([
{ role: 'system', content: '你是服装尺码录入助手，只输出 JSON。'},
{ role: 'user', content: prompt},
]);
const parsed = extractJSON(reply);
if (parsed.name) $('f-name').value = parsed.name;
if (parsed.measurements) fillSizeInputs(parsed.measurements);
if (parsed.fit) $('f-note').value = parsed.fit;
status.textContent = '已按 AI 解析结果填好表单' +
(parsed.sourceUnit? '（原尺码表单位：' + parsed.sourceUnit + '，已换算成厘米存入）': '') +
(parsed.siteSizeSystem? '，尺码体系：' + parsed.siteSizeSystem: '') +
'，请核对数字无误后再点「保存单品」。拿不准的字段 AI 已留空。';
} catch (e) {
status.textContent = '解析失败：' + e.message + ' 原文已保留在文本框里，请手动填数。';
}
}

// ---------- 尺码建议 ----------
async function aiSizeAdvice() {
const out = $('size-advice-output');
const category = $('size-advice-category').value;
const chart = $('size-advice-chart').value.trim();
if (!chart) { out.textContent = '请先粘贴新商品的尺码表（或商品页里的尺码信息）。'; return;}
if (!aiConfigured()) { out.textContent = '请先在「AI 设置」里配置好 AI。'; return;}
const fitted = items.filter((i) => i.category === category);
const fittedText = fitted.length
? fitted.map((i) => '- ' + i.name + '（合身情况：' + (i.fit || '未记录') + '）：' +
Object.entries(i.measurements || {}).map(([k, v]) => k + ' ' + v).join('，')).join('\n')
: '（该分类下暂无已录入的合身单品）';
out.textContent = 'AI 分析中…';
const region = $('size-advice-region').value;
const chartUnit = detectUnitFromText(chart);
const regionText = region === 'intl'
? '这件新商品来自美国 / 国际站点（Amazon / Nike / adidas / Uniqlo 美国站 / Gap 等），尺码表可能是英寸（inch），尺码体系可能是 US / EU / UK。'
: '这件新商品来自国内平台，尺码表一般是厘米，尺码体系一般是中国码。';
const prompt = '你是一名懂服装尺码的购物助手。用户想买一件新的「' + category + '」。' + regionText + '下面是新商品的尺码表：\n\n' + chart +
'\n\n用户已有的合身单品数据（同分类，作为体型基准；尺寸单位厘米，鞋码见各体系字段）：\n' + fittedText +
'\n\n用户身体速查数据：脚长 ' + (profile.footLength || '未知') + 'cm，中国鞋码 ' + (profile.sizeCN || '未知') + '，美国鞋码 US ' + (profile.sizeUS || '未知') +
'，长裤腰围 ' + (profile.pantsWaist || '未知') + 'cm，上衣常穿 ' + (profile.topSize || '未知') + '。' +
'\n\n规则：1）如果尺码表是英寸（inch），先按 1 英寸 = 2.54 厘米换算成厘米再逐项对照，并在回答里注明原单位与换算；' +
'2）鞋子要按脚长对照 US / EU / UK / JP 体系给建议，并说明是按哪个体系、是否已换算；' +
'3）美版尺码常比同标称的国内版偏大，同一品牌不同系列也可能有差异，给建议时要提醒以官方尺码表为准；' +
'\n\n请给出：1）推荐买哪个码（注明尺码体系，如 US 9 或中国码 L）；2）理由（拿新商品的尺码数逐项对照用户已合身单品的实测数）；' +
'3）如果尺码表口径不明（如胸围是半围还是全围、裤腰是英寸还是厘米）要明确指出并提醒用户确认。回答用中文，简洁直接。';
try {
out.textContent = await chatCompletion([
{ role: 'system', content: '你是服装尺码购物助手，回答简洁直接，只依据给出的数字做判断，不确定的地方明说。'},
{ role: 'user', content: prompt},
]);
} catch (e) { out.textContent = '请求失败：' + e.message;}
}

// ---------- 每日穿搭 ----------
// 汇总今日行程：场合下拉 + 行程文字 + .ics 今日事件 + Google 日历今日事件
async function gatherScheduleText() {
const parts = [];
const occasion = $('schedule-occasion').value;
const text = $('schedule-text').value.trim();
if (occasion) parts.push('今日主要场合：' + occasion);
if (text) parts.push('行程说明：' + text);
if (window._icsTodayEvents && window._icsTodayEvents.length) {
parts.push('导入的 .ics 日历今日日程：\n' + eventsToText(window._icsTodayEvents));
}
if (gcalConnected()) {
try {
const gEvents = await fetchGCalTodayEvents();
if (gEvents.length) parts.push('Google 日历今日日程：\n' + eventsToText(gEvents));
} catch (e) {
parts.push('（Google 日历读取失败：' + e.message + '，已按无日历处理）');
}
}
return parts.join('\n');
}

async function aiOutfitAdvice() {
const out = $('outfit-output');
if (!items.length) { out.textContent = '衣柜还是空的，先录入几件衣服再来搭配。'; return;}
if (!aiConfigured()) { out.textContent = '请先在「AI 设置」里配置好 AI。'; return;}
const city = $('outfit-city').value.trim();
const useManual = $('outfit-manual').checked;
let weatherText = '';
if (useManual) {
weatherText = '手动输入天气：气温 ' + ($('manual-temp').value.trim() || '未知') + '℃，' +
($('manual-rain').checked? '有雨': '无雨') + '。';
} else {
if (!city) { out.textContent = '请填写城市，或勾选手动输入天气。'; return;}
out.textContent = '正在查 ' + city + ' 的天气…';
try {
const w = await fetchWeather(city);
weatherText = weatherSummary(w);
} catch (e) {
out.textContent = '查天气失败：' + e.message + ' 可以勾选「手动输入天气」再试。';
return;
}
}
out.textContent = '正在汇总今日行程…';
const scheduleText = await gatherScheduleText();
out.textContent = 'AI 搭配中…';
const list = items.map((i) => '- ' + i.name + '（' + i.category + '，合身：' + (i.fit || '未记录') + '）').join('\n');
const prompt = '你是一名穿搭助手。今天的天气：' + weatherText +
(scheduleText? '\n\n今天的行程：\n' + scheduleText: '\n\n今天没有提供行程，按天气搭配即可。') +
'\n\n用户衣柜里的衣服：\n' + list +
'\n\n请推荐今天的一套穿搭：上衣、下装、鞋子，冷的话加外套；每件都要说明为什么适合今天的天气和行程' +
'（例如下午有正式会议就选衬衫 + 外套，晚上要运动就选方便活动的鞋子；有约会就选得体一点的搭配）。' +
'只用衣柜里有的单品，不要推荐没有的衣服。下雨时优先不怕湿的鞋子。回答用中文，简洁。';
try {
out.textContent = await chatCompletion([
{ role: 'system', content: '你是穿搭助手，只从给出的衣柜清单里搭配，回答简洁，理由要贴合当天的天气和行程。'},
{ role: 'user', content: prompt},
]);
} catch (e) { out.textContent = '请求失败：' + e.message;}
}

// ---------- 出差 / 旅行 ----------
async function aiTripAdvice() {
const out = $('trip-output');
if (!items.length) { out.textContent = '衣柜还是空的，先录入几件衣服再来搭配。'; return;}
if (!aiConfigured()) { out.textContent = '请先在「AI 设置」里配置好 AI。'; return;}
const city = $('trip-city').value.trim();
const startVal = $('trip-start').value;
const endVal = $('trip-end').value;
if (!city || !startVal || !endVal) { out.textContent = '请填写目的地城市、出发日期和返回日期（也可点「从日历识别出行」自动填）。'; return;}
const start = new Date(startVal + 'T00:00:00');
const end = new Date(endVal + 'T00:00:00');
const days = Math.round((end - start) / 86400000) + 1;
if (days < 1 || days > 30) { out.textContent = '日期不对：返回日期应在出发日期之后，且行程不超过 30 天。'; return;}
out.textContent = '正在查 ' + city + ' 未来 ' + days + ' 天的天气…';
let fc;
try {
fc = await fetchWeatherForecast(city, days, start);
} catch (e) {
out.textContent = '查目的地天气失败：' + e.message + ' 可先确认城市写法，或稍后重试。';
return;
}
if (!fc.days.length) { out.textContent = '该出行日期超出天气预报范围（最多未来 16 天），请临近出发再查。'; return;}
const forecastText = forecastSummary(fc) +
(fc.days.length < days ? '\n（天气只查到 ' + fc.days.length + ' 天，预报最多未来 16 天，后面的天数请按当地季节气候估算）' : '');
out.textContent = 'AI 规划行李中…';
const occasion = $('trip-occasion').value;
const notes = $('trip-notes').value.trim();
const list = items.map((i) => '- ' + i.name + '（' + i.category + '，合身：' + (i.fit || '未记录') + '）').join('\n');
const prompt = '你是一名出差 / 旅行穿搭助手。用户要去 ' + city + ' 出行 ' + days + ' 天（' + startVal + ' 至 ' + endVal + '）。' +
'\n\n目的地未来天气：\n' + forecastText +
(occasion? '\n\n当地主要场合：' + occasion: '') +
(notes? '\n当地行程说明：' + notes: '') +
'\n\n用户衣柜里的衣服：\n' + list +
'\n\n请给出两部分：\n1）每天穿搭：按每天的天气和场合，从衣柜里搭一套，注明日期；\n2）行李清单：列出该带走的衣服（只从衣柜里挑），尽量多功能百搭、少带重复，并逐件说明打包理由（例如某件外套三天都能穿、某双鞋既能开会又能逛街）。\n只用衣柜里有的单品，不要推荐没有的衣服。回答用中文，结构清晰。';
try {
out.textContent = await chatCompletion([
{ role: 'system', content: '你是出差旅行穿搭助手，只从给出的衣柜清单里搭配，回答结构清晰、理由具体。'},
{ role: 'user', content: prompt},
]);
} catch (e) { out.textContent = '请求失败：' + e.message;}
}

// ---------- AI 设置面板 ----------
function renderAISettings() {
const s = loadAISettings();
const sel = $('ai-provider');
sel.innerHTML = Object.entries(PROVIDER_PRESETS)
.map(([key, p]) => '<option value="' + key + '"' + (s.provider === key? ' selected': '') + '>' + p.label + '</option>')
.join('');
const applyPreset = () => {
const p = PROVIDER_PRESETS[sel.value];
$('ai-baseurl').value = s.baseUrl || p.baseUrl;
$('ai-model').value = s.model || p.model;
$('ai-preset-hint').textContent = p.hint;
};
sel.onchange = () => {
const p = PROVIDER_PRESETS[sel.value];
$('ai-baseurl').value = p.baseUrl;
$('ai-model').value = p.model;
$('ai-preset-hint').textContent = p.hint;
};
$('ai-apikey').value = s.apiKey || '';
applyPreset();
$('ai-settings-status').textContent = aiConfigured()? '已配置，可正常使用 AI 功能。': '未配置：填好 Key 后点「保存设置」，再点「测试连接」。';
}

function saveAISettingsFromForm() {
saveAISettings({
provider: $('ai-provider').value,
baseUrl: $('ai-baseurl').value.trim(),
apiKey: $('ai-apikey').value.trim(),
model: $('ai-model').value.trim(),
});
$('ai-settings-status').textContent = aiConfigured()? '已保存。': '已保存，但 Base URL / Key / 模型还不完整。';
}

// ---------- 初始化 ----------
document.addEventListener('DOMContentLoaded', async () => {
await seedExampleIfEmpty();
items = loadItems();
profile = loadProfile();

renderQuickbar();
renderItems();
renderSizeInputs($('f-category').value);
renderAISettings();

// 显示单位切换（cm / inch）：只改显示，库里存的厘米不变
const unitSel = $('unit-select');
unitSel.value = profile.unit || 'cm';
unitSel.onchange = () => {
profile.unit = unitSel.value;
saveProfile(profile);
renderQuickbar();
renderItems();
};

// 鞋码换算器
$('shoe-convert-btn').onclick = () => {
const foot = $('shoe-foot').value.trim();
const gender = $('shoe-gender').value;
const row = shoeSizesFromFootLength(foot, gender);
const out = $('shoe-convert-output');
if (!row) { out.textContent = '请先填写脚长（cm）。'; return; }
out.textContent = '脚长 ' + foot + 'cm（' + (gender === 'women' ? '女款' : '男款') + '）：US ' + row.us + ' · EU ' + row.eu + ' · UK ' + row.uk + ' · JP ' + row.jp + ' · 中国码 ' + row.cn + (row.approximate ? '（脚长超出对照表范围，为最接近值，请以品牌官方表为准）' : '（常见对照，请以品牌官方表为准）');
};

// 分类筛选
document.querySelectorAll('[data-filter]').forEach((btn) => {
btn.onclick = () => {
currentFilter = btn.dataset.filter;
document.querySelectorAll('[data-filter]').forEach((b) => b.classList.toggle('active', b === btn));
renderItems();
};
});

// 添加单品
$('f-category').onchange = () => renderSizeInputs($('f-category').value);
$('f-photo').onchange = async (e) => {
const file = e.target.files[0];
if (!file) return;
try {
pendingPhoto = await fileToDataURL(file);
$('photo-preview').innerHTML = '<img src="' + pendingPhoto + '" alt="照片预览" style="max-width:220px;border-radius:10px;">';
} catch (err) {
alert('照片处理失败：' + err.message);
}
};
$('ai-parse-btn').onclick = aiParseSizeChart;
$('save-item-btn').onclick = () => {
const item = collectForm();
if (!item.name) { alert('请先填写单品名称。'); return;}
items.unshift(item);
saveItems(items);
renderItems();
resetForm();
document.getElementById('items-section').scrollIntoView({ behavior: 'smooth'});
};

// 尺码建议 / 每日穿搭
$('size-advice-btn').onclick = aiSizeAdvice;
$('outfit-btn').onclick = aiOutfitAdvice;
$('outfit-manual').onchange = (e) => { $('manual-weather').style.display = e.target.checked? 'block': 'none';};

// 导入 .ics 日历：解析后只取今日日程，场合自动推断
$('schedule-ics').onchange = async (e) => {
const file = e.target.files[0];
if (!file) return;
try {
const allEvents = parseICS(await file.text());
window._icsAllEvents = allEvents;
const events = todayEvents(allEvents);
window._icsTodayEvents = events;
$('schedule-events').textContent = events.length
? '已导入今日日程（' + events.length + ' 条）：\n' + eventsToText(events)
: '该 .ics 文件里没有找到今日的日程。';
if (events.length && !$('schedule-occasion').value) {
$('schedule-occasion').value = inferOccasion(events[0].summary + ' ' + (events[0].description || ''));
}
} catch (err) {
$('schedule-events').textContent = '解析 .ics 失败：' + err.message;
}
e.target.value = '';
};

// Google 日历（只读 OAuth）：处理授权回调 + 连接/断开
const gcalRedirect = await gcalHandleRedirect();
const gcalSettings = loadCalSettings();
$('gcal-client-id').value = gcalSettings.gcalClientId || '';
const updateGcalStatus = () => {
$('gcal-status').textContent = gcalConnected()
? '已连接 Google 日历（只读），授权有效期内可读取今日日程。'
: '未连接：填 Client ID 后点连接授权。';
};
if (gcalRedirect && gcalRedirect.error) $('gcal-status').textContent = gcalRedirect.error;
else updateGcalStatus();
$('gcal-connect-btn').onclick = async () => {
const clientId = $('gcal-client-id').value.trim();
if (!clientId) { $('gcal-status').textContent = '请先填写 Google OAuth Client ID（见 README「日历与行程」）。'; return; }
$('gcal-status').textContent = '正在跳转 Google 授权页…';
await gcalStartAuth(clientId);
};
$('gcal-disconnect-btn').onclick = () => {
gcalDisconnect();
window._icsTodayEvents = [];
$('schedule-events').textContent = '';
updateGcalStatus();
};

// 出差 / 旅行：生成建议 + 从日历识别出行
$('trip-btn').onclick = aiTripAdvice;
$('trip-detect-btn').onclick = async () => {
const st = $('trip-detect-status');
const all = [];
if (window._icsAllEvents) all.push(...window._icsAllEvents);
if (gcalConnected()) {
st.textContent = '正在读 Google 日历…';
try { all.push(...await fetchGCalEventsRange(60)); }
catch (e) { st.textContent = '读 Google 日历失败：' + e.message; return; }
}
const trips = detectTrips(all);
if (!trips.length) {
st.textContent = all.length
? '日历里没识别到出差 / 旅行行程（需要多日事件，或标题/地点含出差、旅行等词），请手动填写。'
: '还没有导入日历或连接 Google 日历，请先导入 .ics 或连接日历，或手动填写。';
return;
}
const t = trips[0];
const fmt = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
$('trip-start').value = fmt(t.start);
$('trip-end').value = fmt(t.end);
if (t.destination) $('trip-city').value = t.destination;
st.textContent = '已识别出行：' + t.title + '（' + fmt(t.start) + ' 至 ' + fmt(t.end) + '，共 ' + t.days + ' 天' +
(t.destination? '，目的地：' + t.destination: '，目的地请手动填写') + '）' +
(trips.length > 1? '；另有 ' + (trips.length - 1) + ' 个行程未填，可手动改。': '');
};

// AI 设置
$('ai-save-btn').onclick = saveAISettingsFromForm;
$('ai-test-btn').onclick = async () => {
saveAISettingsFromForm();
$('ai-settings-status').textContent = '测试中…';
try { $('ai-settings-status').textContent = await testAIConnection();}
catch (e) { $('ai-settings-status').textContent = '测试失败：' + e.message;}
};

// 导入导出
$('export-btn').onclick = () => exportJSON(items, profile);
$('import-file').onchange = async (e) => {
const file = e.target.files[0];
if (!file) return;
try {
const { items: imported, profile: importedProfile} = parseImport(await file.text());
if (!confirm('将导入 ' + imported.length + ' 件单品，替换当前全部数据，确定吗？（建议先点导出备份）')) return;
items = imported;
profile = {...profile,...importedProfile};
saveItems(items);
saveProfile(profile);
renderQuickbar();
renderItems();
alert('导入完成，共 ' + items.length + ' 件。');
} catch (err) {
alert('导入失败：' + err.message);
}
e.target.value = '';
};
$('load-example-btn').onclick = async () => {
if (!confirm('将用示例数据替换当前全部数据，确定吗？')) return;
localStorage.removeItem(STORE_SEEDED);
await seedExampleIfEmpty();
items = loadItems();
profile = loadProfile();
renderQuickbar();
renderItems();
};
});
