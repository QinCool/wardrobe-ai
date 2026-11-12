// 主逻辑：衣柜渲染、添加单品、AI 辅助录入、尺码建议、每日穿搭、导入导出、AI 设置。

let items = loadItems();
let profile = loadProfile();
let currentFilter = '全部';
let pendingPhoto = ''; // 待保存单品的照片（data URL，存本地）

const $ = (id) => document.getElementById(id);

// ---------- 渲染 ----------
function renderQuickbar() {
$('quickbar').innerHTML =
'<span>脚长 <b>' + (profile.footLength || '—') + 'cm</b></span>' +
'<span>中国码 <b>' + (profile.sizeCN || '—') + '</b></span>' +
'<span>长裤腰围 <b>' + (profile.pantsWaist || '—') + 'cm</b></span>' +
'<span>上衣常穿 <b>' + (profile.topSize || '—') + '</b></span>' +
'<button class="edit-link" id="edit-profile-btn" type="button">修改</button>';
$('edit-profile-btn').onclick = () => {
profile.footLength = prompt('脚长（cm）', profile.footLength || '') || profile.footLength;
profile.sizeCN = prompt('鞋子中国码', profile.sizeCN || '') || profile.sizeCN;
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
.map(([label, key]) => '<span>' + label + ' ' + item.measurements[key] + '</span>')
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
(item.price? ' · ¥' + escapeHTML(String(item.price)): '') + '</div>' +
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
'<div><label>' + label + (category === '鞋子' && key!== 'footLength'? '（码数）': '（cm）') + '</label>' +
'<input data-size-key="' + key + '" inputmode="decimal" placeholder="留空表示没有"></div>'
).join('');
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
const prompt = '你是一名服装尺码录入助手。下面是用户粘贴的商品尺码表文字' +
(link? '（商品链接：' + link + '）': '') + '，商品分类是「' + category + '」。\n\n' +
'\n' + (pasted || pageText) + '\n\n' +
'请从中提取这件商品的尺码信息，只返回一个 JSON 对象，不要加任何解释文字：\n' +
'{"name": "商品名（没有就空字符串）", "measurements": {' +
(SIZE_FIELDS[category] || []).map(([, key]) => '"' + key + '": "数值，没有就空字符串"').join(', ') +
'}, "fit": "版型描述，如修身/宽松，没有就空字符串"}\n\n' +
'字段说明（单位厘米，鞋码填码数）：' + fields + '。' +
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
status.textContent = '已按 AI 解析结果填好表单，请核对数字无误后再点「保存单品」。拿不准的字段 AI 已留空。';
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
? fitted.map((i) => '- ' + i.name + '（穿 ' + (i.measurements.sizeCN || i.measurements.sizeEU || '') + '，合身情况：' + (i.fit || '未记录') + '）：' +
Object.entries(i.measurements || {}).map(([k, v]) => k + ' ' + v).join('，')).join('\n')
: '（该分类下暂无已录入的合身单品）';
out.textContent = 'AI 分析中…';
const prompt = '你是一名懂服装尺码的购物助手。用户想买一件新的「' + category + '」，下面是新商品的尺码表：\n\n' + chart +
'\n\n用户已有的合身单品数据（同分类，作为体型基准）：\n' + fittedText +
'\n\n用户身体速查数据：脚长 ' + (profile.footLength || '未知') + 'cm，中国鞋码 ' + (profile.sizeCN || '未知') +
'，长裤腰围 ' + (profile.pantsWaist || '未知') + 'cm，上衣常穿 ' + (profile.topSize || '未知') + '。' +
'\n\n请给出：1）推荐买哪个码；2）理由（拿新商品的尺码数逐项对照用户已合身单品的实测数）；' +
'3）如果尺码表口径不明（如胸围是半围还是全围）要明确指出并提醒用户确认。回答用中文，简洁直接。';
try {
out.textContent = await chatCompletion([
{ role: 'system', content: '你是服装尺码购物助手，回答简洁直接，只依据给出的数字做判断，不确定的地方明说。'},
{ role: 'user', content: prompt},
]);
} catch (e) { out.textContent = '请求失败：' + e.message;}
}

// ---------- 每日穿搭 ----------
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
out.textContent = 'AI 搭配中…';
const list = items.map((i) => '- ' + i.name + '（' + i.category + '，合身：' + (i.fit || '未记录') + '）').join('\n');
const prompt = '你是一名穿搭助手。今天的天气：' + weatherText +
'\n\n用户衣柜里的衣服：\n' + list +
'\n\n请推荐今天的一套穿搭：上衣、下装、鞋子，冷的话加外套；说明每件为什么适合今天的天气。' +
'只用衣柜里有的单品，不要推荐没有的衣服。下雨时优先不怕湿的鞋子。回答用中文，简洁。';
try {
out.textContent = await chatCompletion([
{ role: 'system', content: '你是穿搭助手，只从给出的衣柜清单里搭配，回答简洁。'},
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
